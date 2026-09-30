// SupaBase Verbindung

const SUPABASE_URL =
    "https://gemtcvzzaaetckdivivu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GLlEsjJQZhdM5csHPeQvVg_78L0jkxk";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// Weiterleitung an LimeSurvey nach Abschluss der Fragen

// TODO: URL der Hauptstudie eintragen (derzeit noch die der Pilotstudie)
const EXIT_SURVEY_URL =
    "https://studentische-umfragen.uni-hamburg.de/index.php/832672";

const EXIT_REDIRECT_DELAY_MS =
    2000;
