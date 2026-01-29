// Adapter API: incapsula le chiamate REST verso il backend
const ApiClient = {
  baseUrl: "http://127.0.0.1:8080/api",

  // Recupera tutte le board
  async getBoards() {
    return this.request("/boards");
  },

  // Recupera una board singola
  async getBoard(boardId) {
    return this.request(`/boards/${boardId}`);
  },

  // Recupera liste di una board
  async getLists(boardId) {
    return this.request(`/lists?board_id=${boardId}`);
  },

  // Recupera card di una lista
  async getCards(listId) {
    return this.request(`/cards?list_id=${listId}`);
  },

  // Crea una nuova board
  async createBoard(payload) {
    return this.request("/boards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Aggiorna una board esistente
  async updateBoard(boardId, payload) {
    return this.request(`/boards/${boardId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Elimina una board
  async deleteBoard(boardId) {
    return this.request(`/boards/${boardId}`, {
      method: "DELETE",
    });
  },

  // Crea una lista
  async createList(payload) {
    return this.request("/lists", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Aggiorna una lista
  async updateList(listId, payload) {
    return this.request(`/lists/${listId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Elimina una lista
  async deleteList(listId) {
    return this.request(`/lists/${listId}`, {
      method: "DELETE",
    });
  },

  // Crea una card
  async createCard(payload) {
    return this.request("/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Aggiorna una card
  async updateCard(cardId, payload) {
    return this.request(`/cards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Elimina una card
  async deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: "DELETE",
    });
  },

  // Utility generica per chiamate fetch
  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.error?.message ?? "Errore API";
      throw new Error(message);
    }

    return payload.data;
  },
};

export default ApiClient;
