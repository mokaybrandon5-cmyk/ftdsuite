import { createClient } from "@supabase/supabase-js";

const URL = process.env.REACT_APP_SUPABASE_URL;
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(URL, KEY);

// Tu escuela (Felipe's). Más adelante saldrá del login.
export const SCHOOL_ID = "04f99be1-a477-4b08-9b93-7031f1ea51f5";
