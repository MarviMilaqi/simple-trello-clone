// Presenter: coordina le azioni tra Model e View
export default class KanbanPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  // Inizializza la UI con i dati del Model
  init() {
    const board = this.model.getBoard();
    this.view.renderBoard(board);
    this.bindActions();
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
