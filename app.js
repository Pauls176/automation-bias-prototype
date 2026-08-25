const SUPABASE_URL =
    "https://gemtcvzzaaetckdivivu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_GLlEsjJQZhdM5csHPeQvVg_78L0jkxk";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
