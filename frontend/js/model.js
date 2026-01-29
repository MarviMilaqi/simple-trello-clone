// Modello applicativo: gestisce lo stato locale della board
export default class KanbanModel {
  constructor() {
    // Stato iniziale vuoto: verrà popolato dalla API
    this.board = null;
  }

  // Imposta i dati della board
  setBoard(board) {
    this.board = board;
  }

  // Ritorna lo stato della board
  getBoard() {
    return this.board ? { ...this.board } : null;
  }
}
