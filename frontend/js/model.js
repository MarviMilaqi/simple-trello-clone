// Modello applicativo: gestisce lo stato locale della board
export const reorderWithinList = (cards, fromIndex, insertIndex) => {
  const updatedCards = [...cards];
  if (fromIndex < 0 || fromIndex >= updatedCards.length) {
    return updatedCards;
  }

  const [movedCard] = updatedCards.splice(fromIndex, 1);
  const clampedIndex = Math.max(0, Math.min(insertIndex, updatedCards.length));
  updatedCards.splice(clampedIndex, 0, movedCard);
  return updatedCards;
};


export const moveAcrossLists = (sourceCards, targetCards, fromIndex, toIndex) => {
  const updatedSource = [...sourceCards];
  const updatedTarget = [...targetCards];

  if (fromIndex < 0 || fromIndex >= updatedSource.length) {
    return { sourceCards: updatedSource, targetCards: updatedTarget };
  }

  const [movedCard] = updatedSource.splice(fromIndex, 1);
  const clampedIndex = Math.max(0, Math.min(toIndex, updatedTarget.length));
  updatedTarget.splice(clampedIndex, 0, movedCard);

  return { sourceCards: updatedSource, targetCards: updatedTarget };
};

export default class KanbanModel {
  constructor() {
    // Stato iniziale vuoto: verrà popolato dalla API
    this.board = null;
    this.listeners = new Set();
    
  }

  // Registra un osservatore per i cambi di stato
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  // Rimuove un osservatore registrato
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  // Notifica tutti gli osservatori
  notify() {
    const snapshot = this.getBoard();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  // Imposta i dati della board
  setBoard(board) {
    this.board = board;
    this.notify();
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

    const board = this.board;
    const sourceList = board.liste.find((lista) => String(lista.id) === String(sourceListId));
    const targetList = board.liste.find((lista) => String(lista.id) === String(targetListId));
   
    if (!sourceList || !targetList) {
      return this.getBoard();
    }

    const sourceCards = Array.isArray(sourceList.card) ? sourceList.card : [];
    const targetCards = Array.isArray(targetList.card) ? targetList.card : [];
    const cardIndex = sourceCards.findIndex((card) => String(card.id) === String(cardId));

    if (cardIndex < 0) {
      return this.getBoard();
    }

    const resolvedTargetIndex = typeof targetIndex === "number" ? targetIndex : targetCards.length;
    let updatedSourceCards = sourceCards;
    let updatedTargetCards = targetCards;

    if (String(sourceListId) === String(targetListId)) {
      updatedSourceCards = reorderWithinList(sourceCards, cardIndex, resolvedTargetIndex);
      updatedTargetCards = updatedSourceCards;
    } else {
      const moved = moveAcrossLists(sourceCards, targetCards, cardIndex, resolvedTargetIndex);
      updatedSourceCards = moved.sourceCards;
      updatedTargetCards = moved.targetCards;
    }

    const updatedLists = board.liste.map((lista) => {
      if (String(lista.id) === String(sourceListId) && String(lista.id) === String(targetListId)) {
        return { ...lista, card: updatedSourceCards };
      }
      if (String(lista.id) === String(sourceListId)) {
        return { ...lista, card: updatedSourceCards };
      }
      if (String(lista.id) === String(targetListId)) {
        return { ...lista, card: updatedTargetCards };
      }
      return lista;
    });

    this.board = { ...board, liste: updatedLists };
    this.notify();
    return this.getBoard();
  }
}
