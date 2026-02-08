# simple-trello-clone

INGSW-2526-T30
Clone di Trello (semplificato)

Questo progetto consiste nello sviluppo di una bacheca Kanban collaborativa per la gestione di progetti di gruppo.

Funzionalità previste
Gestione di Board, Liste e Card
Drag-and-drop delle card nel frontend
Persistenza delle modifiche tramite API backend
Assegnazione dei task ai membri del gruppo

## Avvio con Docker (WSL2/Docker Desktop)

### Prerequisiti
- Docker Desktop installato e in esecuzione (con integrazione WSL2 abilitata, se usi WSL2).
- Docker Compose (incluso in Docker Desktop).

### Come avviare lo stack
1. Apri un terminale nella root del progetto (dove c’è `docker-compose.yml`).
2. Avvia i container:

```bash
docker compose up --build
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
