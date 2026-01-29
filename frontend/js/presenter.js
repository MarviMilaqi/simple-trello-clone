// Presenter: coordina le azioni tra Model e View
export default class KanbanPresenter {
  constructor(model, view, apiClient) {
    this.model = model;
    this.view = view;
    this.apiClient = apiClient;
    this.currentBoardId = null;
    this.dragState = {
      cardId: null,
      sourceListId: null,
    };
  }

  // Inizializza la UI con i dati del Model
  async init() {
    await this.loadInitialBoard();
    this.bindActions();
    this.bindDragAndDrop();
  }

  // Carica la prima board disponibile tramite API
  async loadInitialBoard() {
    try {
      const boards = await this.apiClient.getBoards();
      const board = boards[0] ?? null;

      if (!board) {
        this.currentBoardId = null;
        this.model.setBoard({ titolo: "Nessuna board", descrizione: "Crea una nuova board per iniziare.", liste: [] });
        this.view.renderBoard(this.model.getBoard());
        return;
      }

      await this.loadBoard(board.id);
    } catch (error) {
      this.currentBoardId = null;
      this.model.setBoard({ titolo: "Errore", descrizione: error.message, liste: [] });
      this.view.renderBoard(this.model.getBoard());
    }
  }

  // Carica una board specifica e i suoi contenuti
  async loadBoard(boardId) {
    try {
      const board = await this.apiClient.getBoard(boardId);
      const lists = await this.apiClient.getLists(boardId);
      const listsWithCards = await Promise.all(
        lists.map(async (lista) => ({
          ...lista,
          card: await this.apiClient.getCards(lista.id),
        }))
      );

      this.currentBoardId = board.id;
      this.model.setBoard({
        ...board,
        liste: listsWithCards,
      });
      this.view.renderBoard(this.model.getBoard());
    } catch (error) {
      this.currentBoardId = null;
      this.model.setBoard({ titolo: "Errore", descrizione: error.message, liste: [] });
      this.view.renderBoard(this.model.getBoard());
    }
  }

  // Collega gli eventi UI alle API
  bindActions() {
    const createBoardButton = document.getElementById("create-board");
    const createListButton = document.getElementById("create-list");

    createBoardButton.addEventListener("click", async () => {
      const title = window.prompt("Titolo della nuova board:");
      if (!title || !title.trim()) {
        return;
      }

      const description = window.prompt("Descrizione della board (opzionale):") ?? "";

      try {
        const created = await this.apiClient.createBoard({
          titolo: title.trim(),
          descrizione: description.trim() || null,
        });
        await this.loadBoard(created.id);
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
      }
    });

    createListButton.addEventListener("click", async () => {
      if (!this.currentBoardId) {
        window.alert("Crea prima una board.");
        return;
      }

      const title = window.prompt("Titolo della lista:");
      if (!title || !title.trim()) {
        return;
      }

      const board = this.model.getBoard();
      const posizione = board?.liste?.length ?? 0;

      try {
        await this.apiClient.createList({
          board_id: this.currentBoardId,
          titolo: title.trim(),
          posizione,
        });
        await this.loadBoard(this.currentBoardId);
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
      }
    });

    this.view.listsArea.addEventListener("click", async (event) => {
      const listButton = event.target.closest(".list-action");
      const cardButton = event.target.closest(".card-action");

      if (listButton) {
        const action = listButton.dataset.action;
        const listElement = listButton.closest(".kanban-list");
        const listId = listElement?.dataset?.listId;

        if (!listId) {
          return;
        }

        if (action === "add-card") {
          const title = window.prompt("Titolo della card:");
          if (!title || !title.trim()) {
            return;
          }

          const description = window.prompt("Descrizione (opzionale):") ?? "";
          const list = this.model.getListById(listId);
          const posizione = list?.card?.length ?? 0;

          try {
            await this.apiClient.createCard({
              list_id: listId,
              titolo: title.trim(),
              descrizione: description.trim() || null,
              posizione,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "rename-list") {
          const list = this.model.getListById(listId);
          const title = window.prompt("Nuovo nome lista:", list?.titolo ?? "");
          if (!title || !title.trim()) {
            return;
          }

          try {
            await this.apiClient.updateList(listId, {
              titolo: title.trim(),
              posizione: list?.posizione ?? 0,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "remove-list") {
          const confirmDelete = window.confirm("Vuoi eliminare questa lista?");
          if (!confirmDelete) {
            return;
          }

          try {
            await this.apiClient.deleteList(listId);
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }
      }

      if (cardButton) {
        const action = cardButton.dataset.action;
        const cardElement = cardButton.closest(".kanban-card");
        const listElement = cardButton.closest(".kanban-list");
        const cardId = cardElement?.dataset?.cardId;
        const listId = listElement?.dataset?.listId;

        if (!cardId || !listId) {
          return;
        }

        if (action === "edit-card") {
          const card = this.model.getCardById(cardId);
          const newTitle = window.prompt("Titolo della card:", card?.titolo ?? "");
          if (!newTitle || !newTitle.trim()) {
            return;
          }

          const newDescription = window.prompt("Descrizione:", card?.descrizione ?? "") ?? "";

          try {
            await this.apiClient.updateCard(cardId, {
              titolo: newTitle.trim(),
              descrizione: newDescription.trim() || null,
              list_id: listId,
              posizione: card?.posizione ?? 0,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "delete-card") {
          const confirmDelete = window.confirm("Vuoi eliminare questa card?");
          if (!confirmDelete) {
            return;
          }

          try {
            await this.apiClient.deleteCard(cardId);
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }
      }
    });
  }

  // Attiva il drag & drop delle card nelle liste
  bindDragAndDrop() {
    const listsArea = this.view.listsArea;

    listsArea.addEventListener("dragstart", (event) => {
      const cardElement = event.target.closest(".kanban-card");
      if (!cardElement) {
        return;
      }

      this.dragState.cardId = cardElement.dataset.cardId;
      this.dragState.sourceListId = cardElement.dataset.listId;
      cardElement.classList.add("is-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", this.dragState.cardId);
        event.dataTransfer.setData("source-list-id", this.dragState.sourceListId);
      }
    });

    listsArea.addEventListener("dragend", (event) => {
      const cardElement = event.target.closest(".kanban-card");
      if (cardElement) {
        cardElement.classList.remove("is-dragging");
      }

      this.clearDropHighlights();
      this.dragState.cardId = null;
      this.dragState.sourceListId = null;
    });

    listsArea.addEventListener("dragover", (event) => {
      const cardsContainer = event.target.closest(".cards");
      const cardElement = event.target.closest(".kanban-card");

      if (!cardsContainer && !cardElement) {
        return;
      }

      event.preventDefault();
      const container = cardsContainer ?? cardElement.closest(".cards");
      if (container) {
        this.highlightDropTarget(container);
      }
    });

    listsArea.addEventListener("dragleave", (event) => {
      const container = event.target.closest(".cards");
      if (container && !container.contains(event.relatedTarget)) {
        container.classList.remove("drop-target");
      }
    });

    listsArea.addEventListener("drop", async (event) => {
      event.preventDefault();

      const container = event.target.closest(".cards");
      const targetList = event.target.closest(".kanban-list");

      if (!targetList || !container || !this.dragState.cardId) {
        return;
      }

      const targetListId = targetList.dataset.listId;
      const targetCard = event.target.closest(".kanban-card");
      const targetIndex = this.getDropIndex(container, targetCard);
      const sourceListId = this.dragState.sourceListId;

      this.model.moveCard(this.dragState.cardId, sourceListId, targetListId, targetIndex);
      this.view.renderBoard(this.model.getBoard());
      this.clearDropHighlights();

      try {
        const sourceList = this.model.getListById(sourceListId);
        const targetListModel = this.model.getListById(targetListId);
        const listsToUpdate = new Map();

        if (sourceList) {
          listsToUpdate.set(sourceList.id, sourceList);
        }

        if (targetListModel) {
          listsToUpdate.set(targetListModel.id, targetListModel);
        }

        await Promise.all(
          Array.from(listsToUpdate.values()).map((list) => this.persistCardPositions(list))
        );
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
        if (this.currentBoardId) {
          await this.loadBoard(this.currentBoardId);
        }
      }
    });
  }

  // Calcola l'indice di inserimento in base alla card target (se presente)
  getDropIndex(container, targetCard) {
    if (!targetCard) {
      return container.children.length;
    }

    const cards = Array.from(container.children);
    const index = cards.indexOf(targetCard);
    return index < 0 ? cards.length : index;
  }

  // Evidenzia l'area di drop attiva
  highlightDropTarget(container) {
    this.clearDropHighlights();
    container.classList.add("drop-target");
  }

  // Rimuove gli stati visivi di drop
  clearDropHighlights() {
    this.view.listsArea.querySelectorAll(".drop-target").forEach((element) => {
      element.classList.remove("drop-target");
    });
  }

  // Aggiorna le posizioni delle card per una lista
  async persistCardPositions(list) {
    if (!list) {
      return;
    }

    const cards = Array.isArray(list.card) ? list.card : [];
    await Promise.all(
      cards.map((card, index) =>
        this.apiClient.updateCard(card.id, {
          titolo: card.titolo,
          descrizione: card.descrizione ?? null,
          list_id: list.id,
          posizione: index,
        })
      )
    );
  }
}
