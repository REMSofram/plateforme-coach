import React from "react";

function Help() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-blue-700 mb-6">
        Aide & Documentation
      </h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-2">
            Bienvenue sur la plateforme Coach !
          </h2>
          <p className="text-gray-700">
            Cette application vous permet de gérer vos clients, suivre leur
            progression, et centraliser toutes les informations importantes pour
            votre activité de coaching.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-2">
            Fonctionnalités principales
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Ajouter, modifier et supprimer des clients</li>
            <li>
              Suivre l'évolution du poids et des objectifs de chaque client
            </li>
            <li>Accéder à une fiche détaillée pour chaque client</li>
            <li>Gérer votre profil et vos informations personnelles</li>
            <li>Accès sécurisé par authentification</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-2">Navigation</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              <b>Dashboard</b> : page d'accueil, vue d'ensemble de l'activité
            </li>
            <li>
              <b>Mes Clients</b> : liste de tous vos clients, accès rapide à
              leur fiche
            </li>
            <li>
              <b>Profil</b> : vos informations personnelles
            </li>
            <li>
              <b>Paramètres</b> : options de personnalisation (à venir)
            </li>
            <li>
              <b>Aide</b> : cette page !
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-2">
            Questions fréquentes
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              <b>Comment ajouter un client ?</b> Cliquez sur "Nouveau client"
              dans la page Mes Clients.
            </li>
            <li>
              <b>Comment modifier mon profil ?</b> Rendez-vous sur la page
              Profil via le menu en haut à droite.
            </li>
            <li>
              <b>Comment se déconnecter ?</b> Utilisez le bouton Déconnexion en
              bas à gauche.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold text-blue-700 mb-2">
            Besoin d'aide supplémentaire ?
          </h2>
          <p className="text-gray-700">
            Contactez le support ou consultez la documentation technique si vous
            êtes développeur.
            <br />
            <a
              href="mailto:support@coachapp.com"
              className="text-blue-700 underline"
            >
              support@coachapp.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Help;
