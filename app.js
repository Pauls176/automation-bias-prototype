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


/* ==========================================================
   Taskgruppen (5 Themen à 5 Varianten)
   ==========================================================

   Jede Gruppe enthält die gruppenweiten Angaben (Frage,
   Chat-Intro, Antwortoptionen) und 5 Varianten mit den
   eigentlichen Daten. Pro Variante wird nur die richtige
   Antwort sowie je eine Begründung für den Fall "KI empfiehlt
   richtig" und "KI empfiehlt falsch" hinterlegt - welche der
   beiden angezeigt wird, ergibt sich automatisch aus der
   Position der Variante innerhalb der (randomisierten)
   Gruppen-Reihenfolge (siehe buildSessionTasks). */

const taskGroups = [

    /* Taskgruppe: Speed-Dating-Partner (Tabelle) */
    {
        groupId: "speed_dating",

        type: "table",

        prompt:
            "Betrachten Sie die folgenden Informationen zu einem " +
            "potenziellen Speed-Dating-Partner. Handelt es sich " +
            "voraussichtlich um ein gutes Match?",

        chatIntro:
            "Bitte geben Sie Ihre Einschätzung zum Match ab.",

        options: [
            "Gutes Match",
            "Kein gutes Match"
        ],

        variants: [
            {
                variantId: "speed_dating_01",
                table: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "21", "31"],
                        ["Studium", "Jura", "Betriebswirtschaftslehre"],
                        ["Freizeitaktivitäten", "mehrmals/Woche", "mehrmals/Woche"],
                        ["Attraktivitätsbewertung (der/s Partner/in)", "7", "7"],
                        ["Aufrichtigkeitsbewertung (der/s Partner/in)", "5", "10"],
                        ["Intelligenzbewertung (der/s Partner/in)", "7", "10"],
                        ["Unterhaltsamkeitsbewertung (der/s Partner/in)", "7", "2"],
                        ["Ambitionsbewertung (der/s Partner/in)", "7", "8"],
                        ["Interessenähnlichkeit", "73.5%", "73.5%"]
                    ]
                },
                correctAnswer: "Gutes Match",
                explanationIfCorrect: "Begründung: übereinstimmende Häufigkeit der Freizeitaktivitäten, hohe Interessenähnlichkeit",
                explanationIfWrong: "Begründung: hohe Altersdifferenz, sehr geringe Unterhaltsamkeitsbewertung durch Partner A"
            },
            {
                variantId: "speed_dating_02",
                table: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "22", "27"],
                        ["Studium", "Kommunikationswissenschaften", "Chemie"],
                        ["Freizeitaktivitäten", "mehrmals/Woche", "einmal/Woche"],
                        ["Attraktivitätsbewertung (der/s Partner/in)", "7", "9"],
                        ["Aufrichtigkeitsbewertung (der/s Partner/in)", "7", "8"],
                        ["Intelligenzbewertung (der/s Partner/in)", "7", "7"],
                        ["Unterhaltsamkeitsbewertung (der/s Partner/in)", "8", "8"],
                        ["Ambitionsbewertung (der/s Partner/in)", "7", "5"],
                        ["Interessenähnlichkeit", "57%", "57%"]
                    ]
                },
                correctAnswer: "Gutes Match",
                explanationIfCorrect: "Begründung: mäßig bis hohe Partner-Bewertungen, keine hohe Altersdifferenz",
                explanationIfWrong: "Begründung: unterschiedliche Studienprofile, keine Übereinstimmung in der Häufigkeit der Freizeitaktivitäten"
            },
            {
                variantId: "speed_dating_03",
                table: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "28", "32"],
                        ["Studium", "Internationale Beziehungen/Betriebswirtschaftslehre", "Psychologie"],
                        ["Freizeitaktivitäten", "zweimal/Woche", "zweimal/Monat"],
                        ["Attraktivitätsbewertung (der/s Partner/in)", "5", "7"],
                        ["Aufrichtigkeitsbewertung (der/s Partner/in)", "8", "7"],
                        ["Intelligenzbewertung (der/s Partner/in)", "6", "10"],
                        ["Unterhaltsamkeitsbewertung (der/s Partner/in)", "7", "—"],
                        ["Ambitionsbewertung (der/s Partner/in)", "7", "8"],
                        ["Interessenähnlichkeit", "58%", "58%"]
                    ]
                },
                correctAnswer: "Kein gutes Match",
                explanationIfCorrect: "Begründung: stark unterschiedliche Partner-Bewertungen, keine Übereinstimmung in der Häufigkeit der Freizeitaktivitäten",
                explanationIfWrong: "Begründung: geringe Altersdifferenz, mäßig bis hohe Partner-Bewertungen"
            },
            {
                variantId: "speed_dating_04",
                table: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "25", "24"],
                        ["Studium", "Soziale Arbeit", "Biomedizinisch/Technik"],
                        ["Freizeitaktivitäten", "einmal/Woche", "einmal/Woche"],
                        ["Attraktivitätsbewertung (der/s Partner/in)", "8", "4"],
                        ["Aufrichtigkeitsbewertung (der/s Partner/in)", "6", "8"],
                        ["Intelligenzbewertung (der/s Partner/in)", "7", "7"],
                        ["Unterhaltsamkeitsbewertung (der/s Partner/in)", "7", "6"],
                        ["Ambitionsbewertung (der/s Partner/in)", "6", "6"],
                        ["Interessenähnlichkeit", "59.5%", "59.5%"]
                    ]
                },
                correctAnswer: "Kein gutes Match",
                explanationIfCorrect: "Begründung: mittlere Interessenähnlichkeit, unterschiedliche Studienprofile",
                explanationIfWrong: "Begründung: geringe Altersdifferenz, Übereinstimmung in der Häufigkeit der Freizeitaktivitäten"
            },
            {
                variantId: "speed_dating_05",
                table: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "25", "28"],
                        ["Studium", "Internationale Beziehungen/Betriebswirtschaftslehre", "Biomedizin"],
                        ["Freizeitaktivitäten", "zweimal/Woche", "einmal/Woche"],
                        ["Attraktivitätsbewertung (der/s Partner/in)", "8", "7"],
                        ["Aufrichtigkeitsbewertung (der/s Partner/in)", "8", "10"],
                        ["Intelligenzbewertung (der/s Partner/in)", "6", "8"],
                        ["Unterhaltsamkeitsbewertung (der/s Partner/in)", "6", "9"],
                        ["Ambitionsbewertung (der/s Partner/in)", "6", "—"],
                        ["Interessenähnlichkeit", "66%", "66%"]
                    ]
                },
                correctAnswer: "Gutes Match",
                explanationIfCorrect: "Begründung: recht hohe Interessensähnlichkeit, geringe Altersdifferenz",
                explanationIfWrong: "Begründung: stark unterschiedliche Partner-Bewertungen, unterschiedliche Studienprofile"
            }
        ]
    },

    /* Taskgruppe: Hotelrezension (Text) */
    {
        groupId: "hotel_review",

        type: "text",

        prompt:
            "Lesen Sie den folgenden Text. " +
            "Wurde diese Hotelrezension von einem Menschen verfasst oder ist sie KI-generiert?",

        statement:
            "Von wem wurde diese Rezension verfasst?",

        chatIntro:
            "Bitte geben Sie Ihre Einschätzung " +
            "zur Herkunft der Rezension ein.",

        options: [
            "von einem Menschen",
            "KI-generiert"
        ],

        variants: [
            {
                variantId: "hotel_review_01",
                information:
                    "Positiv:\n\n" +
                    "Tolles Appartement im Herzen von Trastevere, mitten in einem charmanten Gässchen! " +
                    "Die Zimmer sind modern ausgestattet, die Betten super bequem! " +
                    "Angela war eine zuvorkommende Gastgeberin! Wir kommen gerne wieder!",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "Begründung: Nennung einer konkreten Person und Häufung von Ausrufezeichen.",
                explanationIfWrong: "Begründung: Nennung einer konkreten Person und Häufung von Ausrufezeichen."
            },
            {
                variantId: "hotel_review_02",
                information:
                    "Positiv:\n\n" +
                    "Große Zimmer modern eingerichtet. 10-15min zu Fuß beim Weißen Haus. " +
                    "Supermarkt nur 1 Straße weiter entfernt.",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "Begründung: Schreibweise von Zeit- und Distanzangaben und geringe Emotionalität.",
                explanationIfWrong: "Begründung: Schreibweise von Zeit- und Distanzangaben und geringe Emotionalität."
            },
            {
                variantId: "hotel_review_03",
                information:
                    "Positiv:\n\n" +
                    "Entgegen der Kritik, bin ich auf Mitarbeiter getroffen, die tatsächlich Englisch sprachen " +
                    "und auch bemüht waren bei Problemen zu helfen.\n\n" +
                    "Negativ:\n\n" +
                    "Das Zimmer war dreckig, der Teppich fleckig und der Roomservice sehr unzuverlässig...",
                correctAnswer: "KI-generiert",
                explanationIfCorrect: "Begründung: Bezugnahme auf andere Rezensionen und starke subjektive Meinungsäußerung.",
                explanationIfWrong: "Begründung: Bezugnahme auf andere Rezensionen und starke subjektive Meinungsäußerung."
            },
            {
                variantId: "hotel_review_04",
                information:
                    "Positiv:\n\n" +
                    "Die Lage des Hotel Passy Eiffel in Paris ist hervorragend, nur wenige Gehminuten vom " +
                    "Eiffelturm entfernt. Das Personal ist höflich und die Zimmer sind sauber.\n\n" +
                    "Negativ:\n\n" +
                    "Leider war das Zimmer, in dem wir untergebracht waren, sehr klein und das Bad war veraltet. " +
                    "Außerdem war das Frühstück einfach und der Service war oft unterdurchschnittlich.",
                correctAnswer: "KI-generiert",
                explanationIfCorrect: "Begründung: Sehr ausführliche Bewertung mit individuellen Satzanfängen.",
                explanationIfWrong: "Begründung: Sehr ausführliche Bewertung mit individuellen Satzanfängen."
            },
            {
                variantId: "hotel_review_05",
                information:
                    "Positiv:\n\n" +
                    "Hervorragende Lage, in der Nähe vieler Sehenswürdigkeiten. Der Service war ausgezeichnet, " +
                    "und das Frühstück war vielfältig und lecker.\n\n" +
                    "Negativ:\n\n" +
                    "Die Zimmer zur Straße hin können etwas laut sein, aber mit Ohrenstöpsel ist es in Ordnung.",
                correctAnswer: "KI-generiert",
                explanationIfCorrect: "Begründung: Enthält pragmatische Reisetipps und einen leichten Grammatikfehler.",
                explanationIfWrong: "Begründung: Enthält pragmatische Reisetipps und einen leichten Grammatikfehler."
            }
        ]
    },

    /* Taskgruppe: Emotionserkennung (Foto) */
    {
        groupId: "emotion",

        type: "photo",

        prompt:
            "Betrachten Sie das folgende Foto. " +
            "Welche Emotion drückt das Gesicht der Person primär aus?",

        chatIntro:
            "Bitte geben Sie Ihre Einschätzung " +
            "zu der abgebildeten Emotion ein.",

        options: [
            "Überraschung",
            "Besorgnis"
        ],

        variants: [
            {
                variantId: "emotion_01",
                image: "images/placeholder.jpg",
                correctAnswer: "Überraschung",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            /* TODO: Platzhalter-Varianten durch echte Fotos/Inhalte ersetzen */
            {
                variantId: "emotion_02",
                image: "images/placeholder.jpg",
                correctAnswer: "Überraschung",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "emotion_03",
                image: "images/placeholder.jpg",
                correctAnswer: "Besorgnis",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "emotion_04",
                image: "images/placeholder.jpg",
                correctAnswer: "Überraschung",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "emotion_05",
                image: "images/placeholder.jpg",
                correctAnswer: "Besorgnis",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            }
        ]
    },

    /* Taskgruppe: Immobilienwerte (Foto + Tabelle) */
    {
        groupId: "real_estate",

        type: "table",

        prompt:
            "Betrachten Sie die folgenden Informationen. " +
            "Wie viel ist diese Immobilie wert?",

        chatIntro:
            "Bitte geben Sie Ihre Schätzung " +
            "zum Immobilienwert ein.",

        options: [
            "weniger als 400.000€",
            "mehr als 400.000€"
        ],

        variants: [
            {
                variantId: "real_estate_01",
                image: "images/immo-1.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Wohnen mit Gartenidylle – Gepflegtes Ein-/Zweifamilienhaus in begehrter Lage von Hamburg-Stellingen!"],
                        ["Baujahr", "1957"],
                        ["Ort", "Stellingen, 22525 Hamburg"],
                        ["Zimmer", "4"],
                        ["Wohnfläche in m²", "123,38"],
                        ["Grundstücksfläche in m²", "513"]
                    ]
                },
                correctAnswer: "mehr als 400.000€",
                explanationIfCorrect: "Begründung: gute Lage, hohe Grundstücksfläche",
                explanationIfWrong: "Begründung: altes Baujahr, Schnitt als Doppelhaus"
            },
            {
                variantId: "real_estate_02",
                image: "images/immo-2.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Viel Platz für neue Ideen – freistehendes Ein- oder Zweifamilienhaus mit Doppelgarage und Carport"],
                        ["Baujahr", "1965"],
                        ["Ort", "Rosellen, 41470 Neuss"],
                        ["Zimmer", "7"],
                        ["Wohnfläche in m²", "177,28"],
                        ["Grundstücksfläche in m²", "716"]
                    ]
                },
                correctAnswer: "mehr als 400.000€",
                explanationIfCorrect: "Begründung: viele Zimmer, große Wohn- und Grundfläche",
                explanationIfWrong: "Begründung: altes Baujahr, viele kleine Zimmer"
            },
            {
                variantId: "real_estate_03",
                image: "images/immo-3.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "145m² Familienglück: Platz für die ganze Familie!"],
                        ["Baujahr", "2026"],
                        ["Ort", "Travemünde, 23570 Lübeck"],
                        ["Zimmer", "5"],
                        ["Wohnfläche in m²", "145"],
                        ["Grundstücksfläche in m²", "227"]
                    ]
                },
                correctAnswer: "weniger als 400.000€",
                explanationIfCorrect: "Begründung: geringe Grundstücksfläche, touristische Lage",
                explanationIfWrong: "Begründung: Neubau, touristische Lage"
            },
            {
                variantId: "real_estate_04",
                image: "images/immo-6.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Exklusiv saniertes Wohnhaus mit Indoor-Pool, Wellnessbereich und hochwertiger Ausstattung"],
                        ["Baujahr", "1972"],
                        ["Ort", "Urdenbach, 40593 Düsseldorf"],
                        ["Zimmer", "5"],
                        ["Wohnfläche in m²", "276"],
                        ["Grundstücksfläche in m²", "321"]
                    ]
                },
                correctAnswer: "mehr als 400.000€",
                explanationIfCorrect: "Begründung: große Wohnfläche, gehobene Ausstattung",
                explanationIfWrong: "Begründung: Lage äußerster Stadtrand, Pool hohe laufende Kosten"
            },
            {
                variantId: "real_estate_05",
                image: "images/immo-7.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Traumhaftes Altstadthaus mit dem ganz besonderen Flair in der Lübecker Altstadt"],
                        ["Baujahr", "1600"],
                        ["Ort", "Innenstadt, 23552 Lübeck"],
                        ["Zimmer", "4"],
                        ["Wohnfläche in m²", "93"],
                        ["Grundstücksfläche in m²", "36"]
                    ]
                },
                correctAnswer: "weniger als 400.000€",
                explanationIfCorrect: "Begründung: historisches Baudenkmal, geringe Grundstücksfläche",
                explanationIfWrong: "Begründung: historisches Baudenkmal, begehrte Lage"
            }
        ]
    },

    /* Taskgruppe: Regenvorhersage (Tabelle) */
    {
        groupId: "rain_forecast",

        type: "table",

        prompt:
            "Betrachten Sie die folgenden Wetterdaten. " +
            "Wird es an diesem Ort morgen regnen?",

        chatIntro:
            "Bitte geben Sie Ihre Einschätzung " +
            "zur Regenwahrscheinlichkeit ein.",

        options: [
            "Regen",
            "Kein Regen"
        ],

        /* TODO: Platzhalter-Varianten durch echte Inhalte ersetzen */
        variants: [
            {
                variantId: "rain_forecast_01",
                table: { headers: ["", ""], rows: [["Status", "Platzhalter – Inhalt folgt"]] },
                correctAnswer: "Regen",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "rain_forecast_02",
                table: { headers: ["", ""], rows: [["Status", "Platzhalter – Inhalt folgt"]] },
                correctAnswer: "Regen",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "rain_forecast_03",
                table: { headers: ["", ""], rows: [["Status", "Platzhalter – Inhalt folgt"]] },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "rain_forecast_04",
                table: { headers: ["", ""], rows: [["Status", "Platzhalter – Inhalt folgt"]] },
                correctAnswer: "Regen",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            },
            {
                variantId: "rain_forecast_05",
                table: { headers: ["", ""], rows: [["Status", "Platzhalter – Inhalt folgt"]] },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[Platzhalter-Begründung]",
                explanationIfWrong: "[Platzhalter-Begründung]"
            }
        ]
    }

];

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
     die falsche Antwort (inkl. passender Begründung) */

function buildSessionTasks(groups) {

    const sessionTasks = [];

    shuffle(groups).forEach(group => {

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
                groupPosition: groupPosition,

                type: group.type,
                prompt: group.prompt,
                statement: group.statement,
                chatIntro: group.chatIntro,
                options: group.options,

                image: variant.image,
                table: variant.table,
                information: variant.information,

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

const tasks = buildSessionTasks(taskGroups);

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
        `Aufgabe ${currentTask + 1}`;

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

    /* Foto (kann zusätzlich zu einer Tabelle auftreten, z.B. Immobilien) */

    if (task.image) {

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

    if (task.table) {

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

     if (task.information) {

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
    console.log("task.groupId:", task.groupId);
    console.log("task.groupPosition:", task.groupPosition);
    console.log("firstAnswer:", firstAnswer);
    console.log("secondAnswer:", secondAnswer);
    console.log("correctAnswer:", task.correctAnswer);
    console.log("aiRecommendation:", task.aiRecommendation);
    console.log("aiExplanation:", task.aiExplanation);

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
