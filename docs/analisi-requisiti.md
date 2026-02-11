# Analisi requisiti & specifiche (Fase 1)

## Obiettivo del progetto
Realizzare un clone semplificato di Trello: una bacheca Kanban collaborativa per la gestione di progetti di gruppo. Le funzionalità principali includono gestione di Board, Liste e Card, drag-and-drop sul frontend e persistenza delle modifiche via API backend.

## Vincoli tecnologici
- Frontend: HTML, CSS, JavaScript.
- Backend: PHP.
- Comunicazione: solo tramite API RESTful CRUD (JSON).
- Architettura applicativa: Model-View-Presenter (MVP).
- Vietato generare HTML con PHP.
- Vietato usare framework architetturali (es. Node.js, Laravel, React).
- Consentite librerie di impaginazione (es. Bootstrap) o utility (es. jQuery).
- Frontend e backend devono essere intercambiabili senza riscritture reciproche (contratto API stabile).

## Attori e ruoli
- **Utente**: utilizza la bacheca per organizzare attività di gruppo.
- **Membro**: può essere assegnato a una Card (assenza di autenticazione nella fase base).

## Entità principali (dominio)
1. **Board**
   - Contiene più Liste.
2. **Lista**
   - Appartiene a una Board.
   - Contiene più Card.
3. **Card**
   - Appartiene a una Lista.
   - Può avere titolo, descrizione, assegnatari, posizione.
4. **Membro** (opzionale, per assegnazioni)
   - Attributi base: nome, email (o alias).

## Funzionalità minime (MVP di prodotto)
- **Board**
  - Creare, leggere, aggiornare, eliminare.
- **Liste**
  - Creare, leggere, aggiornare, eliminare all’interno di una Board.
- **Card**
  - Creare, leggere, aggiornare, eliminare all’interno di una Lista.
  - Spostare tra liste con drag-and-drop.
- **Persistenza**
  - Ogni modifica deve essere salvata via API (CRUD).

## Requisiti non funzionali
- UI semplice, chiara, responsive.
- Nessun rendering HTML lato backend.
- Separazione completa: frontend consumatore di API, backend solo JSON.
- Compatibilità con swap di backend (es. Java/Go) mantenendo le stesse API.

## Contratto API (bozza)
> Dettaglio completo nella fase 2.
- **/api/boards**
  - GET, POST
- **/api/boards/{id}**
  - GET, PUT, DELETE
- **/api/lists**
  - GET, POST (filtrabili per board)
- **/api/lists/{id}**
  - GET, PUT, DELETE
- **/api/cards**
  - GET, POST (filtrabili per list)
- **/api/cards/{id}**
  - GET, PUT, DELETE

## Struttura frontend (MVP)
- **Model**: stato locale (board/liste/card) + adapter API.
- **View**: DOM + template statici HTML.
- **Presenter**: logica UI + orchestrazione chiamate API.

## Descrizione del processo di sviluppo (e UML annessi)
Il processo di sviluppo è stato organizzato in iterazioni incrementali, mantenendo allineati analisi, progettazione e implementazione:

1. **Analisi e requisiti (Fase 1)**
   - Definizione di obiettivi, vincoli tecnologici e funzionalità minime.
   - Identificazione delle entità di dominio (Board, Lista, Card, Membro).
2. **Progettazione API e dati (Fase 2)**
   - Definizione del contratto REST e dei payload JSON.
   - Progettazione dello schema relazionale MySQL e delle relazioni tra entità.
3. **Implementazione frontend/backend (Fase 3)**
   - Frontend in MVP con presenter come orchestratore.
   - Backend PHP con endpoint CRUD e persistenza su MySQL.
4. **Validazione e rifinitura**
   - Verifica della coerenza tra API, UI e persistenza.
   - Aggiornamento della documentazione tecnica.

Per supportare la progettazione e la comunicazione tra i componenti, sono allegati i seguenti diagrammi UML:
- Diagramma delle classi: `docs/uml/class-diagram.svg`
- Diagramma ER: `docs/uml/er-diagram.svg`
- Sequence diagram creazione card: `docs/uml/sequence-create-card.svg`
- Sequence diagram drag-and-drop: `docs/uml/sequence-dnd.svg`

## Design pattern: Observer (Publisher/Subscriber)
Oltre al pattern **MVP**, il progetto adotta anche il pattern **Observer** per la sincronizzazione tra stato applicativo e interfaccia:

- Il **Model** agisce da publisher dello stato.
- La **View** (direttamente o tramite Presenter) si registra come subscriber alle variazioni rilevanti.
- Quando lo stato cambia (es. creazione/spostamento/aggiornamento di card), il Model notifica gli observer.
- Gli observer aggiornano la rappresentazione UI senza accoppiare direttamente la logica di dominio al rendering.

Questo approccio migliora:
- la separazione delle responsabilità,
- la manutenibilità del codice,
- la reattività della UI ai cambiamenti di stato.


## Checklist fase 1 (completata)
- [x] Requisiti e vincoli raccolti.
- [x] Entità di dominio definite.
- [x] Funzionalità minime elencate.
- [x] Bozza contratto API.
- [x] Struttura MVP delineata.
