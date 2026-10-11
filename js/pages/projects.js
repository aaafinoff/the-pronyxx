// Каталог проектов с фильтрами по направлению и статусу.

import { el, getIdParam, notice } from "../core/dom.js";
import { getDirections, getProjects } from "../core/data.js";
import { projectCard } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

const STATUSES = [
  { id: "live", label: "Работает" },
  { id: "dev", label: "В разработке" },
  { id: "planned", label: "В планах" },
];

async function main() {
  await initLayout("projects");
  const [directions, projects] = await Promise.all([getDirections(), getProjects()]);

  // Выбранные фильтры. null значит «все».
  // Направление можно передать в адресе: projects.html?dir=prism
  const state = {
    direction: directions.some((d) => d.id === getIdParam("dir")) ? getIdParam("dir") : null,
    status: null,
  };

  const grid = document.getElementById("projects");

  /** Рисует ряд кнопок-фильтров. key — какое поле state меняет этот ряд. */
  function renderFilter(containerId, key, options) {
    const all = [{ id: null, label: "Все" }, ...options];
    document.getElementById(containerId).replaceChildren(
      ...all.map((option) => {
        const button = el(
          "button",
          { class: "chip", type: "button", "aria-pressed": String(state[key] === option.id) },
          option.label,
        );
        button.addEventListener("click", () => {
          state[key] = option.id;
          render();
        });
        return button;
      }),
    );
  }

  function render() {
    renderFilter("filter-direction", "direction", directions.map((d) => ({ id: d.id, label: d.name })));
    renderFilter("filter-status", "status", STATUSES);

    const visible = projects.filter(
      (p) => (!state.direction || p.direction === state.direction) && (!state.status || p.status === state.status),
    );

    if (visible.length === 0) {
      grid.replaceChildren(notice("Ничего не найдено", "Попробуй выбрать другие фильтры."));
    } else {
      grid.replaceChildren(...visible.map((p) => projectCard(p, directions)));
    }
    refreshEffects(grid);
  }

  render();
}

main().catch(showError);
