// ============================================================
// components.js — готовые карточки, которые используются на разных страницах.
// Каждая функция получает объект из JSON и возвращает готовый элемент.
// ============================================================

import { el, safeUrl, formatDate, plural } from "./dom.js";

const STATUS = {
  live: "Работает",
  dev: "В разработке",
  planned: "В планах",
};

const NEWS_TYPE = {
  news: "Новость",
  devlog: "Девлог",
};

/** Значок статуса: 🟢 работает, 🟡 в разработке, 🔵 в планах. */
export function statusBadge(status) {
  const key = status in STATUS ? status : "planned";
  return el("span", { class: `badge badge--${key}` }, el("span", { class: "badge__dot" }), STATUS[key]);
}

const COMING_SOON = "images/backgrounds/coming-soon.webp";

/**
 * Картинка проекта. Если своей картинки нет — заглушка «скоро» (кристалл над планетой).
 * Все эти картинки лежат ниже первого экрана, поэтому грузятся лениво (loading="lazy").
 */
export function thumb(name, image) {
  if (safeUrl(image)) {
    return el("div", { class: "thumb" }, el("img", { src: image, alt: `Скриншот проекта ${name}`, loading: "lazy" }));
  }
  return el(
    "div",
    { class: "thumb" },
    el("img", { src: COMING_SOON, alt: `Картинка проекта ${name} скоро появится`, width: "960", height: "540", loading: "lazy" }),
    el("span", { class: "thumb__soon", "aria-hidden": "true", text: "Скоро" }),
  );
}

/** Находит название направления по его id. */
export function directionName(directions, id) {
  return directions.find((d) => d.id === id)?.name ?? "";
}

/** Карточка проекта для каталога и главной. */
export function projectCard(project, directions) {
  return el(
    "a",
    { class: "card project-card reveal", href: `project.html?id=${project.id}` },
    thumb(project.name, project.image),
    el("span", { class: "card__label", text: directionName(directions, project.direction) }),
    el("h3", { text: project.name }),
    el("p", { text: project.short }),
    el("div", { class: "card__foot" }, statusBadge(project.status)),
  );
}

/** Цветной значок направления (кристалл). Путь к файлу лежит в directions.json в поле icon. */
export function directionIcon(direction, className) {
  return el("img", {
    class: className,
    src: direction.icon,
    alt: `Значок направления ${direction.name}`,
    width: "512",
    height: "512",
    loading: "lazy",
  });
}

/** Большая карточка направления. */
export function directionCard(direction, projectCount) {
  return el(
    "a",
    { class: "card direction-card reveal", href: `direction.html?id=${direction.id}` },
    directionIcon(direction, "direction-card__icon"),
    el("h3", { text: direction.name }),
    el("p", { text: direction.tagline }),
    el("span", { class: "direction-card__count", text: `${plural(projectCount, "проект", "проекта", "проектов")} →` }),
  );
}

/** Строчка «дата · тип» для новости. */
export function newsMeta(post) {
  return el(
    "div",
    { class: "news-card__meta" },
    el("span", { class: "news-card__type", text: NEWS_TYPE[post.type] ?? NEWS_TYPE.news }),
    el("time", { datetime: post.date, text: formatDate(post.date) }),
  );
}

/** Карточка новости. */
export function newsCard(post) {
  return el(
    "a",
    { class: "card news-card reveal", href: `post.html?id=${post.id}` },
    newsMeta(post),
    el("h3", { text: post.title }),
    el("p", { text: post.excerpt }),
  );
}
