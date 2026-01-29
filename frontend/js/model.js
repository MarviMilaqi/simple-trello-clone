// Modello applicativo: gestisce lo stato locale della board
export default class KanbanModel {
  constructor() {
    // Stato iniziale di esempio per la fase 4/5
    this.board = {
      id: 1,
      titolo: "Progetto Demo",
      descrizione: "Organizza le attività del team con liste e card.",
      liste: [
        {
          id: 101,
          titolo: "Da fare",
          card: [
            {
              id: 1001,
              titolo: "Definire requisiti",
              descrizione: "Raccogliere bisogni e vincoli del progetto.",
              assegnatario: "Sara"
            },
            {
              id: 1002,
              titolo: "Creare wireframe",
              descrizione: "Bozza della UI principale.",
              assegnatario: "Luca"
            }
          ]
        },
        {
          id: 102,
          titolo: "In corso",
          card: [
            {
              id: 1003,
              titolo: "Setup repository",
              descrizione: "Struttura cartelle e regole base.",
              assegnatario: "Giulia"
            }
          ]
        },
        {
          id: 103,
          titolo: "Completate",
          card: [
            {
              id: 1004,
              titolo: "Kickoff progetto",
              descrizione: "Allineamento iniziale del team.",
              assegnatario: "Marco"
            }
          ]
        }
      ]
    };
  }

  // Ritorna lo stato della board
  getBoard() {
    return { ...this.board };
  }
}
