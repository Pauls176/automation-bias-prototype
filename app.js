/* SupaBase Einbindung */

const SUPABASE_URL =
    "https://gemtcvzzaaetckdivivu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GLlEsjJQZhdM5csHPeQvVg_78L0jkxk";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* Teilnehmer-ID erzeugen, beim Prototypen noch randomisert, später durch SoSci erzeugt */

const participantId =
    "TEST-" +
    crypto.randomUUID();

console.log(
    "Participant ID:",
    participantId
);


/* Beispielaufgaben für den Prototypen */

const tasks = [

    /* Aufgabe mit Bilderkennung */
    {
       id: "photo_01",

        type: "photo",

        title: "Aufgabe 1",

        prompt:
            "Betrachten Sie das folgende Foto. " +
            "Welche Emotion drückt das Gesicht der Person primär aus?",

        image:
            "images/placeholder.jpg",

        options: [
            "Überraschung",
            "Besorgnis"
        ],

        correctAnswer: "Überraschung",
        
        aiRecommendation: "Überraschung"
    },

    /* Aufgabe mit Datentabelle */
    {
         id: "table_01",

        type: "table",

        title: "Aufgabe 2",

        prompt:
            "Betrachten Sie die folgenden Informationen. " +
            "Wie viel ist diese Immobilie wert?",

        table: {

            headers: [
                "",
                ""
            ],

            rows: [
                ["Ort", "Flensburg"],
                ["Baujahr", "1980"],
                ["Grundstücksfläche", "500 qm"],
                ["Wohnfläche", "100 qm"],
                ["Anzahl Zimmer", "4"],
                ["Stockwerke", "2"],
            ]
             },

        options: [
            "weniger als 400.000€",
            "mehr als 400.000€"
        ],

        correctAnswer: "weniger als 400.000€",

        aiRecommendation: "weniger als 400.000€"
    },

    /* Aufgabe mit Textverständnis */
    {
        id: "text_01",

        type: "text",

        title: "Aufgabe 3",

        prompt:
            "Lesen Sie den folgenden Text. " +
            "Wurde diese Hotelrezension von einem Menschen verfasst oder ist sie KI-generiert?",

        information:
            "Traumhafter Aufenthalt! " +
            "Das Hotel überzeugt auf ganzer Linie: Elegante, makellos saubere Zimmer mit fantastischem Ausblick und äußerst bequemen Betten. Das gesamte Personal ist überaus aufmerksam und herzlich. Ein absolutes Highlight ist das erstklassige Frühstücksbuffet mit riesiger regionaler Auswahl. Die ruhige, aber dennoch zentrale Lage rundet das perfekte Urlaubserlebnis ab. Wir kommen garantiert wieder! ",

        statement:
            "Von wem wurde diese Rezension verfasst? ",

        options: [
            "von einem Menschen",
            "KI-generiert"
        ],

        correctAnswer: "KI-generiert",
        
        aiRecommendation: "von einem Menschen"
    }

];

/* Experiment-Zustand */

let currentTask = 0;

let firstAnswer = null;

let waitingForSecondAnswer = false;

/* Aufgabe laden */

function loadTask() {

    const task =
        tasks[currentTask];

    /* Fortschrittsanzeige */

    document.getElementById(
        "task-counter"
    ).textContent =
        `Aufgabe ${currentTask + 1} von ${tasks.length}`;


    /* Titel */

    document.getElementById(
        "task-title"
    ).textContent =
        task.title;

    /* Aufgabenbereich */

     const taskDescription =
        document.getElementById(
            "task-description"
        );

    // Inhalt zunächst leeren

    taskDescription.innerHTML = "";


    /* Aufgabentext */
   
    const prompt =
        document.createElement("p");

    prompt.textContent =
        task.prompt;

    taskDescription.appendChild(
        prompt
    );

    /* Foto */

    if (task.type === "photo") {

        const image =
            document.createElement("img");

        image.src =
            task.image;

        image.alt =
            "Foto zur Aufgabe";

        image.className =
            "task-image";

        taskDescription.appendChild(
            image
        );
    }

    /* Tabelle */

    if (task.type === "table") {

        const table =
            document.createElement("table");

        table.className =
            "task-table";


        // Tabellenkopf

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");

        task.table.headers.forEach(
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

        task.table.rows.forEach(
            row => {

                const tr =
                    document.createElement("tr");

                row.forEach(
                    cell => {

                        const td =
                            document.createElement("td");

                        td.textContent =
                            cell;

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

        taskDescription.appendChild(
            table
        );
    }

    /* Text */

     if (task.type === "text") {

        const informationBox =
            document.createElement("div");

        informationBox.className =
            "information-box";

        informationBox.textContent =
            task.information;

        taskDescription.appendChild(
            informationBox
        );


        // Aussage

        const statement =
            document.createElement("p");

        statement.className =
            "task-statement";

        statement.textContent =
            task.statement;

        taskDescription.appendChild(
            statement
        );
    }

    /* Chat zurücksetzen */

     document.getElementById(
        "chat-messages"
    ).innerHTML = `

        <div class="message bot-message">

            <div class="avatar">
                AI
            </div>

            <div class="message-content">

                <p>
                    Bitte geben Sie Ihre Antwort
                    auf die Aufgabe ein.
                </p>

            </div>

        </div>

    `;

    /* Zustand zurücksetzen */

     firstAnswer =
        null;

    waitingForSecondAnswer =
        false;

    /* Antwortbuttons erzeugen */

     createAnswerButtons(
        task.options
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

        </div>

    `;


    chat.appendChild(
        message
    );


    chat.scrollTop =
        chat.scrollHeight;


    waitingForSecondAnswer =
        true;


    enableAnswerButtons();
}

/* Daten an Supabase senden */

async function saveTrial(secondAnswer) {

    const task = tasks[currentTask];

    console.log("========== SAVE TRIAL ==========");
    console.log("currentTask:", currentTask);
    console.log("task:", task);
    console.log("task.id:", task.id);
    console.log("task.type:", task.type);
    console.log("firstAnswer:", firstAnswer);
    console.log("secondAnswer:", secondAnswer);
    console.log("correctAnswer:", task.correctAnswer);
    console.log("aiRecommendation:", task.aiRecommendation);
    
    const firstAnswerCorrect =
        firstAnswer === task.correctAnswer;

    const secondAnswerCorrect =
        secondAnswer === task.correctAnswer;

    const changedAnswer =
        firstAnswer !== secondAnswer;

    const dataToSave = {

        participant_id:
            participantId,

        task_number:
            currentTask + 1,

        task_id:
            task.id,

        task_type:
            task.type,

        first_answer:
            firstAnswer,

        ai_recommendation:
            task.aiRecommendation,

        second_answer:
            secondAnswer,

        correct_answer:
            task.correctAnswer,

        first_answer_correct:
            firstAnswerCorrect,

        second_answer_correct:
            secondAnswerCorrect,

        changed_answer:
            changedAnswer
    };


    console.log(
        "DATEN AN SUPABASE:",
        dataToSave
    );

    
    const {
        error
    } = await supabaseClient
        .from("trials")
        .insert({

            participant_id:
                participantId,

            task_number:
                currentTask + 1,

            task_id:
                task.id,

            task_type:
                task.type,

            first_answer:
                firstAnswer,

            ai_recommendation:
                task.aiRecommendation,

            second_answer:
                secondAnswer,

            correct_answer:
                task.correctAnswer,

            first_answer_correct:
                firstAnswerCorrect,

            second_answer_correct:
                secondAnswerCorrect,

            changed_answer:
                changedAnswer
        });


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
            ".answer-button"
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
            ".answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;
        }
    );
}


/* Nächste Aufgabe */

function nextTask() {

    currentTask++;


    if (
        currentTask >=
        tasks.length
    ) {

        showCompletion();

        return;
    }


    loadTask();
}


/* Abschluss */

function showCompletion() {

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
            Sie haben alle drei Aufgaben
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
                    Vielen Dank für Ihre Teilnahme.
                </p>

            </div>

        </div>

    `;


    document.querySelector(
        ".answer-area"
    ).style.display =
        "none";
}


/* START */

loadTask();



    
    
    
