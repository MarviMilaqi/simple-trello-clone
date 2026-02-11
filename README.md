# simple-trello-clone

INGSW-2526-T30
Clone di Trello (semplificato)

Questo progetto consiste nello sviluppo di una bacheca Kanban collaborativa per la gestione di progetti di gruppo.

Funzionalità previste
Gestione di Board, Liste e Card
Drag-and-drop delle card nel frontend
Persistenza delle modifiche tramite API backend

# Design pattern utilizzati
- **Model-View-Presenter (MVP)** per separare logica, UI e presentazione.
- **Observer (Publisher/Subscriber)** per notificare la View quando lo stato del Model cambia.

## Avvio con Docker (WSL2/Docker Desktop)

### Prerequisiti
- Docker Desktop installato e in esecuzione (con integrazione WSL2 abilitata, se usi WSL2).
- Docker Compose (incluso in Docker Desktop).

### Run on a new PC
1. Installa **Docker Desktop** e avvialo.
2. Clona la repository.
3. Avvia lo stack (setup completo in un solo comando):

```bash
docker compose up --build
```
Questo progetto include già i default Docker per DB, backend e frontend: **non serve installare MySQL in locale** né conoscere/configurare manualmente password MySQL per il primo avvio.

4. (Opzionale) Se vuoi personalizzare porte o credenziali, copia `.env.example` in `.env`:

```bash
cp .env.example .env
```
5. (Opzionale) Modifica `.env` con i valori desiderati

### URL attesi e API smoke test
- Frontend: http://localhost:8000
- Backend API: http://localhost:8080/api
- MySQL: `localhost:3306` (se devi collegarti dall’esterno)

Smoke test rapido API (in un altro terminale, a stack avviato):

```bash
curl -i http://localhost:8080/api/boards
```

Se tutto è ok, la risposta deve avere status HTTP `200`.

### Come clonare una repository privata (GitHub)
Se la repository è privata, il proprietario/collaboratore deve autenticarsi prima del clone.

Opzione consigliata su Windows (più semplice):
1. Installa e apri **GitHub Desktop**.
2. Fai login con l'account GitHub che ha accesso alla repo.
3. Vai su **File -> Clone repository** e seleziona la repo privata.

Opzione da terminale (HTTPS + token):
```bash
git clone https://github.com/<owner-o-org>/<repo>.git
```
Quando richiesto:
- Username: username GitHub
- Password: usa un **Personal Access Token (PAT)** (non la password GitHub)

### Inizializzazione DB e dati demo
- Lo schema MySQL viene creato automaticamente al primo avvio di MySQL tramite `backend/db/init.sql` (montato in `/docker-entrypoint-initdb.d/init.sql`).
- **Nota:** gli script in `/docker-entrypoint-initdb.d` vengono eseguiti solo quando il volume dati MySQL è nuovo (fresh DB volume).
- Per forzare una re-inizializzazione completa del DB:

```bash
docker compose down -v
docker compose up --build
```

### Stop dei container
Per fermare lo stack:

```bash
docker compose down
```

## Troubleshooting

### Porte occupate (3306/8080/8000)
Se vedi errori di bind/allocation, significa che una delle porte è già in uso sul tuo PC:
- `3306` (MySQL)
- `8080` (Backend API)
- `8000` (Frontend)

Chiudi i processi in conflitto oppure modifica il mapping porte in `docker-compose.yml`.

### Errore `CONFIG_MISSING` dal backend

Se l'API risponde con errore `CONFIG_MISSING`, verifica di avere una copia aggiornata della repository: `backend/config.php` è incluso e legge i valori da variabili ambiente con fallback di default.

### Setup rapido (opzionale)
Puoi usare un target `make` per creare `backend/config.php` solo se manca:

```bash
make setup-config
```
