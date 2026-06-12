# SLife Gateway

Passerelle SMS ho an'ny Mobile Money (MVola, Orange Money, Airtel Money) ho an'i
Madagasikara. Mandray SMS, mamaky azy (parser), dia mampifanaraka amin'ny
transaction (order) ka manavao ny solde.

## Rafitra

```
[Téléphone + SIM]  ──HTTPS push──▶  [Oracle VPS]  ─▶  Node/Express ─▶ MariaDB
  mandray SMS (radio)                  Docker        parser + matcher
  + retry / file d'attente
```

Ny server dia mandeha **any an-danitra (cloud)** — tsy miankina amin'ny téléphone
na Starlink. Jereo **[DEPLOY.md](DEPLOY.md)** ho an'ny déploiement feno.

## Fahatokisana (reliability)

- **Idempotent** — ny `message_id` tokana isaky ny SMS → ny retry tsy mikajy avo
  roa heny, tsy misy SMS very.
- **Atomique** — match + solde + fitahirizana SMS = iray DB transaction (`FOR UPDATE`).
- **Authentifié** — ny `/api` rehetra mitaky `x-api-key`.
- **Always-on** — Docker `restart: always` + healthcheck.

## Développement an-toerana

```bash
cd server
npm install
cp .env.example ../.env   # na mamorona server/.env
npm test                  # tests parser + reliability (tsy mila base)
npm run dev               # mila MariaDB mandeha
```

## API (fohy)

| Method | Route | Asa |
|---|---|---|
| GET  | `/health` | check (misokatra) |
| POST | `/api/sms` | mandray SMS (idempotent, mila `x-api-key`) |
| GET/POST | `/api/transactions` | orders |
| GET/POST/PUT | `/api/passerelles` | passerelles + solde/statut |

Body `/api/sms`:
```json
{ "message_id": "id-tokana", "expediteur": "Orange Money", "corps": "<SMS feno>" }
```
