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
