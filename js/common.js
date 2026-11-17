(() => {
  "use strict";

  const KEYS = { day: "epf:day", theme: "epf:theme" };
  const DEFAULT_DAY = "2026-10-27";
  const LABEL = { realizado: "Realizado", agendado: "Agendado", cancelado: "Cancelado" };
  const ICON = { realizado: "i-check", agendado: "i-clock", cancelado: "i-x" };
  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

  async function request(method, url, body) {
    let res;
    try {
      res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw Object.assign(new Error("offline"), { errors: ["Não foi possível conectar ao servidor. Verifique se o sistema está rodando (docker compose up)."] });
    }
    if (res.status === 204) return null;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error("api"), { status: res.status, errors: json.errors || ["Erro inesperado no servidor"] });
    return json;
  }

  const api = {
    atendimentos: () => request("GET", "/api/atendimentos"),
    profissionais: () => request("GET", "/api/profissionais"),
    tipos: () => request("GET", "/api/tipos"),
    criar: (rec) => request("POST", "/api/atendimentos", rec),
    atualizar: (id, rec) => request("PUT", `/api/atendimentos/${id}`, rec),
    excluir: (id) => request("DELETE", `/api/atendimentos/${id}`),
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const fillSelect = (select, items, valueOf, labelOf) => {
    const first = select.options[0];
    select.replaceChildren(first, ...items.map((it) => {
      const o = document.createElement("option");
      o.value = valueOf(it);
      o.textContent = labelOf(it);
      return o;
    }));
  };

  const el = (tag, props = {}, ...kids) => {
    const { dataset, ...rest } = props;
    const node = document.createElement(tag);
    Object.assign(node, rest);
    if (dataset) Object.assign(node.dataset, dataset);
    node.append(...kids);
    return node;
  };

  const icon = (id) => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    const use = document.createElementNS(NS, "use");
    svg.setAttribute("class", "ico");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#" + id);
    svg.append(use);
    return svg;
  };

  const cell = (label, ...kids) => el("td", { dataset: { label } }, ...kids);
  const fmtDate = (iso) => iso.split("-").reverse().join("/");
  const byWhen = (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  const shiftDay = (iso, n) => {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const getDay = () => read(KEYS.day) || DEFAULT_DAY;
  const setDay = (iso) => write(KEYS.day, iso || DEFAULT_DAY);

  const themeButton = $("#tema");
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      write(KEYS.theme, root.dataset.theme);
    });
  }

  window.EPF = { $, el, icon, cell, fmtDate, byWhen, shiftDay, getDay, setDay, api, fillSelect, LABEL, ICON };
})();
