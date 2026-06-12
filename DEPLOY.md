# SLife Gateway — Déploiement Oracle VPS (azo antoka)

Tanjona: ny **server + base** mandeha **any an-danitra (cloud)**, mandeha foana,
tsy miankina amin'ny téléphone na Starlink-nao intsony. Ny téléphone dia tsy
manao afa-tsy **mandray SMS** dia **mandefa MIVOAKA (push)** mankaty.

```
[Téléphone + SIM Mobile Money]          [Oracle VPS — cloud]
  InfiniReach / app mpandefa              Docker:
  - mandray SMS (radio)        ── HTTPS ──▶  ├─ app (Node + Express)
  - POST + x-api-key + retry                 └─ db  (MariaDB)
  - file d'attente raha tapaka
```

> ⚠️ Ny puce fisika dia **tsy azo virtualisé** ao anaty VPS (mila radio). Ka ny
> téléphone (na modem GSM) no mijanona mpandray SMS. Fa ny **logique rehetra**
> dia any amin'ny cloud, ary ny fifandraisana dia **outbound** (mafy orina).

---

## 1. VPS — Oracle Cloud (Always Free)

1. Mamorona compte ao [cloud.oracle.com](https://cloud.oracle.com).
2. Mamorona **Instance** : *Ampere ARM (A1)* na *VM.Standard.E2.1.Micro*, **Ubuntu 22.04**.
3. Tehirizo ny **clé SSH**.
4. **Networking → Security List → Ingress Rules**: ampio `TCP 3000` (na 443 raha
   misy HTTPS — jereo §5).

## 2. Apetraho Docker ao amin'ny VPS

```bash
ssh ubuntu@<IP_VPS>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && exit   # miditra indray avy eo
```

## 3. Alaina ny code + config

```bash
git clone https://github.com/globalpayement-byte/slife-gateway.git
cd slife-gateway
cp .env.example .env
nano .env        # OVAY ny mots de passe (DB_ROOT_PASSWORD, DB_PASSWORD)
```

## 4. Alefa

```bash
docker compose up --build -d
docker compose ps           # tokony "healthy" ny db sy app
curl http://localhost:3000/health
```

Mamorona **API key** ho an'ny mpandefa:

```bash
docker compose exec app node scripts/create-api-key.js "telephone-sender"
# → tehirizo tsara ilay  x-api-key: slk_xxxxxxxx
```

Firewall ao anatin'ny VPS:

```bash
sudo ufw allow 22 && sudo ufw allow 3000 && sudo ufw enable
```

## 5. (Tsara indrindra) HTTPS + domaine

Ho an'ny production, asio reverse-proxy **Caddy** (TLS automatique):

```
# Caddyfile
gateway.ohatra.mg {
    reverse_proxy localhost:3000
}
```
Avy eo ny mpandefa dia mampiasa `https://gateway.ohatra.mg/api/sms`.

---

## 6. Ny lafiny MPANDEFA (téléphone) — retry mba tsy hisy SMS very

Ny server izao dia **idempotent**: azonao alefa imbetsaka ny SMS mitovy, tsy
hikajy avo roa heny izy (ny `message_id` no fanalahidy). Noho izany, ny mpandefa
dia **TOKONY**:

1. Mandefa POST mankany `/api/sms` miaraka amin'ny:
   - Header `x-api-key: <ny key noforonina>`
   - Body JSON: `{ "message_id": "<id tokana>", "expediteur": "...", "corps": "<SMS feno>" }`
   - `message_id` = id tokana isaky ny SMS (ohatra ny `_id` + timestamp omen'i Android).
2. **Retry** raha tsy mahazo `2xx` (na tapaka ny réseau): andramo indray
   miaraka amin'ny backoff (2s, 4s, 8s, 16s...) **mitazona ny message_id mitovy**.
3. **File d'attente** ao amin'ny téléphone: raha mbola tsy lasa → tehirizo, alefa
   rehefa tafaverina ny réseau. Tsy misy SMS very.

Ohatra body:

```json
{
  "message_id": "sms-8842-1718-000",
  "expediteur": "Orange Money",
  "corps": "Le paiement de 5 000 Ar par le 0321234567 est reussi. Trans Id : PP123456.0"
}
```

Valiny (voaray voalohany):
```json
{ "success": true, "parsed": true, "operator": "orange", "matched": true, "transaction_id": 12 }
```
Valiny (retry — efa voaray):
```json
{ "success": true, "duplicate": true, "message": "SMS efa voaray (idempotent)" }
```

> Na amin'ny `duplicate: true` aza dia `2xx` ny valiny → ny mpandefa mahalala fa
> tafiditra soa aman-tsara ilay SMS ka afaka mamafa azy amin'ny file d'attente.

---

## 7. Fitantanana

```bash
docker compose logs -f app        # logs
docker compose restart app        # redémarrer
docker compose down               # ajanona (mitazona ny data ao amin'ny volume)
docker compose up -d              # averina
```

Backup base:
```bash
docker compose exec db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" slife_gateway' > backup.sql
```

## 8. Migration (base efa misy data)

Raha efa nisy base taloha (tsy noforonina vaovao):
```bash
docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" slife_gateway' < database/migrations/001_reliability.sql
```
