// Главная страница: обратный отсчёт, направления, флагманы, цифры и свежие новости.

import { daysUntil, el, formatDate, pluralWord } from "../core/dom.js";
import { getDirections, getNews, getProjects, getStudio } from "../core/data.js";
import { directionCard, newsCard, projectCard } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

async function main() {
  await initLayout("home");

  // Promise.all загружает все файлы одновременно, а не по очереди — так быстрее
  const [directions, projects, news, studio] = await Promise.all([getDirections(), getProjects(), getNews(), getStudio()]);

  document.getElementById("hero-slogan").textContent = studio.slogan;

  renderCountdown(projects);

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

/**
 * Обратный отсчёт до открытия проекта. Берём ближайший проект, у которого
 * в projects.json указана дата открытия launchDate и она ещё не наступила.
 * Когда дата пройдёт, блок просто перестанет показываться.
 */
function renderCountdown(projects) {
  const upcoming = projects
    .filter((p) => p.launchDate && daysUntil(p.launchDate) > 0)
    .sort((a, b) => a.launchDate.localeCompare(b.launchDate))[0];
  if (!upcoming) return;

  const days = daysUntil(upcoming.launchDate);
  const section = el(
    "section",
    { class: "section section--tight" },
    el(
      "div",
      { class: "container" },
      el(
        "a",
        { class: "card countdown reveal", href: `project.html?id=${upcoming.id}` },
        el("span", { class: "eyebrow", text: "Обратный отсчёт" }),
        el(
          "p",
          { class: "countdown__line" },
          // data-count — число «докрутится» анимацией, как счётчики ниже
          el("span", { class: "countdown__num shine-text", "data-count": days, text: "0" }),
          el("span", { class: "countdown__unit", text: pluralWord(days, "день", "дня", "дней") }),
        ),
        el("p", { class: "countdown__text", text: `до открытия ${upcoming.name} — ${formatDate(upcoming.launchDate)}` }),
      ),
    ),
  );
  document.querySelector(".hero").after(section);
}

main().catch(showError);
