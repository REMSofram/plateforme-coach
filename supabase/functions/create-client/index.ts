import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// En-têtes CORS à ajouter à chaque réponse
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  console.log("Fonction create-client appelée");

  // Gère les pré-requêtes OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérification des variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Variables d'environnement:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
    });

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Variables d'environnement manquantes:", {
        url: supabaseUrl,
        serviceKey: supabaseServiceKey ? "présent" : "manquant",
        anonKey: supabaseAnonKey ? "présent" : "manquant",
      });
      return new Response(
        JSON.stringify({
          error: "Configuration manquante",
          details:
            "Vérifiez les variables d'environnement SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et SUPABASE_ANON_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Lecture du corps de la requête
    const body = await req.json();
    console.log("Corps de la requête reçu:", body);

    const { email, password, prenom, nom } = body;

    if (!email || !password || !prenom || !nom) {
      console.error("Champs manquants:", { email, password, prenom, nom });
      return new Response(
        JSON.stringify({
          error: "Tous les champs sont requis.",
          details: { email, password, prenom, nom },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialisation des clients Supabase
    console.log("Initialisation des clients Supabase...");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Pas de token d'authentification");
      return new Response(
        JSON.stringify({ error: "Non autorisé - Token manquant" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jwt = authHeader.split("Bearer ")[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Vérification de la session
    console.log("Vérification de la session...");
    const { data: userSession, error: sessionError } =
      await supabase.auth.getUser();

    if (sessionError || !userSession.user) {
      console.error("Erreur de session:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Non autorisé",
          details: sessionError,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const coachId = userSession.user.id;
    console.log("Coach ID:", coachId);

    // Vérification du rôle du coach
    console.log("Vérification du rôle du coach...");
    const { data: coachData, error: coachError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", coachId)
      .single();

    if (coachError || !coachData || coachData.role !== "coach") {
      console.error("Erreur coach:", coachError, "Données:", coachData);
      return new Response(
        JSON.stringify({
          error: "Coach non trouvé ou non autorisé",
          details: { coachError, coachData },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Création de l'utilisateur
    console.log("Création de l'utilisateur...");
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "client",
        },
      });

    if (createUserError || !newUser.user) {
      console.error("Erreur création utilisateur:", createUserError);
      return new Response(
        JSON.stringify({
          error: "Échec de la création de l'utilisateur",
          details: createUserError,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Utilisateur créé:", newUser.user.id);

    // Insertion dans la table users
    console.log("Insertion dans la table users...");
    const { error: insertUserError } = await supabaseAdmin.from("users").upsert(
      [
        {
          id: newUser.user.id,
          email: email,
          full_name: `${prenom} ${nom}`,
          role: "client",
          created_at: new Date().toISOString(),
        },
      ],
      { onConflict: "id" }
    );

    if (insertUserError) {
      console.error("Erreur insertion utilisateur:", insertUserError);
      // Nettoyage en cas d'erreur
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({
          error: "Échec de l'insertion de l'utilisateur",
          details: insertUserError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Liaison avec le coach
    console.log("Liaison avec le coach...");
    const { error: linkError } = await supabaseAdmin
      .from("coach_clients")
      .insert([{ coach_id: coachId, client_id: newUser.user.id }]);

    if (linkError) {
      console.error("Erreur liaison coach-client:", linkError);
      // Nettoyage en cas d'erreur
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      await supabaseAdmin.from("users").delete().eq("id", newUser.user.id);
      return new Response(
        JSON.stringify({
          error: "Échec de la liaison du client",
          details: linkError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Client créé et lié avec succès");
    return new Response(JSON.stringify({ success: true, user: newUser.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
