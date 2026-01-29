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

  // Sposta una card tra liste o all'interno della stessa lista
  moveCard(cardId, sourceListId, targetListId, targetIndex) {
    if (!this.board) {
      return null;
    }

    const sourceList = this.board.liste.find((lista) => String(lista.id) === String(sourceListId));
    const targetList = this.board.liste.find((lista) => String(lista.id) === String(targetListId));

    if (!sourceList || !targetList) {
      return this.getBoard();
    }

    const sourceCards = Array.isArray(sourceList.card) ? sourceList.card : [];
    const targetCards = Array.isArray(targetList.card) ? targetList.card : [];
    const cardIndex = sourceCards.findIndex((card) => String(card.id) === String(cardId));

    if (cardIndex < 0) {
      return this.getBoard();
    }

    const [movedCard] = sourceCards.splice(cardIndex, 1);
    let insertIndex = typeof targetIndex === "number" ? targetIndex : targetCards.length;

    insertIndex = Math.max(0, Math.min(insertIndex, targetCards.length));

    if (sourceList === targetList && cardIndex < insertIndex) {
      insertIndex -= 1;
    }

    targetCards.splice(insertIndex, 0, movedCard);

    sourceList.card = sourceCards;
    targetList.card = targetCards;

    return this.getBoard();
  }
}
