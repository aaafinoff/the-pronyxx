// Лента новостей и девлогов с фильтром по типу.

import { el, notice } from "../core/dom.js";
import { getNews } from "../core/data.js";
import { newsCard } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

const TYPES = [
  { id: null, label: "Все" },
  { id: "news", label: "Новости" },
  { id: "devlog", label: "Девлоги" },
];

async function main() {
  await initLayout("news");
  const news = await getNews();

  let activeType = null;
  const grid = document.getElementById("news");
  const filter = document.getElementById("filter-type");

  function render() {
    filter.replaceChildren(
      ...TYPES.map((type) => {
        const button = el("button", { class: "chip", type: "button", "aria-pressed": String(activeType === type.id) }, type.label);
        button.addEventListener("click", () => {
          activeType = type.id;
          render();
        });
        return button;
      }),
    );

    const visible = news.filter((post) => !activeType || post.type === activeType);
    if (visible.length === 0) {
      grid.replaceChildren(notice("Записей пока нет", "Скоро здесь что-нибудь появится."));
    } else {
      grid.replaceChildren(...visible.map(newsCard));
    }
    refreshEffects(grid);
  }

  render();
}

main().catch(showError);
