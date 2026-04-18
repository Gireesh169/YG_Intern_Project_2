// import { createClient } from "@supabase/supabase-js";

// const imageSupabaseUrl = import.meta.env.VITE_IMAGE_SUPABASE_URL;
// const imageSupabaseAnonKey = import.meta.env.VITE_IMAGE_SUPABASE_ANON_KEY;

// export const imageSupabase = createClient(
//   imageSupabaseUrl,
//   imageSupabaseAnonKey,
//   {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//       detectSessionInUrl: false,
//     },
//   }
// );

export { supabase as imageSupabase } from './supabase'