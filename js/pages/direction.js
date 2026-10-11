// Страница направления: описание, проекты направления и новости о нём.

import { el, getIdParam, notice } from "../core/dom.js";
import { getDirections, getNews, getProjects } from "../core/data.js";
import { directionIcon, newsCard, projectCard } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

async function main() {
  await initLayout("projects");
  const [directions, projects, news] = await Promise.all([getDirections(), getProjects(), getNews()]);

  const main = document.getElementById("main");
  const direction = directions.find((d) => d.id === getIdParam());

  if (!direction) {
    main.replaceChildren(
      el(
        "div",
        { class: "container section" },
        notice("Направление не найдено", el("a", { class: "more-link", href: "projects.html" }, "← Все проекты")),
      ),
    );
    return;
  }

  document.title = `${direction.name} — The Pronyxx`;

  const ownProjects = projects.filter((p) => p.direction === direction.id);
  const ownNews = news.filter((n) => n.direction === direction.id).slice(0, 3);

  main.replaceChildren(
    el(
      "section",
      { class: "page-hero page-hero--split" },
      el(
        "div",
        { class: "container" },
        el(
          "div",
          {},
          el("span", { class: "eyebrow", text: direction.tagline }),
          el("h1", { text: direction.name }),
          el("p", { class: "page-hero__lead", text: direction.description }),
        ),
        // Значок — единственное цветное место на странице
        directionIcon(direction, "page-hero__art page-hero__art--icon"),
      ),
    ),
    el(
      "section",
      { class: "section" },
      el(
        "div",
        { class: "container" },
        el("div", { class: "section-head" }, el("h2", { text: "Проекты направления" })),
        ownProjects.length
          ? el("div", { class: "grid" }, ownProjects.map((p) => projectCard(p, directions)))
          : notice("Пока пусто", "Проекты этого направления скоро появятся."),
      ),
    ),
    ownNews.length
      ? el(
          "section",
          { class: "section" },
          el(
            "div",
            { class: "container" },
            el("div", { class: "section-head" }, el("h2", { text: "Новости направления" }), el("a", { class: "more-link", href: "news.html" }, "Все новости →")),
            el("div", { class: "grid" }, ownNews.map(newsCard)),
          ),
        )
      : null,
  );

  refreshEffects();
}

main().catch(showError);
