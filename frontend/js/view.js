// View: si occupa solo della manipolazione del DOM
export default class KanbanView {
  constructor() {
    this.listsArea = document.getElementById("lists-area");
    this.boardTitle = document.getElementById("board-title");
    this.boardDescription = document.getElementById("board-description");
    this.listTemplate = document.getElementById("list-template");
    this.cardTemplate = document.getElementById("card-template");
    this.modalOverlay = document.getElementById("modal-overlay");
    this.modalTitle = document.getElementById("modal-title");
    this.modalForm = document.getElementById("modal-form");
    this.modalFields = document.getElementById("modal-fields");
    this.modalCancel = document.getElementById("modal-cancel");
    this.modalConfirm = document.getElementById("modal-confirm");
  }

  // Renderizza i dati della board nella pagina
  renderBoard(board) {
    if (!board) {
      this.listsArea.innerHTML = "<div class=\"list-placeholder\">Nessuna board caricata.</div>";
      return;
    }

    this.boardTitle.textContent = board.titolo;
    this.boardDescription.textContent = board.descrizione ?? "";

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
        cardNode.querySelector(".card-description").textContent = card.descrizione ?? "";
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.listId = lista.id;
        cardElement.draggable = true;
        cardsContainer.appendChild(cardNode);
      });

      this.listsArea.appendChild(listNode);
    });

    if (board.liste.length === 0) {
      this.listsArea.innerHTML = "<div class=\"list-placeholder\">Nessuna lista disponibile.</div>";
    }
  }

  // Mostra un modal con campi e ritorna i valori inseriti
  showFormModal({ title, fields, confirmText = "Conferma" }) {
    return new Promise((resolve) => {
      this.modalTitle.textContent = title;
      this.modalConfirm.textContent = confirmText;
      this.modalFields.innerHTML = "";

      fields.forEach((field) => {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.className = "modal-field";

        const label = document.createElement("label");
        label.textContent = field.label;
        label.setAttribute("for", field.name);

        let input;
        if (field.type === "textarea") {
          input = document.createElement("textarea");
        } else {
          input = document.createElement("input");
          input.type = field.type ?? "text";
        }

        input.id = field.name;
        input.name = field.name;
        input.value = field.value ?? "";
        if (field.placeholder) {
          input.placeholder = field.placeholder;
        }

        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        this.modalFields.appendChild(fieldWrapper);
      });

      const cleanup = () => {
        this.modalOverlay.classList.add("is-hidden");
        this.modalOverlay.setAttribute("aria-hidden", "true");
        this.modalForm.removeEventListener("submit", onSubmit);
        this.modalCancel.removeEventListener("click", onCancel);
        this.modalOverlay.removeEventListener("click", onOverlay);
      };

      const onSubmit = (event) => {
        event.preventDefault();
        const values = {};
        fields.forEach((field) => {
          const input = this.modalFields.querySelector(`[name=\"${field.name}\"]`);
          values[field.name] = input ? input.value.trim() : "";
        });
        cleanup();
        resolve(values);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onOverlay = (event) => {
        if (event.target === this.modalOverlay) {
          onCancel();
        }
      };

      this.modalForm.addEventListener("submit", onSubmit);
      this.modalCancel.addEventListener("click", onCancel);
      this.modalOverlay.addEventListener("click", onOverlay);

      this.modalOverlay.classList.remove("is-hidden");
      this.modalOverlay.setAttribute("aria-hidden", "false");
    });
  }

  // Mostra un modal di conferma
  showConfirmModal({ title, message, confirmText = "Conferma" }) {
    return new Promise((resolve) => {
      this.modalTitle.textContent = title;
      this.modalConfirm.textContent = confirmText;
      this.modalFields.innerHTML = "";

      const text = document.createElement("p");
      text.textContent = message;
      this.modalFields.appendChild(text);

      const cleanup = () => {
        this.modalOverlay.classList.add("is-hidden");
        this.modalOverlay.setAttribute("aria-hidden", "true");
        this.modalForm.removeEventListener("submit", onSubmit);
        this.modalCancel.removeEventListener("click", onCancel);
        this.modalOverlay.removeEventListener("click", onOverlay);
      };

      const onSubmit = (event) => {
        event.preventDefault();
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onOverlay = (event) => {
        if (event.target === this.modalOverlay) {
          onCancel();
        }
      };

      this.modalForm.addEventListener("submit", onSubmit);
      this.modalCancel.addEventListener("click", onCancel);
      this.modalOverlay.addEventListener("click", onOverlay);

      this.modalOverlay.classList.remove("is-hidden");
      this.modalOverlay.setAttribute("aria-hidden", "false");
    });
  }

  // Mostra un modal con elenco board e ritorna l'id selezionato
  showBoardsModal({ boards, currentBoardId }) {
    return new Promise((resolve) => {
      this.modalTitle.textContent = "Le tue board";
      this.modalConfirm.textContent = "Chiudi";
      this.modalFields.innerHTML = "";

      const list = document.createElement("div");
      list.className = "modal-list";

      boards.forEach((board) => {
        const item = document.createElement("div");
        item.className = "modal-list-item";

        const title = document.createElement("span");
        title.className = "modal-list-title";
        title.textContent = board.titolo;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "ghost-button";
        button.textContent = board.id === currentBoardId ? "Selezionata" : "Apri";
        button.disabled = board.id === currentBoardId;

        button.addEventListener("click", () => {
          cleanup();
          resolve(board.id);
        });

        item.appendChild(title);
        item.appendChild(button);
        list.appendChild(item);
      });

      if (boards.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Nessuna board disponibile.";
        list.appendChild(empty);
      }

      this.modalFields.appendChild(list);

      const cleanup = () => {
        this.modalOverlay.classList.add("is-hidden");
        this.modalOverlay.setAttribute("aria-hidden", "true");
        this.modalForm.removeEventListener("submit", onSubmit);
        this.modalCancel.removeEventListener("click", onCancel);
        this.modalOverlay.removeEventListener("click", onOverlay);
      };

      const onSubmit = (event) => {
        event.preventDefault();
        cleanup();
        resolve(null);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onOverlay = (event) => {
        if (event.target === this.modalOverlay) {
          onCancel();
        }
      };

      this.modalForm.addEventListener("submit", onSubmit);
      this.modalCancel.addEventListener("click", onCancel);
      this.modalOverlay.addEventListener("click", onOverlay);

      this.modalOverlay.classList.remove("is-hidden");
      this.modalOverlay.setAttribute("aria-hidden", "false");
    });
  }
}
