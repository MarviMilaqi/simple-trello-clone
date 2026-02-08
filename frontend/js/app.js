// Punto di ingresso dell'applicazione frontend
import KanbanModel from "./model.js";
import KanbanView from "./view.js";
import KanbanPresenter from "./presenter.js";
import ApiClient from "./api.js";

const model = new KanbanModel();
const view = new KanbanView();
const presenter = new KanbanPresenter(model, view, ApiClient);

presenter.init();
