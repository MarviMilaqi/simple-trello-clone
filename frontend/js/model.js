import { reorder } from "./utils.js";

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

  // Recupera una lista per id
  getListById(listId) {
    if (!this.board) {
      return null;
    }

    return this.board.liste.find((lista) => String(lista.id) === String(listId)) ?? null;
  }

  // Recupera una card per id
  getCardById(cardId) {
    if (!this.board) {
      return null;
    }

    for (const lista of this.board.liste) {
      const cards = Array.isArray(lista.card) ? lista.card : [];
      const card = cards.find((item) => String(item.id) === String(cardId));
      if (card) {
        return card;
      }
    }

    return null;
  }

  // Sposta una card tra liste o all'interno della stessa lista
  moveCard(cardId, sourceListId, targetListId, targetIndex) {
    if (!this.board) {
      return null;
    }

    const sourceListIndex = this.board.liste.findIndex(
      (lista) => String(lista.id) === String(sourceListId)
    );
    const targetListIndex = this.board.liste.findIndex(
      (lista) => String(lista.id) === String(targetListId)
    );

    if (sourceListIndex < 0 || targetListIndex < 0) {
      return this.getBoard();
    }

    const sourceList = this.board.liste[sourceListIndex];
    const targetList = this.board.liste[targetListIndex];

    const sourceCards = Array.isArray(sourceList.card) ? sourceList.card : [];
    const targetCards = Array.isArray(targetList.card) ? targetList.card : [];
    const cardIndex = sourceCards.findIndex((card) => String(card.id) === String(cardId));

    if (cardIndex < 0) {
      return this.getBoard();
    }

    let insertIndex = typeof targetIndex === "number" ? targetIndex : targetCards.length;

    insertIndex = Math.max(0, Math.min(insertIndex, targetCards.length));

    const updatedLists = this.board.liste.map((lista, index) => {
      if (index === sourceListIndex && index === targetListIndex) {
        const updatedCards = reorder(sourceCards, cardIndex, insertIndex);
        return { ...lista, card: updatedCards };
      }

      if (index === sourceListIndex) {
        const remainingCards = sourceCards.filter((_, idx) => idx !== cardIndex);
        return { ...lista, card: remainingCards };
      }

      if (index === targetListIndex) {
        const movedCard = sourceCards[cardIndex];
        const nextCards = [
          ...targetCards.slice(0, insertIndex),
          movedCard,
          ...targetCards.slice(insertIndex),
        ];
        return { ...lista, card: nextCards };
      }

      return lista;
    });

    this.board = { ...this.board, liste: updatedLists };

    return this.getBoard();
  }
}
