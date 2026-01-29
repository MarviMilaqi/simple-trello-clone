// Presenter: coordina le azioni tra Model e View
export default class KanbanPresenter {
  constructor(model, view, apiClient) {
    this.model = model;
    this.view = view;
    this.apiClient = apiClient;
  }

  // Inizializza la UI con i dati del Model
  async init() {
    await this.loadInitialBoard();
    this.bindActions();
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

    document.querySelectorAll(".list-action").forEach((button) => {
      button.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.action;
        window.alert(`Azione '${action}' in arrivo.`);
      });
    });

    document.querySelectorAll(".card-action").forEach((button) => {
      button.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.action;
        window.alert(`Azione '${action}' in arrivo.`);
      });
    });
  }
}
