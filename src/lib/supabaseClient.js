// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://csottmuidhsyamnabzww.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzb3R0bXVpZGhzeWFtbmFiend3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjE3OTMsImV4cCI6MjA2MDM5Nzc5M30.PVhb84SXCt0RPEDbeVt4V0UrzOs1mER0_russsE7h6w";

// Configuration globale pour les redirections
const authOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, authOptions);
