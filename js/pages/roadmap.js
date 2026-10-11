// Дорожная карта: три колонки — сделано / сейчас / дальше.

import { el } from "../core/dom.js";
import { getDirections, getRoadmap } from "../core/data.js";
import { directionName } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

async function main() {
  await initLayout("roadmap");
  const [columns, directions] = await Promise.all([getRoadmap(), getDirections()]);

  document.getElementById("roadmap").replaceChildren(
    ...columns.map((column) =>
      el(
        "section",
        { class: `roadmap__col roadmap__col--${column.id} reveal` },
        el("h2", { text: column.title }),
        (column.items ?? []).map((item) =>
          el(
            "div",
            { class: "roadmap__item" },
            el("span", { class: "card__label", text: directionName(directions, item.direction) }),
            el("h3", { text: item.title }),
            el("p", { text: item.text }),
          ),
        ),
      ),
    ),
  );

  refreshEffects();
}

main().catch(showError);
