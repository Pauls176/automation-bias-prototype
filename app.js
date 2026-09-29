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


/* ==========================================================
   Taskgruppen (5 Themen à 5 Varianten)
   ==========================================================

   Jede Gruppe enthält die gruppenweiten Angaben (Bezeichnung,
   Einleitungstext, Frage, Chat-Intro, Antwortoptionen) und
   5 Varianten mit den eigentlichen Daten (Items aus der
   Pilotstudie, variantIds wie dort). Pro Variante wird die
   richtige Antwort sowie je eine Begründung für den Fall "KI
   empfiehlt richtig" und "KI empfiehlt falsch" hinterlegt -
   welche der beiden angezeigt wird, ergibt sich automatisch
   aus der Position der Variante innerhalb der (randomisierten)
   Gruppen-Reihenfolge (siehe buildSessionTasks). */

const taskGroups = [

    /* Taskgruppe: Speed-Dating-Partner (Tabelle) */
    {
        groupId: "speed_dating",

        groupLabel: "Speed-Dating-Partner",

        groupIntro:
            "In diesem Aufgabenblock sehen Sie jeweils zwei Teilnehmer eines " +
            "Speed-Dating-Events. Es handelt sich um heterosexuelle Paarungen. Sie erhalten eine Tabelle " +
            "mit den Angaben beider Dating-Partner. Die Teilnehmer wurden unter anderem darum gebeten, " +
            "ihr Gegenüber auf einer Skala von 1-10 zu bewerten, hinsichtlich Attraktivität, Intelligenz " +
            "und weiteren Dimensionen. Aus dem Abgleich ihrer persönlichen Interessen wurde für diese Paarung " +
            "zudem eine prozentuale Interessenähnlichkeit berechnet. \n\n" +
            "Ihre Aufgabe besteht darin, anhand dieser Informationen einzuschätzen, " +
            "ob die beiden auf ein zweites Date gehen werden. Ein zweites Date " +
            "kommt nur zustande, wenn beide Partner sich dafür entschieden haben.",

        type: "table",

        prompt:
            "Betrachten Sie die folgenden Informationen zu einem " +
            "Speed-Dating-Paar. Haben die beiden Personen " +
            "sich für ein zweites Date entschieden?",

        chatIntro:
            "Was glauben Sie? Wird dieses Paar ein zweites Date haben?",

        options: [
            "Ja, zum zweiten Date",
            "Nein, kein zweites Date"
        ],

        variants: [
            {
                variantId: "speed_dating_01",
                table1: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "25", "28"],
                        ["Studium", "Internationale Beziehungen/ Betriebswirtschaftslehre", "Biomedizin"],
                        ["Freizeitaktivitäten", "zweimal/Woche", "einmal/Woche"],
                        ["Interessenähnlichkeit", "66%"]
                    ]
                },
                table2: {
                    headers: ["Bewertung", "Person A über Person B", "Person B über Person A"],
                    rows: [
                        ["Attraktivität", "8", "7"],
                        ["Aufrichtigkeit", "8", "10"],
                        ["Intelligenz", "6", "8"],
                        ["Unterhaltsamkeit", "6", "9"],
                        ["Ambition", "6", "—"]
                    ]
                },
                correctAnswer: "Ja, zum zweiten Date",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "speed_dating_02",
                table1: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "22", "27"],
                        ["Studium", "Kommunikationswissenschaften", "Chemie"],
                        ["Freizeitaktivitäten", "mehrmals/Woche", "einmal/Woche"],
                        ["Interessenähnlichkeit", "57%"]
                    ]
                },
                table2: {
                    headers: ["Bewertung", "Person A über Person B", "Person B über Person A"],
                    rows: [
                        ["Attraktivität", "7", "9"],
                        ["Aufrichtigkeit", "7", "8"],
                        ["Intelligenz", "7", "7"],
                        ["Unterhaltsamkeit", "8", "8"],
                        ["Ambition", "7", "5"]
                    ]
                },
                correctAnswer: "Ja, zum zweiten Date",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "speed_dating_03",
                table1: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "25", "27"],
                        ["Studium", "Bildung/ Wissenschaft", "Wirtschaft/ Finanzen"],
                        ["Freizeitaktivitäten", "mehrmals/Woche", "zweimal/Woche"],
                        ["Interessenähnlichkeit", "63%"]
                    ]
                },
                table2: {
                    headers: ["Bewertung", "Person A über Person B", "Person B über Person A"],
                    rows: [
                        ["Attraktivität", "7", "6"],
                        ["Aufrichtigkeit", "7", "10"],
                        ["Intelligenz", "7", "9"],
                        ["Unterhaltsamkeit", "9", "9"],
                        ["Ambition", "—", "4"]
                    ]
                },
                correctAnswer: "Ja, zum zweiten Date",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "speed_dating_06",
                table1: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "28", "32"],
                        ["Studium", "Internationale Beziehungen/ Betriebswirtschaftslehre", "Psychologie"],
                        ["Freizeitaktivitäten", "zweimal/Woche", "zweimal/Monat"],
                        ["Interessenähnlichkeit", "58%"]
                    ]
                },
                table2: {
                    headers: ["Bewertung", "Person A über Person B", "Person B über Person A"],
                    rows: [
                        ["Attraktivität", "5", "7"],
                        ["Aufrichtigkeit", "8", "7"],
                        ["Intelligenz", "6", "10"],
                        ["Unterhaltsamkeit", "7", "—"],
                        ["Ambition", "7", "8"]
                    ]
                },
                correctAnswer: "Nein, kein zweites Date",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "speed_dating_09",
                table1: {
                    headers: ["Merkmal", "Person A", "Person B"],
                    rows: [
                        ["Geschlecht", "Frau", "Mann"],
                        ["Alter", "25", "24"],
                        ["Studium", "Soziale Arbeit", "Biomedizin/ Technik"],
                        ["Freizeitaktivitäten", "einmal/Woche", "einmal/Woche"],
                        ["Interessenähnlichkeit", "59.5%"]
                    ]
                },
                table2: {
                    headers: ["Bewertung", "Person A über Person B", "Person B über Person A"],
                    rows: [
                        ["Attraktivität", "8", "4"],
                        ["Aufrichtigkeit", "6", "8"],
                        ["Intelligenz", "7", "7"],
                        ["Unterhaltsamkeit", "7", "6"],
                        ["Ambition", "6", "6"]
                    ]
                },
                correctAnswer: "Nein, kein zweites Date",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            }
        ]
    },

    /* Taskgruppe: Hotelrezension (Text) */
    {
        groupId: "hotel_review",

        groupLabel: "Hotelrezension",

        groupIntro:
            "In diesem Aufgabenblock lesen Sie Hotelrezensionen. " +
            "Jede Rezension ist in zwei Teile gegliedert: einen positiven " +
            "und einen negativen Teil, die die Bewertung des Hotelgastes widerspiegeln. " +
            "Eine Rezension muss nicht beide Teile enthalten, kann also auch ausschließlich positiv " +
            "oder ausschließlich negativ sein. \n\n" +
            "Ihre Aufgabe besteht darin, zu beurteilen, ob die Rezension von einem Menschen " +
            "verfasst wurde oder KI-generiert ist.",

        type: "text",

        prompt:
            "Lesen Sie den folgenden Text. " +
            "Wurde diese Hotelrezension von einem Menschen verfasst oder ist sie KI-generiert?",

        chatIntro:
            "Wurde diese Rezension von einem Menschen " +
            "verfasst oder ist sie KI-generiert?",

        options: [
            "von einem Menschen",
            "KI-generiert"
        ],

        variants: [
            {
                variantId: "hotel_review_01",
                hotelName: "Park Plaza Beijing Wangfujing",
                location: "Peking, China",
                information:
                    "Positiv:\n\n" +
                    "Lage direkt an einer U-Bahn-Station. Perfekt. Waschmaschinen und Trockner vorhanden. " +
                    "Gutes Frühstück, guter Concierge. Danke.",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "hotel_review_02",
                hotelName: "Hotel Passy Eiffel",
                location: "Paris, Frankreich",
                information:
                    "Positiv:\n\n" +
                    "Lage ausgezeichnet, Zimmerausstattung gut, Personal kompetent und freundlich.\n\n" +
                    "Negativ:\n\n" +
                    "Das Frühstücksbuffet ist marginal, da gibt es in der Umgebung günstigere und bessere Möglichkeiten.",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "hotel_review_04",
                hotelName: "Holiday Inn Washington-Central/White House",
                location: "Washington D.C., USA",
                information:
                    "Positiv:\n\n" +
                    "Große Zimmer modern eingerichtet. 10-15min zu Fuß beim Weißen Haus. " +
                    "Supermarkt nur 1 Straße weiter entfernt.",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "hotel_review_06",
                hotelName: "Hotel Passy Eiffel",
                location: "Paris, Frankreich",
                information:
                    "Positiv:\n\n" +
                    "Die Lage des Hotel Passy Eiffel in Paris ist hervorragend, nur wenige Gehminuten vom " +
                    "Eiffelturm entfernt. Das Personal ist höflich und die Zimmer sind sauber.\n\n" +
                    "Negativ:\n\n" +
                    "Leider war das Zimmer, in dem wir untergebracht waren, sehr klein und das Bad war veraltet. " +
                    "Außerdem war das Frühstück einfach und der Service war oft unterdurchschnittlich.",
                correctAnswer: "KI-generiert",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "hotel_review_10",
                hotelName: "New Park Hotel",
                location: "Ankara, Türkei",
                information:
                    "Positiv:\n\n" +
                    "Überaus freundliches Personal und sehr sauberes, geräumiges Zimmer in zentraler Lage. \n\n" +
                    "Negativ:\n\n" +
                    "Die Wände sind ein wenig dünn. Man hört das Nachbarzimmer.",
                correctAnswer: "von einem Menschen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            }
        ]
    },

    /* Taskgruppe: Emotionserkennung (Foto) */
    {
        groupId: "emotion",

        groupLabel: "Emotionserkennung",

        groupIntro:
            "In diesem Aufgabenblock sehen Sie jeweils ein Foto einer Person. " +
            "Es handelt sich um Standbilder realer Personen, die in einem emotionalen Moment " +
            "aufgenommen wurden. \n\n" +
            "Ihre Aufgabe besteht darin, die primäre Emotion der abgebildeten " +
            "Person zu erkennen.",

        type: "photo",

        prompt:
            "Betrachten Sie das folgende Foto. " +
            "Welche Emotion drückt das Gesicht der Person primär aus?",

        chatIntro:
            "Bitte geben Sie Ihre Einschätzung " +
            "zu der abgebildeten Emotion ein.",

        options: [
            "Überraschung",
            "Wut"
        ],

        variants: [
            {
                variantId: "emotion_01",
                image: "images/emot-1.png",
                correctAnswer: "Wut",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "emotion_03",
                image: "images/emot-3.png",
                correctAnswer: "Wut",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "emotion_04",
                image: "images/emot-4.png",
                correctAnswer: "Wut",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "emotion_08",
                image: "images/emot-8.png",
                correctAnswer: "Überraschung",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "emotion_09",
                image: "images/emot-9.png",
                correctAnswer: "Überraschung",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            }
        ]
    },

    /* Taskgruppe: Immobilienwerte (Foto + Tabelle) */
    {
        groupId: "real_estate",

        groupLabel: "Immobilienbewertung",

        groupIntro:
            "In diesem Aufgabenblock sehen Sie Eckdaten einer realen Immobilie. " +
            "Sie erhalten jeweils ein Foto der Immobilie, sowie zusätzliche Eckdaten, " +
            "u.a. Baujahr, Wohnfläche und Lage. \n\n" +
            "Ihre Aufgabe besteht darin, den gelisteten Kaufpreis der Immobilie einzuschätzen.",

        type: "photo_and_table",

        prompt:
            "Betrachten Sie die folgenden Informationen. " +
            "Wie viel ist diese Immobilie wert?",

        chatIntro:
            "Bitte geben Sie Ihre Schätzung " +
            "zum Immobilienwert ein.",

        options: [
            "weniger als 550.000€",
            "mehr als 550.000€"
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
                correctAnswer: "mehr als 550.000€",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "real_estate_04",
                image: "images/immo-4.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Kleines Reihenmittelhaus nebst Garage in einer Seitenstraße"],
                        ["Baujahr", "1957"],
                        ["Ort", "Benrath, 40593 Düsseldorf"],
                        ["Zimmer", "4"],
                        ["Wohnfläche in m²", "84,01"],
                        ["Grundstücksfläche in m²", "290.04"]
                    ]
                },
                correctAnswer: "weniger als 550.000€",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "real_estate_06",
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
                correctAnswer: "mehr als 550.000€",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "real_estate_07",
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
                correctAnswer: "weniger als 550.000€",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "real_estate_09",
                image: "images/immo-9.webp",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Titel", "Bestes, ruhiges München Obermenzing S2, nh. Grandlschule, DHH, 3 Zi , Bad, Wc, Balk, Terr, Garten"],
                        ["Baujahr", "1982"],
                        ["Ort", "Obermenzing, 81247 München"],
                        ["Zimmer", "3"],
                        ["Wohnfläche in m²", "77"],
                        ["Grundstücksfläche in m²", "196"]
                    ]
                },
                correctAnswer: "mehr als 550.000€",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            }
        ]
    },

    /* Taskgruppe: Regenvorhersage (Tabelle) */
    {
        groupId: "rain_forecast",

        groupLabel: "Regenvorhersage",

        groupIntro:
            "In diesem Aufgabenblock sehen Sie jeweils Wetterdaten für " +
            "einen Tag in Hamburg (Fuhlsbüttel). Die Daten sind einer lokalen Wetterstation " +
            "entnommen und beinhalten u.a. Durchschnittstemperatur, Sonnenstunden und Niederschläge " +
            "der vorigen drei Tage. \n\n" +
            "Ihre Aufgabe besteht darin, eine Prognose abzugeben, ob es an diesem Tag " +
            "regnen wird oder nicht.",

        type: "table",

        prompt:
            "Betrachten Sie die folgenden Wetterdaten aus Hamburg (Fuhlsbüttel), Deutschland. " +
            "Hat es an diesem Tag dort geregnet?",

        chatIntro:
            "Bitte geben Sie eine Prognose " +
            "zur Regenwahrscheinlichkeit ein.",

        options: [
            "Kein Regen",
            "Regen"
        ],

        variants: [
            {
                variantId: "rain_forecast_01",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Datum", "08.01.2025"],
                        ["Ø Temperatur", "2,8 °C"],
                        ["Sonnenstunden", "4,2 h"],
                        ["Niederschlag (der vorigen 3 Tage)", "16,1 mm"]
                    ]
                },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "rain_forecast_02",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Datum", "05.02.2025"],
                        ["Ø Temperatur", "0,4 °C"],
                        ["Sonnenstunden", "0,0 h"],
                        ["Niederschlag (der vorigen 3 Tage)", "8,5 mm"]
                    ]
                },
                correctAnswer: "Regen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "rain_forecast_06",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Datum", "11.06.2025"],
                        ["Ø Temperatur", "13,8 °C"],
                        ["Sonnenstunden", "13,6 h"],
                        ["Niederschlag (der vorigen 3 Tage)", "14,2 mm"]
                    ]
                },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "rain_forecast_08",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Datum", "29.06.2025"],
                        ["Ø Temperatur", "19,5 °C"],
                        ["Sonnenstunden", "10,7 h"],
                        ["Niederschlag (der vorigen 3 Tage)", "10,1 mm"]
                    ]
                },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            },
            {
                variantId: "rain_forecast_11",
                table: {
                    headers: ["", ""],
                    rows: [
                        ["Datum", "27.09.2025"],
                        ["Ø Temperatur", "14,5 °C"],
                        ["Sonnenstunden", "1,3 h"],
                        ["Niederschlag (der vorigen 3 Tage)", "0,0 mm"]
                    ]
                },
                correctAnswer: "Kein Regen",
                explanationIfCorrect: "[PLATZHALTER]",
                explanationIfWrong: "[PLATZHALTER]"
            }
        ]
    }

];

/* Prüfung: Jede richtige Antwort muss exakt einer Antwortoption
   entsprechen, sonst stimmen KI-Empfehlung und Auswertung nicht. */

taskGroups.forEach(group => {

    group.variants.forEach(variant => {

        if (!group.options.includes(variant.correctAnswer)) {

            console.warn(
                "correctAnswer passt zu keiner Antwortoption:",
                variant.variantId,
                variant.correctAnswer
            );
        }
    });
});

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

                type: group.type,
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

const tasks = buildSessionTasks(taskGroups);

/* Experiment-Zustand */

let currentTask = 0;

let firstAnswer = null;

let waitingForSecondAnswer = false;

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
            "Foto derzeit nicht verfügbar";

        image.className =
            "task-image";

        taskDescription.appendChild(
            image
        );
    }

    /* Tabelle(n) */

    if (task.groupId === "speed_dating") {

        // Tabelle 1: Stammdaten & Interessenähnlichkeit

        taskDescription.appendChild(
            buildDataTable(
                task.table1,
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
            "(nicht, wie sie selbst von ihrem Gegenüber eingeschätzt wurde).";

        taskDescription.appendChild(
            tableNote
        );

        // Tabelle 2: Bewertungen

        taskDescription.appendChild(
            buildDataTable(
                task.table2,
                "task-table task-table--speed-dating"
            )
        );

    } else if (task.table) {

        taskDescription.appendChild(
            buildDataTable(
                task.table,
                "task-table"
            )
        );
    }

    /* Text */

     if (task.information) {

        if (task.hotelName && task.location) {

            const hotelHeading =
                document.createElement("p");

            hotelHeading.className =
                "hotel-heading";

            hotelHeading.textContent =
                `Bewertung von ${task.hotelName} in ${task.location}`;

            taskDescription.appendChild(
                hotelHeading
            );
        }

        const informationBox =
            document.createElement("div");

        informationBox.className =
            "information-box";

        informationBox.textContent =
            task.information;

        taskDescription.appendChild(
            informationBox
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


/* Fehlerfall: Seite wurde ohne gültige Teilnehmer-ID aufgerufen
   (z. B. direkter Aufruf statt über den Studienlink) */

function showMissingIdError() {

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


/* START */

if (hasValidSession) {

    loadTask();

} else {

    showMissingIdError();
}
