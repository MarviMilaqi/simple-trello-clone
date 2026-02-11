# Fase 2 — Progettazione API REST (MySQL)

## Obiettivo
Definire il contratto RESTful (CRUD) tra frontend e backend e lo schema dati MySQL, in modo che il frontend possa consumare API JSON indipendenti dall’implementazione server.

## Principi generali
- API **RESTful** con JSON come formato di scambio.
- Nessuna generazione HTML lato backend.
- Risposte consistenti con codici HTTP standard.
- Backend sostituibile: il frontend deve dipendere solo dal contratto API.

## Base URL
```
/api
```

## Convenzioni JSON
- Tutti i payload sono JSON UTF‑8.
- `id` intero positivo.
- Date in formato ISO 8601 (`YYYY-MM-DD HH:MM:SS`) restituite dal backend.

### Struttura standard di risposta (successo)
```json
{
  "data": { }
}
```

### Struttura standard di risposta (errore)
```json
{
  "error": {
    "message": "Descrizione errore",
    "code": "CODICE_ERRORE"
  }
}
```

## Entità e relazioni
- **Board** 1—N **List**
- **List** 1—N **Card**
- **Card** N—N **Member** (assegnazioni)

## Endpoint REST (CRUD)

### Boards
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/boards` | Elenco board |
| POST | `/boards` | Crea board |
| GET | `/boards/{id}` | Dettaglio board |
| PUT | `/boards/{id}` | Aggiorna board |
| DELETE | `/boards/{id}` | Elimina board |

**Board - esempio payload POST**
```json
{
  "titolo": "Progetto Demo",
  "descrizione": "Board per il team"
}
```

**Board - esempio risposta GET**
```json
{
  "data": {
    "id": 1,
    "titolo": "Progetto Demo",
    "descrizione": "Board per il team",
    "created_at": "2024-01-10 10:30:00"
  }
}
```

### Lists
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/lists?board_id={id}` | Liste della board |
| POST | `/lists` | Crea lista |
| GET | `/lists/{id}` | Dettaglio lista |
| PUT | `/lists/{id}` | Aggiorna lista |
| DELETE | `/lists/{id}` | Elimina lista |

**List - esempio payload POST**
```json
{
  "board_id": 1,
  "titolo": "Da fare",
  "posizione": 1
}
```

### Cards
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/cards?list_id={id}` | Card della lista |
| POST | `/cards` | Crea card |
| GET | `/cards/{id}` | Dettaglio card |
| PUT | `/cards/{id}` | Aggiorna card |
| DELETE | `/cards/{id}` | Elimina card |

**Card - esempio payload POST**
```json
{
  "list_id": 101,
  "titolo": "Definire requisiti",
  "descrizione": "Raccogliere bisogni e vincoli",
  "posizione": 1
}
```

**Card - spostamento (drag-and-drop)**
```json
{
  "list_id": 102,
  "posizione": 2
}
```

### Members (opzionale per assegnazioni)
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/members` | Elenco membri |
| POST | `/members` | Crea membro |
| GET | `/members/{id}` | Dettaglio membro |
| PUT | `/members/{id}` | Aggiorna membro |
| DELETE | `/members/{id}` | Elimina membro |

### Assignments (Card ↔ Member)
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/card-assignments` | Assegna membro a card |
| DELETE | `/card-assignments` | Rimuove membro da card |

**Assignment - esempio payload POST**
```json
{
  "card_id": 1001,
  "member_id": 5
}
```

## Schema dati MySQL (proposta)

### Tabelle

**boards**
- id (PK, AUTO_INCREMENT)
- titolo (VARCHAR 120, NOT NULL)
- descrizione (TEXT, NULL)
- created_at (DATETIME)
- updated_at (DATETIME)

**lists**
- id (PK, AUTO_INCREMENT)
- board_id (FK -> boards.id)
- titolo (VARCHAR 120, NOT NULL)
- posizione (INT, NOT NULL, default 0)
- created_at (DATETIME)
- updated_at (DATETIME)

**cards**
- id (PK, AUTO_INCREMENT)
- list_id (FK -> lists.id)
- titolo (VARCHAR 160, NOT NULL)
- descrizione (TEXT, NULL)
- posizione (INT, NOT NULL, default 0)
- created_at (DATETIME)
- updated_at (DATETIME)

**members**
- id (PK, AUTO_INCREMENT)
- nome (VARCHAR 120, NOT NULL)
- email (VARCHAR 190, NULL)
- created_at (DATETIME)
- updated_at (DATETIME)

**card_members** (relazione N‑N)
- card_id (FK -> cards.id)
- member_id (FK -> members.id)
- PRIMARY KEY (card_id, member_id)

## Requisiti minimi per la fase 3 (backend)
- Implementare i CRUD per board, liste e card.
- Validare input (campi obbligatori, lunghezze).
- Restituire codici HTTP corretti.
- Abilitare CORS per il frontend.
