/* Teilnehmer-ID: im Echtbetrieb kommt sie per ?id=... von LimeSurvey.
   Testmodus (lokal, file://, oder ?test=1) erlaubt den Durchlauf ohne
   LimeSurvey und erzeugt stattdessen eine zufällige Test-ID. */

const urlParams =
    new URLSearchParams(window.location.search);

const idFromUrl =
    urlParams.get("id");

const isTestMode =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:" ||
    urlParams.get("test") === "1";

const hasValidSession =
    isTestMode ||
    Boolean(idFromUrl);

const participantId =
    isTestMode ?
        ("TEST-" + crypto.randomUUID()) :
        idFromUrl;

console.log(
    "Participant ID:",
    participantId,
    isTestMode ? "(Testmodus, keine echte Studiensitzung)" : ""
);


/* Fisher-Yates Shuffle (mischt eine Kopie des Arrays) */

function shuffle(array) {

    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/* Session-Aufgabenliste aufbauen:
   - Reihenfolge der Taskgruppen wird randomisiert
   - Reihenfolge der 5 Varianten je Gruppe wird randomisiert
   - Innerhalb jeder Gruppe empfiehlt die KI in den ersten
     3 Positionen die richtige, in den letzten 2 Positionen
     die falsche Antwort (inkl. passender Begründung)
   - groupOrder hält fest, an welcher Stelle eine Gruppe in
     der randomisierten Reihenfolge durchlaufen wurde
   - isFirstInGroup / isLastInGroup markieren die erste bzw.
     letzte Aufgabe einer Gruppe */

function buildSessionTasks(groups) {

    const sessionTasks = [];

    shuffle(groups).forEach((group, groupIndex) => {

        const groupOrder = groupIndex + 1;

        shuffle(group.variants).forEach((variant, index) => {

            const groupPosition = index + 1;

            const aiRecommendsCorrectly =
                groupPosition <= 3;

            const wrongAnswer =
                group.options.find(
                    option => option !== variant.correctAnswer
                );

            sessionTasks.push({

                id: variant.variantId,
                groupId: group.groupId,
                groupLabel: group.groupLabel,
                groupOrder: groupOrder,
                groupPosition: groupPosition,
                isFirstInGroup:
                    groupPosition === 1,
                isLastInGroup:
                    groupPosition === group.variants.length,

                groupIntro: group.groupIntro,

                prompt: group.prompt,
                chatIntro: group.chatIntro,
                options: group.options,

                image: variant.image,
                table: variant.table,
                table1: variant.table1,
                table2: variant.table2,
                information: variant.information,
                hotelName: variant.hotelName,
                location: variant.location,

                correctAnswer: variant.correctAnswer,

                aiRecommendation:
                    aiRecommendsCorrectly
                        ? variant.correctAnswer
                        : wrongAnswer,

                aiExplanation:
                    aiRecommendsCorrectly
                        ? variant.explanationIfCorrect
                        : variant.explanationIfWrong
            });
        });
    });

    return sessionTasks;
}

/* Fortschritt pro Teilnehmer-ID im localStorage sichern, damit ein
   einfacher Seiten-Reload (z. B. versehentlich F5) die Studie an der
   gleichen Stelle fortsetzt, statt Aufgaben doppelt zu stellen.
   Ein Hard-Refresh (Strg+Shift+R) sowie der Testmodus starten
   bewusst von vorne. */

const progressStorageKey =
    (!isTestMode && idFromUrl) ?
        ("abp_progress_" + idFromUrl) :
        null;

/* Erkennt einen Hard-Refresh anhand der Navigation-/Resource-Timing-Daten:
   Bei einem normalen Reload beantwortet der Server das HTML meist aus dem
   Cache oder per 304 (kleines transferSize). Ein Hard-Refresh erzwingt das
   Umgehen des Caches, wodurch die Seite vollständig neu übertragen wird. */

function isHardReload() {

    try {

        const [navigationEntry] =
            performance.getEntriesByType("navigation");

        if (!navigationEntry || navigationEntry.type !== "reload") {

            return false;
        }

        return (
            navigationEntry.transferSize > 0 &&
            navigationEntry.transferSize >= navigationEntry.encodedBodySize
        );

    } catch (error) {

        return false;
    }
}

function loadStoredProgress() {

    if (!progressStorageKey || isHardReload()) {

        return null;
    }

    try {

        const raw =
            localStorage.getItem(progressStorageKey);

        return raw ? JSON.parse(raw) : null;

    } catch (error) {

        console.warn(
            "Gespeicherter Fortschritt konnte nicht gelesen werden:",
            error
        );

        return null;
    }
}

const storedProgress =
    loadStoredProgress();

const isFreshSession =
    !(
        storedProgress &&
        Array.isArray(storedProgress.tasks) &&
        storedProgress.tasks.length > 0
    );

/* Bei fortgesetzter Sitzung dieselbe (bereits randomisierte)
   Aufgabenliste weiterverwenden, sonst neu erzeugen */

const tasks =
    isFreshSession ?
        buildSessionTasks(taskGroups) :
        storedProgress.tasks;

/* Anzahl Blöcke: die Aufgabenblöcke plus der abschließende
   Bewertungsblock (Mensch vs. KI) */

const totalBlocks =
    taskGroups.length + 1;

/* Bewertungsblock (letzter Block): Einleitung */

const ratingBlock = {

    label:
        "Einschätzung Mensch und KI",

    // TODO: Wortlaut der Einleitung zum Bewertungsblock anpassen
    intro:
        "[PLATZHALTER] In diesem letzten Block sehen Sie zu jedem Aufgabentyp " +
        "noch einmal ein Beispiel. Bitte schätzen Sie jeweils ein, wie gut " +
        "ein Mensch und wie gut eine KI solche Aufgaben lösen kann."
};

/* Reihenfolge der Bewertungsbildschirme = Reihenfolge, in der die
   Blöcke im Aufgabenteil durchlaufen wurden */

function buildRatingGroups(sessionTasks) {

    return sessionTasks
        .filter(
            task => task.isFirstInGroup
        )
        .map(
            task => ({
                groupId: task.groupId,
                groupOrder: task.groupOrder
            })
        );
}

const ratingGroups =
    buildRatingGroups(tasks);

/* Experiment-Zustand */

let currentTask = 0;

let firstAnswer = null;

let waitingForSecondAnswer = false;

/* Antwortzeiten in ganzen Millisekunden:
   - erste Antwort: ab Anzeige der Aufgabe
   - zweite Antwort: ab Anzeige der KI-Empfehlung
     (die Tipp-Animation zählt nicht mit) */

let taskShownAt = null;

let aiShownAt = null;

let firstResponseTimeMs = null;

/* Bewertungsblock: läuft er gerade, und welcher Bildschirm ist dran? */

let inRatingBlock = false;

let currentRating = 0;

let ratingShownAt = null;

/* Gespeicherten Stand übernehmen bzw. neuen Stand sichern */

if (!isFreshSession) {

    currentTask =
        storedProgress.currentTask || 0;

    inRatingBlock =
        Boolean(storedProgress.inRatingBlock);

    currentRating =
        storedProgress.currentRating || 0;
}

function saveProgress() {

    if (!progressStorageKey) {

        return;
    }

    try {

        localStorage.setItem(
            progressStorageKey,
            JSON.stringify({
                tasks: tasks,
                currentTask: currentTask,
                inRatingBlock: inRatingBlock,
                currentRating: currentRating
            })
        );

    } catch (error) {

        console.warn(
            "Fortschritt konnte nicht gespeichert werden:",
            error
        );
    }
}

if (isFreshSession) {

    saveProgress();
}

/* Erzeugt ein <table>-Element aus Kopf- und Datenzeilen.
   Enthält eine Zeile weniger Zellen als Kopfspalten vorhanden sind
   (z.B. Interessenähnlichkeit), spannt die letzte Zelle über die
   verbleibenden Spalten. */

function buildDataTable(tableData, className) {

    const table =
        document.createElement("table");

    table.className =
        className;


    // Tabellenkopf

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    tableData.headers.forEach(
        header => {

            const th =
                document.createElement("th");

            th.textContent =
                header;

            headerRow.appendChild(
                th
            );
        }
    );

    thead.appendChild(
        headerRow
    );

    table.appendChild(
        thead
    );


    // Tabellenkörper

    const tbody =
        document.createElement("tbody");

    tableData.rows.forEach(
        row => {

            const tr =
                document.createElement("tr");

            row.forEach(
                (cell, index) => {

                    const td =
                        document.createElement("td");

                    td.textContent =
                        cell;

                    const isLastCell =
                        index === row.length - 1;

                    const missingCells =
                        tableData.headers.length - row.length;

                    if (isLastCell && missingCells > 0) {

                        td.colSpan =
                            missingCells + 1;
                    }

                    tr.appendChild(
                        td
                    );
                }
            );

            tbody.appendChild(
                tr
            );
        }
    );

    table.appendChild(
        tbody
    );

    return table;
}

/* Aufgabeninhalt (Aufgabentext, Foto, Tabelle(n), Text) in einen
   Container schreiben. Wird für die echten Aufgaben und für die
   ausgegrauten Beispiele im Bewertungsblock verwendet. */

function renderTaskContent(container, content) {

    // Inhalt zunächst leeren

    container.innerHTML = "";


    /* Aufgabentext */

    const prompt =
        document.createElement("p");

    prompt.textContent =
        content.prompt;

    container.appendChild(
        prompt
    );

    /* Foto (kann zusätzlich zu einer Tabelle auftreten, z.B. Immobilien) */

    if (content.image) {

        const image =
            document.createElement("img");

        image.src =
            content.image;

        image.alt =
            "Foto konnte nicht geladen werden. Bitte laden Sie die " +
            "Seite neu – Ihr Fortschritt bleibt erhalten.";

        image.className =
            "task-image";

        container.appendChild(
            image
        );
    }

    /* Tabelle(n) */

    if (content.groupId === "speed_dating") {

        // Tabelle 1: Stammdaten & Interessenähnlichkeit

        container.appendChild(
            buildDataTable(
                content.table1,
                "task-table task-table--speed-dating"
            )
        );

        // Hinweis zwischen den beiden Tabellen

        const tableNote =
            document.createElement("p");

        tableNote.className =
            "table-note";

        tableNote.textContent =
            "Die folgenden Werte zeigen, wie diese Person ihr Gegenüber eingeschätzt hat " +
            "(auf einer Skala von 1-10).";

        container.appendChild(
            tableNote
        );

        // Tabelle 2: Bewertungen

        container.appendChild(
            buildDataTable(
                content.table2,
                "task-table task-table--speed-dating"
            )
        );

    } else if (content.table) {

        container.appendChild(
            buildDataTable(
                content.table,
                "task-table"
            )
        );
    }

    /* Text */

    if (content.information) {

        if (content.hotelName && content.location) {

            const hotelHeading =
                document.createElement("p");

            hotelHeading.className =
                "hotel-heading";

            hotelHeading.textContent =
                `Bewertung von ${content.hotelName} in ${content.location}`;

            container.appendChild(
                hotelHeading
            );
        }

        const informationBox =
            document.createElement("div");

        informationBox.className =
            "information-box";

        informationBox.textContent =
            content.information;

        container.appendChild(
            informationBox
        );
    }
}

/* Aufgabe laden */

function loadTask() {

    const task =
        tasks[currentTask];

    /* Fortschrittsanzeige */

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${task.groupOrder} von ${totalBlocks}`;


    /* Titel */

    document.getElementById(
        "task-title"
    ).textContent =
        `Aufgabe ${task.groupPosition}`;

    /* Aufgabenbereich */

     const taskDescription =
        document.getElementById(
            "task-description"
        );

    renderTaskContent(
        taskDescription,
        task
    );

    /* Chat zurücksetzen */

    const chatMessages =
        document.getElementById(
            "chat-messages"
        );

    chatMessages.innerHTML = "";

    const introMessage =
        document.createElement("div");

    introMessage.className =
        "message bot-message";

    const introAvatar =
        document.createElement("div");

    introAvatar.className =
        "avatar";

    introAvatar.textContent =
        "AI";

    const introContent =
        document.createElement("div");

    introContent.className =
        "message-content";

    const introText =
        document.createElement("p");

    introText.textContent =
        task.chatIntro ||
        "Bitte geben Sie Ihre Antwort auf die Aufgabe ein.";

    introContent.appendChild(
        introText
    );

    introMessage.appendChild(
        introAvatar
    );

    introMessage.appendChild(
        introContent
    );

    chatMessages.appendChild(
        introMessage
    );

    /* Zustand zurücksetzen */

     firstAnswer =
        null;

    waitingForSecondAnswer =
        false;

    aiShownAt =
        null;

    firstResponseTimeMs =
        null;

    taskShownAt =
        Date.now();

    /* Antwortbuttons erzeugen */

     createAnswerButtons(
        task.options
    );

    /* Neue Aufgabe immer von oben beginnen */

    window.scrollTo(
        0,
        0
    );
}

/* Antwortbuttons erzeugen */
function createAnswerButtons(
    options
) {

    const answerArea =
        document.querySelector(
            ".answer-options"
        );

    answerArea.innerHTML = "";


    options.forEach(
        option => {

            const button =
                document.createElement("button");

            button.className =
                "answer-button";

            button.textContent =
                option;

            button.dataset.answer =
                option;

            answerArea.appendChild(
                button
            );
        }
    );


    enableAnswerButtons();
}

/* Nutzerantwort in den Chat schreiben */

function addUserMessage(
    answer
) {

    const chat =
        document.getElementById(
            "chat-messages"
        );


    const message =
        document.createElement("div");

    message.className =
        "message user-message";


    message.innerHTML = `

        <div class="message-content">

            <p>
                ${escapeHtml(answer)}
            </p>

        </div>

        <div class="avatar">
            Du
        </div>

    `;


    chat.appendChild(
        message
    );


    chat.scrollTop =
        chat.scrollHeight;
}


/* HTML escapen */

function escapeHtml(
    text
) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}

/* KI-Ladeanimation */

function showTypingIndicator() {

    const chat =
        document.getElementById(
            "chat-messages"
        );


    const message =
        document.createElement("div");

    message.id =
        "typing-message";

    message.className =
        "message bot-message";


    message.innerHTML = `

        <div class="avatar">
            AI
        </div>

        <div class="message-content">

            <div class="typing-indicator">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    chat.appendChild(
        message
    );


    chat.scrollTop =
        chat.scrollHeight;
}

/* vorgefertigte KI-Antwort */

function showAIResponse() {

    const typing =
        document.getElementById(
            "typing-message"
        );


    if (typing) {

        typing.remove();
    }


    const task =
        tasks[currentTask];


    const chat =
        document.getElementById(
            "chat-messages"
        );


    const message =
        document.createElement("div");

    message.className =
        "message bot-message";


    message.innerHTML = `

        <div class="avatar">
            AI
        </div>

        <div class="message-content">

            <p>
                Ich habe die vorliegenden
                Informationen analysiert.
            </p>

            <p>
                Meine Empfehlung lautet:
            </p>

            <p>
                <strong>
                    ${escapeHtml(
                        task.aiRecommendation
                    )}
                </strong>
            </p>

            ${
                task.aiExplanation
                    ? `<p>${escapeHtml(task.aiExplanation)}</p>`
                    : ""
            }

        </div>

    `;


    chat.appendChild(
        message
    );


    chat.scrollTop =
        chat.scrollHeight;


    waitingForSecondAnswer =
        true;

    aiShownAt =
        Date.now();


    enableAnswerButtons();
}

/* Daten an Supabase senden */

async function saveTrial(secondAnswer) {

    const task = tasks[currentTask];

    const firstAnswerCorrect =
        firstAnswer === task.correctAnswer;

    const secondAnswerCorrect =
        secondAnswer === task.correctAnswer;

    const changedAnswer =
        firstAnswer !== secondAnswer;

    const secondResponseTimeMs =
        aiShownAt !== null ?
            Date.now() - aiShownAt :
            null;

    const trialData = {

        participant_id:
            participantId,

        task_number:
            currentTask + 1,

        task_id:
            task.id,

        group_id:
            task.groupId,

        group_position:
            task.groupPosition,

        first_answer:
            firstAnswer,

        ai_recommendation:
            task.aiRecommendation,

        ai_explanation:
            task.aiExplanation,

        second_answer:
            secondAnswer,

        correct_answer:
            task.correctAnswer,

        first_answer_correct:
            firstAnswerCorrect,

        second_answer_correct:
            secondAnswerCorrect,

        changed_answer:
            changedAnswer,

        first_response_time_ms:
            firstResponseTimeMs,

        second_response_time_ms:
            secondResponseTimeMs
    };


    // Nur im Testmodus ausgeben, damit Teilnehmende in der Konsole
    // keine richtigen Antworten / KI-Bedingungen sehen

    if (isTestMode) {

        console.log(
            "DATEN AN SUPABASE:",
            trialData
        );
    }


    const {
        error
    } = await supabaseClient
        .from("trials")
        .insert(
            trialData
        );


    if (error) {

        console.error(
            "Supabase error:",
            error
        );

        throw error;
    }


    console.log(
        "Task gespeichert:",
        task.id
    );
}


/* Antwortbuttons aktivieren */

function enableAnswerButtons() {

    const buttons =
        document.querySelectorAll(
            ".answer-options .answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                false;


            button.onclick =
                async () => {

                    const answer =
                        button.dataset.answer;


                    // ========================================
                    // ERSTE ANTWORT
                    // ========================================

                    if (
                        !waitingForSecondAnswer
                    ) {

                        firstAnswer =
                            answer;

                        firstResponseTimeMs =
                            taskShownAt !== null ?
                                Date.now() - taskShownAt :
                                null;


                        addUserMessage(
                            answer
                        );


                        disableAnswerButtons();


                        showTypingIndicator();


                        // KI erscheint nach
                        // 1,8 Sekunden

                        setTimeout(
                            showAIResponse,
                            1800
                        );


                    }

                    // ========================================
                    // ZWEITE ANTWORT
                    // ========================================

                    else {

                        addUserMessage(
                            answer
                        );


                        disableAnswerButtons();


                        try {

                            await saveTrial(
                                answer
                            );


                            nextTask();


                        }

                        catch (error) {

                            console.error(
                                error
                            );


                            document
                                .getElementById(
                                    "status-message"
                                )
                                .textContent =
                                "Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";


                            enableAnswerButtons();
                        }
                    }
                };
        }
    );
}


/* Buttons deaktivieren */

function disableAnswerButtons() {

    const buttons =
        document.querySelectorAll(
            ".answer-options .answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;
        }
    );
}


/* Ansicht umschalten: blendet genau eine Ansicht ein.
   "task" zeigt Aufgabenbereich und Chat gemeinsam. */

const viewSections = {

    "study-intro": ["study-intro-section"],

    "group-intro": ["group-intro-section"],

    "task": ["task-section", "chat-section"],

    "rating": ["rating-section"]
};

function showView(viewName) {

    Object.entries(viewSections).forEach(
        ([name, sectionIds]) => {

            sectionIds.forEach(
                sectionId => {

                    document.getElementById(
                        sectionId
                    ).hidden =
                        name !== viewName;
                }
            );
        }
    );

    window.scrollTo(
        0,
        0
    );
}


/* Einleitungsbildschirm für den gesamten Aufgabenteil anzeigen */

function showStudyIntro() {

    showView("study-intro");
}


/* Gruppen-Einleitungsbildschirm anzeigen */

function showGroupIntro(task) {

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${task.groupOrder} von ${totalBlocks}`;

    document.getElementById(
        "group-intro-title"
    ).textContent =
        task.groupLabel;

    document.getElementById(
        "group-intro-text"
    ).textContent =
        task.groupIntro || "";

    showView("group-intro");
}


/* Aktuelle Aufgabe anzeigen: bei der ersten Aufgabe eines
   Blocks zuerst die Gruppen-Einleitung */

function goToCurrentTask() {

    const task =
        tasks[currentTask];

    if (task.isFirstInGroup) {

        showGroupIntro(
            task
        );

    } else {

        showView("task");

        loadTask();
    }
}


/* Nächste Aufgabe */

function nextTask() {

    currentTask++;

    saveProgress();


    if (
        currentTask >=
        tasks.length
    ) {

        startRatingBlock();

        return;
    }


    goToCurrentTask();
}


/* Für Testing: Direkt zum Bewertungsblock springen */

function startRatingBlock() {

    inRatingBlock =
        true;

    currentRating =
        0;

    saveProgress();

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${totalBlocks} von ${totalBlocks}`;

    document.getElementById(
        "group-intro-title"
    ).textContent =
        ratingBlock.label;

    document.getElementById(
        "group-intro-text"
    ).textContent =
        ratingBlock.intro;

    showView("group-intro");
}


/* Bewertungsbildschirm: ausgegrautes Beispiel eines Aufgabentyps */

function showRatingScreen() {

    const group =
        taskGroups.find(
            candidate =>
                candidate.groupId === ratingGroups[currentRating].groupId
        );

    const exampleVariant =
        group.variants.find(
            variant => variant.variantId === group.exampleVariantId
        ) ||
        group.variants[0];

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${totalBlocks} von ${totalBlocks}`;

    document.getElementById(
        "rating-progress"
    ).textContent =
        `Einschätzung ${currentRating + 1} von ${ratingGroups.length}`;

    document.getElementById(
        "rating-title"
    ).textContent =
        group.groupLabel;

    renderTaskContent(
        document.getElementById(
            "rating-example"
        ),
        {
            ...exampleVariant,
            groupId: group.groupId,
            prompt: group.prompt
        }
    );

    /* Antwortoptionen nur zur Orientierung, nicht klickbar */

    const exampleOptions =
        document.getElementById(
            "rating-example-options"
        );

    exampleOptions.innerHTML = "";

    group.options.forEach(
        option => {

            const button =
                document.createElement("button");

            button.className =
                "answer-button";

            button.textContent =
                option;

            button.disabled =
                true;

            button.tabIndex =
                -1;

            exampleOptions.appendChild(
                button
            );
        }
    );

    resetRatingSliders();

    ratingShownAt =
        Date.now();

    showView("rating");
}


/* Slider Mensch / KI */

const ratingSliderIds = [
    "rating-human",
    "rating-ai"
];

function resetRatingSliders() {

    ratingSliderIds.forEach(
        sliderId => {

            const slider =
                document.getElementById(
                    sliderId
                );

            slider.value =
                0;

            slider.classList.add(
                "untouched"
            );

            document.getElementById(
                `${sliderId}-value`
            ).textContent =
                "–";
        }
    );

    updateRatingSubmitState();
}

function markSliderTouched(slider) {

    slider.classList.remove(
        "untouched"
    );

    document.getElementById(
        `${slider.id}-value`
    ).textContent =
        slider.value;

    updateRatingSubmitState();
}

/* Weiter erst, wenn beide Slider bewegt wurden */

function updateRatingSubmitState() {

    const allTouched =
        ratingSliderIds.every(
            sliderId =>
                !document.getElementById(
                    sliderId
                ).classList.contains(
                    "untouched"
                )
        );

    document.getElementById(
        "rating-submit"
    ).disabled =
        !allTouched;

    document.getElementById(
        "rating-hint"
    ).hidden =
        allTouched;
}

ratingSliderIds.forEach(
    sliderId => {

        const slider =
            document.getElementById(
                sliderId
            );

        // "input" deckt Ziehen und Tastatur ab, "pointerdown" auch
        // einen Klick genau auf den aktuellen Wert (z.B. 0)

        slider.addEventListener(
            "input",
            () => markSliderTouched(slider)
        );

        slider.addEventListener(
            "pointerdown",
            () => markSliderTouched(slider)
        );
    }
);


/* Einschätzung an Supabase senden */

async function saveGroupRating(humanRating, aiRating) {

    const ratingGroup =
        ratingGroups[currentRating];

    const responseTimeMs =
        ratingShownAt !== null ?
            Date.now() - ratingShownAt :
            null;

    const {
        error
    } = await supabaseClient
        .from("group_ratings")
        .insert({

            participant_id:
                participantId,

            group_id:
                ratingGroup.groupId,

            group_order:
                ratingGroup.groupOrder,

            human_rating:
                humanRating,

            ai_rating:
                aiRating,

            rating_difference:
                humanRating - aiRating,

            response_time_ms:
                responseTimeMs
        });


    if (error) {

        console.error(
            "Supabase error:",
            error
        );

        throw error;
    }


    console.log(
        "Einschätzung gespeichert:",
        ratingGroup.groupId
    );
}


/* Nächster Bewertungsbildschirm bzw. Abschluss */

function nextRating() {

    currentRating++;

    saveProgress();

    if (
        currentRating >=
        ratingGroups.length
    ) {

        showCompletion();

        return;
    }

    showRatingScreen();
}


/* Abschluss */

function showCompletion() {

    showView("task");

    document.getElementById(
        "task-counter"
    ).textContent =
        "Studie abgeschlossen";


    document.getElementById(
        "task-title"
    ).textContent =
        "Vielen Dank!";


    document.getElementById(
        "task-description"
    ).innerHTML = `

        <p>
            Sie haben alle ${tasks.length} Aufgaben
            erfolgreich bearbeitet.
        </p>

    `;


    document.getElementById(
        "chat-messages"
    ).innerHTML = `

        <div class="message bot-message">

            <div class="avatar">
                AI
            </div>

            <div class="message-content">

                <p>
                    ${
                        isTestMode ?
                            "Vielen Dank für Ihre Teilnahme. (Testmodus – keine Weiterleitung.)" :
                            "Vielen Dank für Ihre Teilnahme. Sie werden gleich zur Umfrage zurückgeleitet …"
                    }
                </p>

            </div>

        </div>

    `;


    document.querySelector(
        ".answer-area"
    ).style.display =
        "none";

    window.scrollTo(
        0,
        0
    );


    if (!isTestMode) {

        setTimeout(
            () => {

                window.location.href =
                    EXIT_SURVEY_URL +
                    "?id=" +
                    encodeURIComponent(
                        participantId
                    );
            },
            EXIT_REDIRECT_DELAY_MS
        );
    }
}


/* Fehlerfall: Seite wurde ohne gültige Teilnehmer-ID aufgerufen
   (z. B. direkter Aufruf statt über den Studienlink) */

function showMissingIdError() {

    showView("task");

    document.getElementById(
        "task-counter"
    ).textContent =
        "Fehler";

    document.getElementById(
        "task-title"
    ).textContent =
        "Diese Seite kann nicht direkt aufgerufen werden";

    document.getElementById(
        "task-description"
    ).innerHTML = `

        <p>
            Für die Studie fehlt eine gültige Teilnehmer-Kennung.
            Bitte starten Sie die Studie über den Ihnen zugesandten
            Umfrage-Link.
        </p>

    `;

    document.getElementById(
        "chat-messages"
    ).innerHTML = "";

    document.querySelector(
        ".answer-area"
    ).style.display =
        "none";
}


/* Studien-Einleitung: Weiter-Button */

document.getElementById(
    "study-intro-continue"
).addEventListener(
    "click",
    () => {

        goToCurrentTask();
    }
);


/* Gruppen-Einleitung: Weiter-Button */

document.getElementById(
    "group-intro-continue"
).addEventListener(
    "click",
    () => {

        if (inRatingBlock) {

            showRatingScreen();

            return;
        }

        showView("task");

        loadTask();
    }
);


/* Bewertungsbildschirm: Weiter-Button */

document.getElementById(
    "rating-submit"
).addEventListener(
    "click",
    async () => {

        const submitButton =
            document.getElementById(
                "rating-submit"
            );

        submitButton.disabled =
            true;

        try {

            await saveGroupRating(
                Number(
                    document.getElementById(
                        "rating-human"
                    ).value
                ),
                Number(
                    document.getElementById(
                        "rating-ai"
                    ).value
                )
            );

            document.getElementById(
                "status-message"
            ).textContent = "";

            nextRating();

        } catch (error) {

            console.error(
                error
            );

            document
                .getElementById(
                    "status-message"
                )
                .textContent =
                "Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";

            submitButton.disabled =
                false;
        }
    }
);


/* START */

if (hasValidSession) {

    if (isFreshSession) {

        showStudyIntro();

    } else if (inRatingBlock && currentRating >= ratingGroups.length) {

        showCompletion();

    } else if (inRatingBlock && currentRating > 0) {

        showRatingScreen();

    } else if (inRatingBlock || currentTask >= tasks.length) {

        // Aufgabenteil fertig, Bewertungsblock noch nicht begonnen
        // bzw. erst dessen Einleitung gesehen

        startRatingBlock();

    } else {

        goToCurrentTask();
    }

} else {

    showMissingIdError();
}
