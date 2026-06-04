# Azavision — Administration

Panneau de gestion : produits, commandes, stocks, promotions, configuration.

## Structure `admin/`

```
admin/
├── index.html          # Interface admin (connexion + onglets)
├── js/
│   ├── admin-app.js    # Logique du panneau
│   ├── api.js          # Couche API (même contrat que la boutique)
│   └── demo-store.js   # Mode démo (localStorage partagé avec client)
└── README.md
```

## Accès

- Fichier local : `admin/index.html`
- Via serveur : http://localhost:3000/admin/ (lancer `client/start.bat` ou `cd client && npm start`)
- Mot de passe par défaut : `azavision_admin`

## URL API

En bas de `admin/index.html`, modifier la ligne `API_URL` (identique à `client/index.html`).

## Mode démo

Les commandes passées sur la boutique (`client/index.html`) apparaissent ici si vous utilisez le **même navigateur** (localStorage partagé).
