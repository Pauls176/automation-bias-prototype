/* Teilnehmer-ID: als URL-Paramter von LimeSurvey übergeben */

const urlParams =
    new URLSearchParams(window.location.search);

const idFromUrl =
    urlParams.get("id");

/* Testmodus, lokal oder im Broswer mit /?test=1 */
const isTestMode =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:" ||
    urlParams.get("test") === "1";

const hasValidSession =
    isTestMode ||
    Boolean(idFromUrl);

// Im Testmodus wird eine zufällige Test-ID erzeugt

let participantId;

if (isTestMode) {

    participantId = "TEST-" + crypto.randomUUID();
    
        console.log(
        "Participant ID:",
        participantId,
        "(Testmodus, keine echte Studiensitzung)"
    );

} else {

    // sonst wird die ID aus der URL übernommen 
    participantId =
        idFromUrl;

    console.log(
        "Participant ID:",
        participantId
    );
}


/* Fisher-Yates Shuffle (mischt eine Kopie des Arrays) */

function shuffle(array) {

    // Kopie anlegen, damit das Original-Array unverändert bleibt

    const shuffled = array.slice();

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        // Elemente an Position i und j vertauschen

        const temp =
            shuffled[i];

        shuffled[i] =
            shuffled[j];

        shuffled[j] =
            temp;
    }

    return shuffled;
}

/* Session-Aufgabenliste aufbauen:
   - Randomisierung der Aufgabenblöcke (taskGroups)
   - Randomisierung der 5 Aufgaben (variants) je Block
   - (Innerhalb eines Blocks) sind die KI-Empfehlungen ersten drei korrekt
     und letzten beiden inkorrekt (inkl. passender Begründung)
   - groupOrder hält fest, an welcher Stelle eine Gruppe in
     der randomisierten Reihenfolge durchlaufen wurde
   - isFirstInGroup / isLastInGroup markieren die erste bzw.
     letzte Aufgabe einer Gruppe */

function buildSessionTasks(groups) {

    const sessionTasks = [];

    const shuffledGroups =
        shuffle(groups);

    for (let groupIndex = 0; groupIndex < shuffledGroups.length; groupIndex++) {

        const group =
            shuffledGroups[groupIndex];

        const groupOrder = groupIndex + 1;

        const shuffledVariants =
            shuffle(group.variants);

        for (let index = 0; index < shuffledVariants.length; index++) {

            const variant =
                shuffledVariants[index];

            const groupPosition = index + 1;

            const aiRecommendsCorrectly =
                groupPosition <= 3;

            // Falsche Antwort (wird für die aiRecommendation gebraucht)

            let wrongAnswer = null;

            for (const option of group.options) {

                if (option !== variant.correctAnswer) {

                    wrongAnswer = option;

                    break;
                }
            }

            // KI-Empfehlung und Begründung: richtig oder falsch

            let aiRecommendation;

            let aiExplanation;

            if (aiRecommendsCorrectly) {

                aiRecommendation =
                    variant.correctAnswer;

                aiExplanation =
                    variant.explanationIfCorrect;

            } else {

                aiRecommendation =
                    wrongAnswer;

                aiExplanation =
                    variant.explanationIfWrong;
            }

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

                aiRecommendation: aiRecommendation,

                aiExplanation: aiExplanation
            });
        }
    }

    return sessionTasks;
}

/* Fortschritt pro Teilnehmer-ID im localStorage sichern (damit ein
   Teilnehmer bei Seiten-Refresh nicht seinen Fortschritt verliert.
   Für Test-Zwecke startet ein Hard-Refresh (Strg+Shift+R) und der Testmodus
   immer von vorne. */

let progressStorageKey = null;

if (!isTestMode && idFromUrl) {

    progressStorageKey =
        "abp_progress_" + idFromUrl;
}

/* Erkennt einen Hard-Refresh anhand des Caches. */

function isHardReload() {

    try {

        const navigationEntries =
            performance.getEntriesByType("navigation");

        const navigationEntry =
            navigationEntries[0];

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

/* Gespeicherten Fortschritt aus dem localStorage laden */

function loadStoredProgress() {

    if (!progressStorageKey || isHardReload()) {

        return null;
    }

    try {

        const raw =
            localStorage.getItem(progressStorageKey);

        // Nichts gespeichert -> null zurückgeben

        if (!raw) {

            return null;
        }

        return JSON.parse(raw);

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

// Neue Sitzung, außer es gibt einen gespeicherten Stand mit Aufgaben

let isFreshSession = true;

if (
    storedProgress &&
    Array.isArray(storedProgress.tasks) &&
    storedProgress.tasks.length > 0
) {

    isFreshSession = false;
}

/* Bei neuer Sitzung die Aufgabenblöcke bauen, bei fortgesetzter Sitzung 
    die bestehende (randomisierte) Aufgabenreihenfolge verwenden */

let tasks;

if (isFreshSession) {

    tasks =
        buildSessionTasks(taskGroups);

} else {

    tasks =
        storedProgress.tasks;
}

/* Anzahl Blöcke: Aufgabenblöcke + Bewertungsblock */

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

/* Bewertung soll in derselben Reihenfolge stattfinden, in der die
   Blöcke im Aufgabenteil durchlaufen wurden */

function buildRatingGroups(sessionTasks) {

    const result = [];

    // Pro Block nur die erste Aufgabe betrachten

    for (const task of sessionTasks) {

        if (task.isFirstInGroup) {

            result.push({
                groupId: task.groupId,
                groupOrder: task.groupOrder
            });
        }
    }

    return result;
}

const ratingGroups =
    buildRatingGroups(tasks);

/* Experiment-Zustand */

let currentTask = 0;

let firstAnswer = null;

let waitingForSecondAnswer = false;

// Antwortzeiten in Millisekunden

let taskShownAt = null;

let aiShownAt = null;

let firstResponseTimeMs = null;

// Bewertungsblock: läuft er gerade, und welcher Bildschirm ist dran? 

let inRatingBlock = false;

let currentRating = 0;

let ratingShownAt = null;

// Gespeicherten Stand übernehmen bzw. neuen Stand sichern 

if (!isFreshSession) {

    if (storedProgress.currentTask) {

        currentTask =
            storedProgress.currentTask;
    }

    inRatingBlock =
        Boolean(storedProgress.inRatingBlock);

    if (storedProgress.currentRating) {

        currentRating =
            storedProgress.currentRating;
    }
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

/* Tabellen für Aufgabenstellungen bauen */

function buildDataTable(tableData, className) {

    const table =
        document.createElement("table");

    table.className =
        className;


    // Tabellen-Header

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");

    for (const header of tableData.headers) {

        const th =
            document.createElement("th");

        th.textContent =
            header;

        headerRow.appendChild(
            th
        );
    }

    thead.appendChild(
        headerRow
    );

    table.appendChild(
        thead
    );


    // Tabellen-Data

    const tbody =
        document.createElement("tbody");

    for (const row of tableData.rows) {

        const tr =
            document.createElement("tr");

        for (let index = 0; index < row.length; index++) {

            const cell =
                row[index];

            const td =
                document.createElement("td");

            td.textContent =
                cell;

            /* Für Speed-Dating Tabelle muss die letzte Zelle
            sich über beide Spalten erstrecken */

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

        tbody.appendChild(
            tr
        );
    }

    table.appendChild(
        tbody
    );

    return table;
}

/* Aufgabeninhalt (Aufgabentext, Foto, Tabellen, Texte) in einen
   Container schreiben. */

function renderTaskContent(container, content) {

    // Inhalt zunächst leeren

    container.innerHTML = "";


    // Aufgabentext

    const prompt =
        document.createElement("p");

    prompt.textContent =
        content.prompt;

    container.appendChild(
        prompt
    );

    // Foto 

    if (content.image) {

        const image =
            document.createElement("img");

        image.src =
            content.image;

        image.alt =
            "Foto konnte nicht geladen werden. Bitte aktualisieren Sie die " +
            "Seite – Ihr Fortschritt bleibt erhalten.";

        image.className =
            "task-image";

        container.appendChild(
            image
        );
    }

    // Tabelle, mit Sonderregelungen für die Speed-Dating-Tabellen

    if (content.groupId === "speed_dating") {

        // Tabelle 1: Eigene Angaben

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

        // Tabelle 2: Bewertungen des Partners

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

    // Text

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

/* Neue Aufgabe laden */

function loadTask() {

    const task =
        tasks[currentTask];

    // Fortschrittsanzeige zeigt Anzahl Blöcke für mehr Übersichtlichtkeit

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${task.groupOrder} von ${totalBlocks}`;


    // Titel ist die Anzahl Aufgaben innerhalb eines Blocks

    document.getElementById(
        "task-title"
    ).textContent =
        `Aufgabe ${task.groupPosition}`;

    // Aufgabeninhalt, d.h. Texte, Tabellen und Bilder

     const taskDescription =
        document.getElementById(
            "task-description"
        );

    renderTaskContent(
        taskDescription,
        task
    );

    // KI-Chatfenster zurücksetzen

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
        task.chatIntro;

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

    // Zustand zurücksetzen, um für neue Antwort bereit zu sein

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

    // Antwortbuttons erzeugen

     createAnswerButtons(
        task.options
    );

    // Bei neu geladener Aufgabe immer nach oben scrollen, um Fehler zu vermeiden

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


    for (const option of options) {

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


/* Umwandlung von Text und HTML */

function escapeHtml(
    text
) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}

/* Animation, dass KI schreibt */

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

/* KI-Antwort (Empfehlung + Begründung) anzeigen */

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


    // Begründung nur anzeigen, wenn es eine gibt

    let explanationHtml = "";

    if (task.aiExplanation) {

        explanationHtml =
            "<p> Begründung: " + escapeHtml(task.aiExplanation) + "</p>";
    }


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

            ${explanationHtml}

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

/* Daten an Supabase übergeben */

async function saveTrial(secondAnswer) {

    const task = tasks[currentTask];

    // berechnet weitere Werte, wie Korrektheit und Antwortzeit, die ebenfalls übergeben werden

    const firstAnswerCorrect =
        firstAnswer === task.correctAnswer;

    const secondAnswerCorrect =
        secondAnswer === task.correctAnswer;

    const changedAnswer =
        firstAnswer !== secondAnswer;

    let secondResponseTimeMs = null;

    if (aiShownAt !== null) {

        secondResponseTimeMs =
            Date.now() - aiShownAt;
    }

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


    // Konsolen-Ausgaben (nur im Testmodus) für Debugging

    if (isTestMode) {

        console.log(
            "DATEN AN SUPABASE:",
            trialData
        );
    }


    // Datensatz in die Supabase-Tabelle "trials" schreiben und auf die Antwort warten

    const result =
        await supabaseClient
            .from("trials")
            .insert(
                trialData
            );

    const error =
        result.error;


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


/* Klick auf einen Antwortbutton verarbeiten */

async function handleAnswerClick(button) {

    const answer =
        button.dataset.answer;


    /* Erste Nutzer-Antwort */

    if (
        !waitingForSecondAnswer
    ) {

        firstAnswer =
            answer;

        if (taskShownAt !== null) {

            firstResponseTimeMs =
                Date.now() - taskShownAt;

        } else {

            firstResponseTimeMs =
                null;
        }


        addUserMessage(
            answer
        );


        disableAnswerButtons();


        showTypingIndicator();


        // KI-Antwort erscheint nach 1,8 Sekunden

        setTimeout(
            showAIResponse,
            1800
        );


    }

    /* Zweite Nutzer-Antwort (nach KI-Empfehlung) */

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
}


/* Antwortbuttons aktivieren */

function enableAnswerButtons() {

    const buttons =
        document.querySelectorAll(
            ".answer-options .answer-button"
        );


    for (const button of buttons) {

        button.disabled =
            false;


        // Beim Klick wird handleAnswerClick mit genau diesem Button aufgerufen

        button.onclick =
            function () {

                handleAnswerClick(
                    button
                );
            };
    }
}


/* Buttons deaktivieren */

function disableAnswerButtons() {

    const buttons =
        document.querySelectorAll(
            ".answer-options .answer-button"
        );


    for (const button of buttons) {

        button.disabled =
            true;
    }
}


/* Ansicht umschalten: Einleitungs-Screens, Aufgaben-Screens oder Bewertungs-Screens */

const viewSections = {

    "study-intro": ["study-intro-section"],

    "group-intro": ["group-intro-section"],

    "task": ["task-section", "chat-section"],

    "rating": ["rating-section"]
};

function showView(viewName) {

    // Alle Ansichten durchgehen: nur die gewünschte wird angezeigt,
    // alle anderen werden versteckt

    for (const name in viewSections) {

        const sectionIds =
            viewSections[name];

        for (const sectionId of sectionIds) {

            const section =
                document.getElementById(
                    sectionId
                );

            if (name === viewName) {

                section.hidden = false;

            } else {

                section.hidden = true;
            }
        }
    }

    window.scrollTo(
        0,
        0
    );
}


/* Erster Screen: Studien-Erklärung */

function showStudyIntro() {

    showView("study-intro");
}


/* Screen: Einleitung in jeden Aufgabenblock (erklärt die Aufgabe grob) */

function showGroupIntro(task) {

    document.getElementById(
        "task-counter"
    ).textContent =
        `Block ${task.groupOrder} von ${totalBlocks}`;

    document.getElementById(
        "group-intro-title"
    ).textContent =
        task.groupLabel;

    const groupIntroText =
        document.getElementById(
            "group-intro-text"
        );

    if (task.groupIntro) {

        groupIntroText.textContent =
            task.groupIntro;

    } else {

        groupIntroText.textContent =
            "";
    }

    showView("group-intro");
}


/* Aktuelle Aufgabe anzeigen: bei der ersten Aufgabe eines
   Blocks zuerst den Gruppen-Einleitungs-Screen */

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


/* Zur nächsten Aufgabe: Aufgabe hochzählen, Fortschritt speichern oder
am Ende aller Aufgaben zum Bewertungsblock wechseln */

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


/* Bewertungs-Screen: zeigt Beispiel-Aufgabe und Slider */

function showRatingScreen() {

    // Passende Aufgabengruppe zur aktuellen Bewertung suchen

    const currentGroupId =
        ratingGroups[currentRating].groupId;

    let group = null;

    for (const candidate of taskGroups) {

        if (candidate.groupId === currentGroupId) {

            group = candidate;

            break;
        }
    }

    // Als Beispielaufgabe dient immer die erste Variante der Gruppe

    const exampleVariant = group.variants[0];

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

    // Inhalte der Beispielaufgabe zusammenstellen

    const exampleContent = {

        groupId: group.groupId,
        prompt: group.prompt,

        image: exampleVariant.image,
        table: exampleVariant.table,
        table1: exampleVariant.table1,
        table2: exampleVariant.table2,
        information: exampleVariant.information,
        hotelName: exampleVariant.hotelName,
        location: exampleVariant.location
    };

    renderTaskContent(
        document.getElementById(
            "rating-example"
        ),
        exampleContent
    );

    /* Antwortoptionen aus Beispielaufhabe deaktivieren */

    const exampleOptions =
        document.getElementById(
            "rating-example-options"
        );

    exampleOptions.innerHTML = "";

    for (const option of group.options) {

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

    resetRatingSliders();

    ratingShownAt =
        Date.now();

    showView("rating");
}


/* Slider für Bewertung: Mensch oder KI */

const ratingSliderIds = [
    "rating-human",
    "rating-ai"
];

// Slider zurücksetzen, damit Teilnehmer beide Slider bewegen müssen

function resetRatingSliders() {

    for (const sliderId of ratingSliderIds) {

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
            sliderId + "-value"
        ).textContent =
            "–";
    }

    updateRatingSubmitState();
}

function markSliderTouched(slider) {

    slider.classList.remove(
        "untouched"
    );

    document.getElementById(
        slider.id + "-value"
    ).textContent =
        slider.value;

    updateRatingSubmitState();
}

/* Weiter gehen, wenn beide Slider bewegt wurden */

function updateRatingSubmitState() {

    // Annahme: alle Slider wurden bewegt. Sobald einer noch
    // "untouched" ist, wird allTouched auf false gesetzt.

    let allTouched = true;

    for (const sliderId of ratingSliderIds) {

        const slider =
            document.getElementById(
                sliderId
            );

        if (slider.classList.contains("untouched")) {

            allTouched = false;
        }
    }

    document.getElementById(
        "rating-submit"
    ).disabled =
        !allTouched;

    document.getElementById(
        "rating-hint"
    ).hidden =
        allTouched;
}

for (const sliderId of ratingSliderIds) {

    const slider =
        document.getElementById(
            sliderId
        );

    // "input" deckt Ziehen und Tastatur ab, "pointerdown" auch
    // einen Klick genau auf den aktuellen Wert (z.B. 0)

    slider.addEventListener(
        "input",
        function () {

            markSliderTouched(slider);
        }
    );

    slider.addEventListener(
        "pointerdown",
        function () {

            markSliderTouched(slider);
        }
    );
}


/* Bewertung an Supabase senden */

async function saveGroupRating(humanRating, aiRating) {

    const ratingGroup =
        ratingGroups[currentRating];

    let responseTimeMs = null;

    if (ratingShownAt !== null) {

        responseTimeMs =
            Date.now() - ratingShownAt;
    }

    const ratingData = {

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
    };

    // Datensatz in die Supabase-Tabelle "group_ratings" schreiben und auf die Antwort warten

    const result =
        await supabaseClient
            .from("group_ratings")
            .insert(
                ratingData
            );

    const error =
        result.error;


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

    // Abschlusstext: im Testmodus ohne Weiterleitung

    let completionText;

    if (isTestMode) {

        completionText =
            "Vielen Dank für Ihre Teilnahme. (Testmodus – keine Weiterleitung.)";

    } else {

        completionText =
            "Vielen Dank für Ihre Teilnahme. Sie werden gleich zur Umfrage zurückgeleitet …";
    }

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
                    ${completionText}
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

        // Nach kurzer Wartezeit (ist in config.js festgelegt) zur Abschluss-Umfrage weiterleiten

        setTimeout(
            redirectToExitSurvey,
            EXIT_REDIRECT_DELAY_MS
        );
    }
}


/* Weiterleitung zur LimeSurvey-Abschlussumfrage (mit Teilnehmer-ID) */

function redirectToExitSurvey() {

    window.location.href =
        EXIT_SURVEY_URL +
        "?id=" +
        encodeURIComponent(
            participantId
        );
}


/* Abfangen: Seite wurde ohne gültige Teilnehmer-ID aufgerufen */

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
    function () {

        goToCurrentTask();
    }
);


/* Gruppen-Einleitung: Weiter-Button */

document.getElementById(
    "group-intro-continue"
).addEventListener(
    "click",
    function () {

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
    async function () {

        const submitButton =
            document.getElementById(
                "rating-submit"
            );

        submitButton.disabled =
            true;

        // Slider-Werte auslesen und in Zahlen umwandeln

        const humanRating =
            Number(
                document.getElementById(
                    "rating-human"
                ).value
            );

        const aiRating =
            Number(
                document.getElementById(
                    "rating-ai"
                ).value
            );

        try {

            await saveGroupRating(
                humanRating,
                aiRating
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
