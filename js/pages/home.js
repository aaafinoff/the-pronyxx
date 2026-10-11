// Главная страница: направления, флагманы, цифры и свежие новости.

import { el } from "../core/dom.js";
import { getDirections, getNews, getProjects, getStudio } from "../core/data.js";
import { directionCard, newsCard, projectCard } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

async function main() {
  await initLayout("home");

  // Promise.all загружает все файлы одновременно, а не по очереди — так быстрее
  const [directions, projects, news, studio] = await Promise.all([getDirections(), getProjects(), getNews(), getStudio()]);

  document.getElementById("hero-slogan").textContent = studio.slogan;

  document.getElementById("directions").replaceChildren(
    ...directions.map((d) => directionCard(d, projects.filter((p) => p.direction === d.id).length)),
  );

  document.getElementById("flagships").replaceChildren(
    ...projects.filter((p) => p.flagship).map((p) => projectCard(p, directions)),
  );

  // Число проектов считаем сами, остальные цифры берём из studio.json
  const stats = [{ label: "проектов в студии", value: projects.length }, ...(studio.stats ?? [])];
  document.getElementById("stats").replaceChildren(
    ...stats.map((s) =>
      el(
        "div",
        { class: "stat reveal" },
        el("span", { class: "stat__num shine-text", "data-count": s.value, text: "0" }),
        el("span", { class: "stat__label", text: s.label }),
      ),
    ),
  );

  document.getElementById("news").replaceChildren(...news.slice(0, 3).map(newsCard));

  refreshEffects();
}

main().catch(showError);
