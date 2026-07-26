# Case Vacanze — scheletro progetto

Sito vetrina + prenotazione online per un piccolo gruppo di case vacanze (2-5).
Stack: Next.js (App Router, TypeScript) + Prisma + Postgres.

## Apertura in VS Code

È un normale progetto Node.js/TypeScript: `File > Apri cartella...` sulla
cartella `case-vacanze` ed è pronto. Estensioni utili da installare:
**Prisma** (syntax highlighting per `schema.prisma`) ed **ESLint**.
(Se per "Visual Studio" intendevi l'IDE completo Visual Studio e non VS Code:
funziona anche lì aprendo la cartella come "cartella con codice", ma per
progetti Node/Next.js VS Code resta la scelta più comune e con più supporto.)

## Setup

```bash
npm install

# 1. Copia .env.example in .env e valorizza DATABASE_URL con la tua Postgres
cp .env.example .env

# 2. Crea le tabelle nel DB a partire dallo schema Prisma
npm run db:migrate

# 3. (opzionale) popola due case di prova
npm run db:seed

# 4. Avvia il dev server
npm run dev
```

Apri http://localhost:3000 — vedrai la lista delle case (se hai fatto il seed)
e potrai cliccare su "vedi disponibilità" per arrivare al form di prenotazione.

## Postgres locale

Se non hai già un Postgres a disposizione, il modo più rapido è Docker:

```bash
docker run --name case-vacanze-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=case_vacanze -p 5432:5432 -d postgres:16
```

In alternativa, servizi gratuiti come Supabase o Neon ti danno una connection
string Postgres pronta all'uso senza installare nulla in locale.

## Pagamenti: perché sono mockati

`PAYMENT_PROVIDER=mock` (default nel `.env.example`) usa
`src/lib/payments/mockProvider.ts`: nessuna chiave, nessun account esterno.
Il flusso di prenotazione (creazione booking → "checkout" → conferma →
booking CONFIRMED) funziona comunque end-to-end, solo che il pagamento è
simulato con un click su "/mock-checkout".

**Sulla tua domanda se puoi usare account di test**: sì. Sia Stripe che
PayPal permettono di creare un account gratuito e ottenere subito chiavi in
**test/sandbox mode** (es. Stripe `sk_test_...`), senza bisogno di un account
business verificato — quello serve solo per incassare pagamenti veri. Quando
vorrai collegare Stripe in modalità test:

1. crea `src/lib/payments/stripeProvider.ts` implementando l'interfaccia
   `PaymentProvider` (stessa forma del mock)
2. aggiungi il case `"stripe"` già predisposto in `src/lib/payments/index.ts`
3. metti `PAYMENT_PROVIDER=stripe` e le chiavi test nel `.env`

Il resto dell'app (API `/api/bookings`, form, pagine) non cambia di una riga:
parla solo con l'interfaccia `PaymentProvider`, mai con l'SDK specifico.

## Struttura

```
prisma/schema.prisma           modello dati: Property, Booking, BlockedDate
prisma/seed.ts                 dati di prova
src/lib/db.ts                  Prisma client (singleton)
src/lib/payments/              astrazione pagamenti (mock oggi, Stripe domani)
src/app/api/properties/        GET lista case
src/app/api/properties/[slug]/availability/   GET date non disponibili
src/app/api/bookings/          POST crea prenotazione + avvia checkout
src/app/api/bookings/confirm/  POST conferma pagamento -> booking CONFIRMED
src/app/page.tsx               home page (placeholder, no design ancora)
src/app/property/[slug]/       pagina prenotazione (placeholder, no design ancora)
src/app/mock-checkout/         pagina di pagamento finta
```

## Deploy su Vercel

Vercel è la scelta naturale per Next.js (stesso team). Passi:

1. Pusha il progetto su GitHub, poi "Import Project" su vercel.com dal repo
2. **Database**: Vercel Postgres è stato dismesso — il DB va collegato a parte.
   Consigliato **Neon** (integrazione nativa in Vercel Marketplace, scale-to-zero,
   e già usato "sotto al cofano" dal vecchio Vercel Postgres):
   - da Vercel → Storage/Marketplace → aggiungi integrazione Neon → crea DB
   - Neon fornisce sia una connection string **pooled** (per l'app, va in
     `DATABASE_URL`) sia una **diretta** (per le migration, va in `DIRECT_URL`)
     — necessarie entrambe perché le funzioni serverless aprono molte
     connessioni brevi e la pooled evita di saturare Postgres
3. Su Vercel → Project Settings → Environment Variables aggiungi:
   `DATABASE_URL`, `DIRECT_URL`, `PAYMENT_PROVIDER=mock`, `NEXT_PUBLIC_BASE_URL`
   (con l'URL vero del deploy, es. `https://tuosito.vercel.app`)
4. Le migration (`prisma migrate deploy`) non girano automaticamente in
   fase di build: o le lanci a mano da locale puntando a `DIRECT_URL` di Neon,
   oppure aggiungi `prisma migrate deploy` come parte dello script di build
5. Nota sui limiti Vercel: le funzioni serverless hanno timeout 10s (Hobby)
   / 15s (Pro) — nessun problema per le nostre API (query rapide), ma da
   tenere a mente se in futuro aggiungerai operazioni lunghe (es. invio email
   bulk, sync iCal massiva)

## Non ancora affrontato (prossimi step)

- Design vero delle pagine (colori, tipografia, layout) — volutamente lasciato
  minimale per ora, si affronta a parte
- Import/export iCal per sincronizzare disponibilità con Airbnb/Booking.com
- Pannello admin per gestire case, prezzi, date bloccate manualmente
- Requisiti legali italiani: CIN in evidenza, invio dati ad Alloggiati Web,
  eventuale tassa di soggiorno
- Multilingua (IT/EN) se punti a turisti stranieri
