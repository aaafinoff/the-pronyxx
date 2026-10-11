// О студии: история, основатель, ценности. Все тексты — из data/studio.json.

import { el, externalLink, safeUrl } from "../core/dom.js";
import { getStudio } from "../core/data.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

/** Подзаголовок + ряд чипов (навыки, технологии). */
function chipGroup(title, items) {
  if (!items?.length) return null;
  return el(
    "div",
    { class: "founder__group" },
    el("h4", { text: title }),
    el("div", { class: "chips" }, items.map((item) => el("span", { class: "chip", text: item }))),
  );
}

async function main() {
  await initLayout("about");
  const studio = await getStudio();
  const founder = studio.founder ?? {};
  const founderLinks = (founder.links ?? []).filter((link) => safeUrl(link.url));

  document.getElementById("history").replaceChildren(
    ...(studio.history ?? []).map((step) =>
      el(
        "li",
        { class: "reveal" },
        el("span", { class: "timeline__year", text: step.year }),
        el("h3", { text: step.title }),
        el("p", { text: step.text }),
      ),
    ),
  );

  document.getElementById("founder").replaceChildren(
    el(
      "div",
      { class: "founder" },
      el("div", { class: "founder__avatar" }, el("img", { src: "images/brand/crystal.webp", alt: "Кристалл The Pronyxx", width: "480", height: "480", loading: "lazy" })),
      el(
        "div",
        {},
        el("h3", { text: founder.name }),
        el("p", { class: "founder__role", text: founder.role }),
        el("p", { text: founder.bio }),
        chipGroup("Навыки", founder.skills),
        chipGroup("Технологии", founder.tech),
        founderLinks.length
          ? el(
              "div",
              { class: "founder__group" },
              el("h4", { text: "Ссылки" }),
              el("div", { class: "link-list" }, founderLinks.map((link) => externalLink(link.label, link.url, "btn btn--ghost"))),
            )
          : null,
      ),
    ),
  );

  document.getElementById("values").replaceChildren(
    ...(studio.values ?? []).map((value) =>
      el("div", { class: "card card--hover reveal" }, el("h3", { text: value.title }), el("p", { text: value.text })),
    ),
  );

  refreshEffects();
}

main().catch(showError);
