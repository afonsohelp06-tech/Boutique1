# Azavision — Boutique (client)

E-commerce mode Portugal : Stripe, Eupago (MB Way / Multibanco), IVA 23 %, Moloni, RGPD.

## Structure `client/`

```
client/
├── portail.html              # Page d'accueil (liens boutique + admin)
├── index.html                # Boutique en ligne
├── politica-privacidade.html
├── assets/
├── js/
│   ├── config.js
│   ├── demo-store.js
│   ├── api.js
│   ├── app.js
│   ├── payments.js
│   └── cookies.js
├── package.json
├── start.bat
├── INICIAR-DEMO.bat
└── README.md
```

## Démarrage

### Windows (sans Node)
Double-clic sur `INICIAR-DEMO.bat`

### Serveur local
```bash
cd client
npm start
```

| Page | URL |
|------|-----|
| Production (GitHub Pages) | `https://<compte>.github.io/<repo>/` |
| Local — boutique | http://localhost:3000/ |
| Local — admin | http://localhost:3000/admin/ |

**Mot de passe admin :** `azavision_admin`

## Comptes clients

- Boutique : icone **Conta** (header) → **Criar conta** ou **Entrar**
- Compte demo : `joao@email.pt` / `demo123`
- Checkout : donnees pre-remplies si connecte
- Admin : onglet **Clients** (comptes registres + invites)
- Google Sheets : feuille **Comptes** (apres re-init Azavision ou deploy API)

## URL API (production)

Coller la même URL Google Apps Script (`/exec`) en bas de :
- `client/index.html` → variable `API_URL`
- `admin/index.html` → variable `API_URL`

Voir `../google-apps-script/README.md` pour déployer le backend.

## GitHub

À la racine du dépôt, seuls ces dossiers doivent apparaître : `client/`, `admin/`, `google-apps-script/`.

```bash
git init
git add client admin google-apps-script
git commit -m "Azavision e-commerce Portugal"
```
