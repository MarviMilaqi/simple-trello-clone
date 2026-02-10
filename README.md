# simple-trello-clone

INGSW-2526-T30
Clone di Trello (semplificato)

Questo progetto consiste nello sviluppo di una bacheca Kanban collaborativa per la gestione di progetti di gruppo.

Funzionalità previste
Gestione di Board, Liste e Card
Drag-and-drop delle card nel frontend
Persistenza delle modifiche tramite API backend
Assegnazione dei task ai membri del gruppo

# Design pattern utilizzati
- **Model-View-Presenter (MVP)** per separare logica, UI e presentazione.
- **Observer (Publisher/Subscriber)** per notificare la View quando lo stato del Model cambia.

## Avvio con Docker (WSL2/Docker Desktop)

### Prerequisiti
- Docker Desktop installato e in esecuzione (con integrazione WSL2 abilitata, se usi WSL2).
- Docker Compose (incluso in Docker Desktop).

### Come avviare lo stack
1. Apri un terminale nella root del progetto (dove c’è `docker-compose.yml`).
2. Copia il file di esempio delle variabili ambiente e inserisci valori sicuri:

```bash
cp .env.example .env
```

3. Prima esecuzione backend: crea il file di configurazione locale se non esiste:

```bash
cp backend/config.php.example backend/config.php
```

4. Modifica `.env` e compila i valori richiesti (es. password DB).
5. Avvia i container:



```bash
docker compose up --build
```

### Inizializzazione DB e dati demo
- Lo schema MySQL viene creato automaticamente al primo avvio di MySQL tramite `backend/db/init.sql` (montato in `/docker-entrypoint-initdb.d/init.sql`).
- Dati demo opzionali disponibili in `backend/db/seed.sql`. Per caricarli manualmente:

```bash
docker compose exec -T db mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < backend/db/seed.sql
```

### URL utili
- Frontend: http://localhost:8000
- Backend API: http://localhost:8080/api
- MySQL: porta 3306 (solo se ti serve accedervi dall’esterno)

### Come “aggiungere” i Dockerfile a Docker Desktop o WSL2
Non devi importare nulla manualmente in Docker Desktop o WSL2.  
È sufficiente **avviare il comando `docker compose up --build`** nella cartella del progetto:
- Docker Desktop rileva automaticamente i Dockerfile e li costruisce.
- Su WSL2, esegui il comando da una shell WSL nella cartella del repo.

### Stop dei container
Per fermare lo stack:

```bash
docker compose down
```

## Troubleshooting

### Errore `CONFIG_MISSING` dal backend
Se l'API risponde con errore `CONFIG_MISSING`, significa che manca il file `backend/config.php` (controllo fatto in `backend/index.php`).

**Fix rapido:**

```bash
cp backend/config.php.example backend/config.php
```

Poi riavvia il backend (o lo stack Docker) e riprova la chiamata API.

### Setup rapido (opzionale)
Puoi usare un target `make` per creare `backend/config.php` solo se manca:

```bash
make setup-config
```
