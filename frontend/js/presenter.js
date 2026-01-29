// Presenter: coordina le azioni tra Model e View
export default class KanbanPresenter {
  constructor(model, view, apiClient) {
    this.model = model;
    this.view = view;
    this.apiClient = apiClient;
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
        this.model.setBoard({ titolo: "Nessuna board", descrizione: "Crea una nuova board per iniziare.", liste: [] });
        this.view.renderBoard(this.model.getBoard());
        return;
      }

      const lists = await this.apiClient.getLists(board.id);
      const listsWithCards = await Promise.all(
        lists.map(async (lista) => ({
          ...lista,
          card: await this.apiClient.getCards(lista.id),
        }))
      );

      this.model.setBoard({
        ...board,
        liste: listsWithCards,
      });

      this.view.renderBoard(this.model.getBoard());
    } catch (error) {
      this.model.setBoard({ titolo: "Errore", descrizione: error.message, liste: [] });
      this.view.renderBoard(this.model.getBoard());
    }
  }

  // Collega gli eventi UI (placeholder per la fase di integrazione API)
  bindActions() {
    const createBoardButton = document.getElementById("create-board");

    createBoardButton.addEventListener("click", () => {
      // Azione dimostrativa: in seguito verrà collegata alla API CRUD
      window.alert("Funzione in arrivo: creazione nuova board.");
    });

    this.view.listsArea.addEventListener("click", (event) => {
      const listButton = event.target.closest(".list-action");
      const cardButton = event.target.closest(".card-action");

      if (listButton) {
        const action = listButton.dataset.action;
        window.alert(`Azione '${action}' in arrivo.`);
      }

      if (cardButton) {
        const action = cardButton.dataset.action;
        window.alert(`Azione '${action}' in arrivo.`);
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

    listsArea.addEventListener("drop", (event) => {
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
}
