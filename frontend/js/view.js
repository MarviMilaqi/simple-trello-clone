// View: si occupa solo della manipolazione del DOM
export default class KanbanView {
  constructor() {
    this.listsArea = document.getElementById("lists-area");
    this.boardTitle = document.getElementById("board-title");
    this.boardDescription = document.getElementById("board-description");
    this.listTemplate = document.getElementById("list-template");
    this.cardTemplate = document.getElementById("card-template");
  }

  // Renderizza i dati della board nella pagina
  renderBoard(board) {
    if (!board) {
      this.listsArea.innerHTML = "<div class=\"list-placeholder\">Nessuna board caricata.</div>";
      return;
    }

    this.boardTitle.textContent = `Board: ${board.titolo}`;
    this.boardDescription.textContent = board.descrizione;

    // Pulisce l'area liste prima di ridisegnare
    this.listsArea.innerHTML = "";

    board.liste.forEach((lista) => {
      const listNode = this.listTemplate.content.cloneNode(true);
      const listElement = listNode.querySelector(".kanban-list");
      const titleElement = listNode.querySelector(".list-title");
      const cardsContainer = listNode.querySelector(".cards");

      titleElement.textContent = lista.titolo;
      listElement.dataset.listId = lista.id;

      lista.card.forEach((card) => {
        const cardNode = this.cardTemplate.content.cloneNode(true);
        const cardElement = cardNode.querySelector(".kanban-card");

        cardNode.querySelector(".card-title").textContent = card.titolo;
        cardNode.querySelector(".card-description").textContent = card.descrizione;
        cardNode.querySelector(".card-assignee").textContent = `Assegnato a: ${card.assegnatario}`;

        cardElement.dataset.cardId = card.id;
        cardsContainer.appendChild(cardNode);
      });

      this.listsArea.appendChild(listNode);
    });

    if (board.liste.length === 0) {
      this.listsArea.innerHTML = "<div class=\"list-placeholder\">Nessuna lista disponibile.</div>";
    }
  }
}
