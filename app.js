const CONFIG = {
  // Depois de publicar o Apps Script, cole aqui a URL do Web App.
  API_URL: "COLE_A_URL_DO_APPS_SCRIPT_AQUI",
};

const state = {
  solicitacoes: [],
  lavagem: [],
  loading: false,
};

const TIPOS_LAVAGEM = ["Simples", "Completa", "Simples com Jato", "Completa com Jato"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  refreshButton: $("#refreshButton"),
  metricSolicitacoes: $("#metricSolicitacoes"),
  metricLavagem: $("#metricLavagem"),
  metricHoje: $("#metricHoje"),
  solicitacoesList: $("#solicitacoesList"),
  lavagemList: $("#lavagemList"),
  solicitacoesCount: $("#solicitacoesCount"),
  lavagemCount: $("#lavagemCount"),
  movimentacaoModal: $("#movimentacaoModal"),
  lavagemModal: $("#lavagemModal"),
  movimentacaoForm: $("#movimentacaoForm"),
  lavagemForm: $("#lavagemForm"),
  toast: $("#toast"),
};

function isApiConfigured() {
  return CONFIG.API_URL && !CONFIG.API_URL.includes("COLE_A_URL");
}

function endpoint(action) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set("action", action);
  return url.toString();
}

async function apiGet(action) {
  if (!isApiConfigured()) {
    throw new Error("Configure a URL do Apps Script em app.js antes de usar o sistema.");
  }

  const response = await fetch(endpoint(action), { method: "GET" });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Falha ao consultar a API.");
  }
  return data.data;
}

async function apiPost(action, payload) {
  if (!isApiConfigured()) {
    throw new Error("Configure a URL do Apps Script em app.js antes de usar o sistema.");
  }

  const response = await fetch(endpoint(action), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Falha ao salvar na API.");
  }
  return data.data;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.style.opacity = isLoading ? "0.6" : "1";
}

function pluralizeVehicle(count) {
  return `${count} ${count === 1 ? "veículo" : "veículos"}`;
}

function renderMetrics(painel = {}) {
  elements.metricSolicitacoes.textContent = painel.solicitacoesFila ?? state.solicitacoes.length;
  elements.metricLavagem.textContent = painel.lavagemFila ?? state.lavagem.length;
  elements.metricHoje.textContent = painel.lavagensHoje ?? 0;
}

function renderSolicitacoes() {
  elements.solicitacoesCount.textContent = pluralizeVehicle(state.solicitacoes.length);

  if (!state.solicitacoes.length) {
    elements.solicitacoesList.innerHTML = `<div class="empty-state">Nenhuma solicitação aguardando entrada.</div>`;
    return;
  }

  elements.solicitacoesList.innerHTML = state.solicitacoes
    .map(
      (item, index) => `
        <button class="vehicle-card" type="button" data-solicitacao-index="${index}">
          <span class="vehicle-main">
            <span class="plate">${item.Placa || "-"}</span>
            <span class="badge">${item.Tipo_Lavagem || "Lavagem"}</span>
          </span>
          <span class="vehicle-meta">
            <span><strong>Responsável</strong>${item.Responsavel || "-"}</span>
            <span><strong>Agência</strong>${item.Agencia || "-"}</span>
          </span>
        </button>
      `,
    )
    .join("");
}

function renderLavagem() {
  elements.lavagemCount.textContent = pluralizeVehicle(state.lavagem.length);

  if (!state.lavagem.length) {
    elements.lavagemList.innerHTML = `<div class="empty-state">Nenhum veículo aguardando lavagem.</div>`;
    return;
  }

  elements.lavagemList.innerHTML = state.lavagem
    .map(
      (item, index) => `
        <button class="vehicle-card" type="button" data-lavagem-index="${index}">
          <span class="vehicle-main">
            <span class="plate">${item.Placa || "-"}</span>
            <span class="badge">${item.Tipo_Lavagem || "Lavagem"}</span>
          </span>
          <span class="vehicle-meta">
            <span><strong>Lavador</strong>${item.Lavador || "-"}</span>
            <span><strong>Entrada</strong>${formatDateTime(item.DataEntrada)}</span>
          </span>
        </button>
      `,
    )
    .join("");
}

function renderError(target, message) {
  target.innerHTML = `<div class="error-state">${message}</div>`;
}

async function loadData() {
  setLoading(true);
  try {
    const [painel, solicitacoes, lavagem] = await Promise.all([
      apiGet("painel"),
      apiGet("fila_solicitacoes"),
      apiGet("fila_lavagem"),
    ]);

    state.solicitacoes = solicitacoes || [];
    state.lavagem = lavagem || [];
    renderMetrics(painel);
    renderSolicitacoes();
    renderLavagem();
  } catch (error) {
    renderError(elements.solicitacoesList, error.message);
    renderError(elements.lavagemList, error.message);
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

function setFormValues(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input) input.value = value ?? "";
  });
}

function normalizeTipoLavagem(value) {
  const tipo = String(value || "").trim();
  return TIPOS_LAVAGEM.includes(tipo) ? tipo : "";
}

function openMovimentacao(index) {
  const item = state.solicitacoes[index];
  if (!item) return;

  elements.movimentacaoForm.reset();
  setFormValues(elements.movimentacaoForm, {
    CicloID: item.CicloID,
    Placa: item.Placa,
    Tipo_Lavagem: normalizeTipoLavagem(item.Tipo_Lavagem),
    Fornecedor: item.Fornecedor,
    Responsavel: item.Responsavel,
    Agencia: item.Agencia,
  });
  elements.movimentacaoModal.showModal();
}

function openLavagem(index) {
  const item = state.lavagem[index];
  if (!item) return;

  elements.lavagemForm.reset();
  setFormValues(elements.lavagemForm, {
    DataInicio: new Date().toISOString(),
    CicloID: item.CicloID,
    Placa: item.Placa,
    Lavador: item.Lavador,
  });
  elements.lavagemModal.showModal();
}

async function submitMovimentacao(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector(".primary-button");
  const data = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  try {
    await apiPost("criar_movimentacao", data);
    elements.movimentacaoModal.close();
    showToast("Movimentação registrada.");
    await loadData();
  } catch (error) {
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

async function submitLavagem(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector(".primary-button");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.ItensFeitos = formData.getAll("ItensFeitos");

  submitButton.disabled = true;
  try {
    await apiPost("criar_lavagem", data);
    elements.lavagemModal.close();
    showToast("Lavagem concluída.");
    await loadData();
  } catch (error) {
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", loadData);
  elements.movimentacaoForm.addEventListener("submit", submitMovimentacao);
  elements.lavagemForm.addEventListener("submit", submitLavagem);

  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab-button").forEach((tab) => tab.classList.toggle("active", tab === button));
      $("#panelSolicitacoes").classList.toggle("active", button.dataset.tab === "solicitacoes");
      $("#panelLavagem").classList.toggle("active", button.dataset.tab === "lavagem");
    });
  });

  document.addEventListener("click", (event) => {
    const solicitacaoCard = event.target.closest("[data-solicitacao-index]");
    const lavagemCard = event.target.closest("[data-lavagem-index]");
    const closeButton = event.target.closest("[data-close-modal]");

    if (solicitacaoCard) openMovimentacao(Number(solicitacaoCard.dataset.solicitacaoIndex));
    if (lavagemCard) openLavagem(Number(lavagemCard.dataset.lavagemIndex));
    if (closeButton) closeButton.closest("dialog")?.close();
  });
}

bindEvents();
loadData();
