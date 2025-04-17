// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://csottmuidhsyamnabzww.supabase.co"; // à remplacer
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzb3R0bXVpZGhzeWFtbmFiend3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjE3OTMsImV4cCI6MjA2MDM5Nzc5M30.PVhb84SXCt0RPEDbeVt4V0UrzOs1mER0_russsE7h6w"; // à remplacer

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
