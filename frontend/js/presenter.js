// Presenter: coordina le azioni tra Model e View
export default class KanbanPresenter {
  constructor(model, view, apiClient) {
    this.model = model;
    this.view = view;
    this.apiClient = apiClient;
    this.currentBoardId = null;
    this.boardsCache = [];
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
      this.boardsCache = boards;
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
      this.boardsCache = await this.apiClient.getBoards();
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
    const openBoardsButton = document.getElementById("open-boards");
    const boardMenuToggle = document.getElementById("board-menu-toggle");
    const boardMenuPanel = document.getElementById("board-menu");

    createBoardButton.addEventListener("click", async () => {
      const formValues = await this.view.showFormModal({
        title: "Crea nuova board",
        confirmText: "Crea",
        fields: [
          { name: "titolo", label: "Titolo", placeholder: "Titolo board" },
          { name: "descrizione", label: "Descrizione", type: "textarea", placeholder: "Descrizione (opzionale)" },
        ],
      });

      if (!formValues || !formValues.titolo) {
        return;
      }

      try {
        const created = await this.apiClient.createBoard({
          titolo: formValues.titolo.trim(),
          descrizione: formValues.descrizione?.trim() || null,
        });
        await this.loadBoard(created.id);
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
      }
    });

    openBoardsButton.addEventListener("click", async () => {
      try {
        const boards = await this.apiClient.getBoards();
        this.boardsCache = boards;
        const selectedId = await this.view.showBoardsModal({
          boards,
          currentBoardId: this.currentBoardId,
        });
        if (selectedId) {
          await this.loadBoard(selectedId);
        }
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
      }
    });

    boardMenuToggle.addEventListener("click", () => {
      const isOpen = boardMenuPanel.classList.toggle("is-open");
      boardMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".board-menu")) {
        boardMenuPanel.classList.remove("is-open");
        boardMenuToggle.setAttribute("aria-expanded", "false");
      }
    });

    boardMenuPanel.addEventListener("click", async (event) => {
      const actionButton = event.target.closest(".board-menu-item");
      if (!actionButton || !this.currentBoardId) {
        return;
      }

      boardMenuPanel.classList.remove("is-open");
      boardMenuToggle.setAttribute("aria-expanded", "false");
      const action = actionButton.dataset.action;

      if (action === "rename-board") {
        const board = this.model.getBoard();
        const formValues = await this.view.showFormModal({
          title: "Modifica titolo board",
          confirmText: "Salva",
          fields: [
            { name: "titolo", label: "Titolo", placeholder: "Titolo board", value: board?.titolo ?? "" },
            { name: "descrizione", label: "Descrizione", type: "textarea", value: board?.descrizione ?? "" },
          ],
        });

        if (!formValues || !formValues.titolo) {
          return;
        }

        try {
          await this.apiClient.updateBoard(this.currentBoardId, {
            titolo: formValues.titolo.trim(),
            descrizione: formValues.descrizione?.trim() || null,
          });
          await this.loadBoard(this.currentBoardId);
        } catch (error) {
          window.alert(`Errore: ${error.message}`);
        }
      }

      if (action === "delete-board") {
        const confirmDelete = await this.view.showConfirmModal({
          title: "Elimina board",
          message: "Vuoi eliminare questa board?",
          confirmText: "Elimina",
        });
        if (!confirmDelete) {
          return;
        }

        try {
          await this.apiClient.deleteBoard(this.currentBoardId);
          await this.loadInitialBoard();
        } catch (error) {
          window.alert(`Errore: ${error.message}`);
        }
      }
    });

    this.view.listsArea.addEventListener("click", async (event) => {
      const addListToggle = event.target.closest(".add-list-toggle");
      const addListCancel = event.target.closest(".add-list-cancel");
      const listButton = event.target.closest(".list-action");
      const cardButton = event.target.closest(".card-action");

      if (addListToggle) {
        const addListColumn = addListToggle.closest(".add-list");
        if (addListColumn) {
          addListColumn.classList.add("is-open");
          const input = addListColumn.querySelector(".add-list-input");
          if (input) {
            input.focus();
          }
        }
        return;
      }

      if (addListCancel) {
        const addListColumn = addListCancel.closest(".add-list");
        if (addListColumn) {
          addListColumn.classList.remove("is-open");
          const input = addListColumn.querySelector(".add-list-input");
          if (input) {
            input.value = "";
          }
        }
        return;
      }

      if (listButton) {
        const action = listButton.dataset.action;
        const listElement = listButton.closest(".kanban-list");
        const listId = listElement?.dataset?.listId;

        if (!listId) {
          return;
        }

        if (action === "add-card") {
          const formValues = await this.view.showFormModal({
            title: "Nuova card",
            confirmText: "Crea",
            fields: [
              { name: "titolo", label: "Titolo", placeholder: "Titolo card" },
              { name: "descrizione", label: "Descrizione", type: "textarea", placeholder: "Descrizione (opzionale)" },
            ],
          });

          if (!formValues || !formValues.titolo) {
            return;
          }

          const list = this.model.getListById(listId);
          const posizione = list?.card?.length ?? 0;

          try {
            await this.apiClient.createCard({
              list_id: listId,
              titolo: formValues.titolo.trim(),
              descrizione: formValues.descrizione?.trim() || null,
              posizione,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "rename-list") {
          const list = this.model.getListById(listId);
          const formValues = await this.view.showFormModal({
            title: "Rinomina lista",
            confirmText: "Salva",
            fields: [
              { name: "titolo", label: "Titolo", placeholder: "Nome lista", value: list?.titolo ?? "" },
            ],
          });

          if (!formValues || !formValues.titolo) {
            return;
          }

          try {
            await this.apiClient.updateList(listId, {
              titolo: formValues.titolo.trim(),
              posizione: list?.posizione ?? 0,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "remove-list") {
          const confirmDelete = await this.view.showConfirmModal({
            title: "Elimina lista",
            message: "Vuoi eliminare questa lista?",
            confirmText: "Elimina",
          });
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
          const formValues = await this.view.showFormModal({
            title: "Modifica card",
            confirmText: "Salva",
            fields: [
              { name: "titolo", label: "Titolo", placeholder: "Titolo card", value: card?.titolo ?? "" },
              { name: "descrizione", label: "Descrizione", type: "textarea", value: card?.descrizione ?? "" },
            ],
          });

          if (!formValues || !formValues.titolo) {
            return;
          }

          try {
            await this.apiClient.updateCard(cardId, {
              titolo: formValues.titolo.trim(),
              descrizione: formValues.descrizione?.trim() || null,
              list_id: listId,
              posizione: card?.posizione ?? 0,
            });
            await this.loadBoard(this.currentBoardId);
          } catch (error) {
            window.alert(`Errore: ${error.message}`);
          }
        }

        if (action === "delete-card") {
          const confirmDelete = await this.view.showConfirmModal({
            title: "Elimina card",
            message: "Vuoi eliminare questa card?",
            confirmText: "Elimina",
          });
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

    this.view.listsArea.addEventListener("submit", async (event) => {
      const form = event.target.closest(".add-list-form");
      if (!form) {
        return;
      }

      event.preventDefault();
      if (!this.currentBoardId) {
        window.alert("Crea prima una board.");
        return;
      }

      const input = form.querySelector(".add-list-input");
      const title = input?.value?.trim();
      if (!title) {
        return;
      }

      const board = this.model.getBoard();
      const posizione = board?.liste?.length ?? 0;

      try {
        await this.apiClient.createList({
          board_id: this.currentBoardId,
          titolo: title,
          posizione,
        });
        await this.loadBoard(this.currentBoardId);
      } catch (error) {
        window.alert(`Errore: ${error.message}`);
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
      const targetIndex = this.getDropIndex(container, event.clientY);
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
  getDropIndex(container, pointerY) {
    const cards = Array.from(container.querySelectorAll(".kanban-card"));
    if (cards.length === 0) {
      return 0;
    }

    const draggableCards = cards.filter((card) => !card.classList.contains("is-dragging"));
    if (draggableCards.length === 0) {
      return cards.length;
    }

    for (const card of draggableCards) {
      const box = card.getBoundingClientRect();
      const midpoint = box.top + box.height / 2;
      if (pointerY < midpoint) {
        return cards.indexOf(card);
      }
    }

    const lastCard = draggableCards[draggableCards.length - 1];
    return cards.indexOf(lastCard) + 1;
  }

    
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
