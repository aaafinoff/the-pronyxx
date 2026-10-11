// Страница одной новости или девлога.

import { el, getIdParam, notice } from "../core/dom.js";
import { getNews } from "../core/data.js";
import { newsMeta } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

async function main() {
  await initLayout("news");
  const news = await getNews();

  const main = document.getElementById("main");
  const post = news.find((n) => n.id === getIdParam());

  if (!post) {
    main.replaceChildren(
      el("div", { class: "container section" }, notice("Запись не найдена", el("a", { class: "more-link", href: "news.html" }, "← Все новости"))),
    );
    return;
  }

  document.title = `${post.title} — The Pronyxx`;

  main.replaceChildren(
    el(
      "article",
      {},
      el(
        "header",
        { class: "page-hero" },
        el(
          "div",
          { class: "container" },
          el("div", { class: "breadcrumbs" }, el("a", { href: "news.html" }, "Новости"), " / ", post.title),
          newsMeta(post),
          el("h1", { text: post.title }),
          el("p", { class: "page-hero__lead", text: post.excerpt }),
        ),
      ),
      el(
        "div",
        { class: "container section" },
        // Каждый абзац — отдельный <p>. Текст вставляется как текст, HTML из JSON не выполняется.
        el("div", { class: "prose reveal" }, (post.body ?? []).map((paragraph) => el("p", { text: paragraph }))),
        el("p", { class: "block" }, el("a", { class: "more-link", href: "news.html" }, "← Все новости")),
      ),
    ),
  );

  refreshEffects();
}

main().catch(showError);
