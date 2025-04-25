import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// En-têtes CORS à ajouter à chaque réponse
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Gère les pré-requêtes OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { email, password, prenom, nom } = await req.json();

  if (!email || !password || !prenom || !nom) {
    return new Response(
      JSON.stringify({ error: "Tous les champs sont requis." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const authHeader = req.headers.get("Authorization")!;
  const jwt = authHeader?.split("Bearer ")[1];

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const { data: userSession, error: sessionError } =
    await supabase.auth.getUser();
  if (sessionError || !userSession.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const coachId = userSession.user.id;

  const { data: newUser, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError || !newUser.user) {
    return new Response(
      JSON.stringify({
        error: "Failed to create user",
        details: createUserError,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { error: updateUserError } = await supabaseAdmin
    .from("users")
    .update({ full_name: `${prenom} ${nom}` })
    .eq("id", newUser.user.id);

  if (updateUserError) {
    return new Response(
      JSON.stringify({
        error: "Failed to update full_name",
        details: updateUserError,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { error: linkError } = await supabaseAdmin
    .from("coach_clients")
    .insert([{ coach_id: coachId, client_id: newUser.user.id }]);

  if (linkError) {
    return new Response(
      JSON.stringify({ error: "Failed to link client", details: linkError }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ success: true, user: newUser.user }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
