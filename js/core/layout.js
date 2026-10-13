// ============================================================
// layout.js — то, что одинаково на всех страницах:
// шапка, подвал, переливающийся фон и анимации.
//
// Шапку и подвал рисует JavaScript, чтобы не копировать один и тот же HTML
// в девять файлов. Нужно добавить пункт меню — меняем только массив NAV.
// ============================================================

import { el, externalLink, safeUrl, notice } from "./dom.js";
import { getDirections, getStudio } from "./data.js";

const NAV = [
  { id: "projects", href: "projects.html", label: "Проекты" },
  { id: "news", href: "news.html", label: "Новости" },
  { id: "roadmap", href: "roadmap.html", label: "Roadmap" },
  { id: "about", href: "about.html", label: "О студии" },
  { id: "contacts", href: "contacts.html", label: "Контакты" },
];

// true, если человек включил в системе «уменьшить движение»
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Запускается в начале каждой страницы. active — id пункта меню, который подсветить. */
export async function initLayout(active) {
  document.documentElement.classList.add("js");
  document.body.prepend(el("div", { class: "aurora", "aria-hidden": "true" }));
  renderHeader(active);
  initPointerGlow();
  await renderFooter();
}

function renderHeader(active) {
  const header = document.getElementById("site-header");
  if (!header) return;

  const nav = el(
    "nav",
    { class: "nav", id: "site-nav", "aria-label": "Главное меню" },
    NAV.map((item) => el("a", { href: item.href, "aria-current": item.id === active ? "page" : null }, item.label)),
  );

  const burger = el(
    "button",
    { class: "burger", type: "button", "aria-label": "Открыть меню", "aria-expanded": "false", "aria-controls": "site-nav" },
    el("span"),
  );
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });

  header.replaceChildren(
    el(
      "div",
      { class: "container site-header__inner" },
      // width и height — настоящий размер файла: браузер заранее знает пропорции, и страница не «прыгает».
      // ?v=2 — номер версии картинки: когда меняешь файл, увеличь число, и браузеры скачают новый, а не возьмут старый из памяти
      el(
        "a",
        { class: "brand", href: "index.html" },
        el("img", { src: "images/brand/logo-header.webp?v=2", alt: "The Pronyxx — на главную", width: "1009", height: "160" }),
      ),
      nav,
      burger,
    ),
  );
}

async function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const [studio, directions] = await Promise.all([getStudio(), getDirections()]);

  footer.replaceChildren(
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "site-footer__inner" },
        el(
          "div",
          { class: "site-footer__about" },
          el(
            "a",
            { href: "index.html" },
            // loading="lazy" — картинка внизу страницы скачается, только когда до неё долистают
            el("img", {
              class: "site-footer__logo",
              src: "images/brand/logo-horizontal.webp",
              alt: `Логотип ${studio.name}`,
              width: "1099",
              height: "240",
              loading: "lazy",
            }),
          ),
          el("p", { text: studio.slogan }),
        ),
        el(
          "div",
          {},
          el("h3", { text: "Направления" }),
          el(
            "ul",
            {},
            directions.map((d) =>
              el(
                "li",
                {},
                el(
                  "a",
                  { href: `direction.html?id=${d.id}` },
                  // alt пустой: рядом уже написано название, значок здесь просто украшение
                  el("img", { class: "dir-icon", src: d.icon, alt: "", width: "26", height: "26", loading: "lazy" }),
                  d.name,
                ),
              ),
            ),
          ),
        ),
        el("div", {}, el("h3", { text: "Связь" }), el("ul", {}, socialItems(studio))),
      ),
      el("div", { class: "site-footer__bottom", text: `© ${new Date().getFullYear()} ${studio.name}` }),
    ),
  );
}

/** Список соцсетей и почты. Если ссылка ещё не вписана в studio.json — показываем «скоро». */
export function socialItems(studio) {
  const items = (studio.socials ?? []).map((s) =>
    el("li", {}, safeUrl(s.url) ? externalLink(s.label, s.url) : el("span", { class: "soon" }, s.label, el("small", { text: "скоро" }))),
  );
  const email = validEmail(studio.email);
  items.push(
    el("li", {}, email ? el("a", { href: `mailto:${email}` }, email) : el("span", { class: "soon" }, "Почта", el("small", { text: "скоро" }))),
  );
  return items;
}

/** Возвращает почту, только если она похожа на настоящую, иначе null. */
export function validEmail(value) {
  return typeof value === "string" && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value) ? value : null;
}

// ---------- Свечение за мышкой ----------
// Один обработчик на весь документ. requestAnimationFrame не даёт считать чаще,
// чем браузер успевает рисовать, — так сайт остаётся быстрым.
function initPointerGlow() {
  if (reduceMotion) return;
  const root = document.documentElement;
  let frame = 0;

  document.addEventListener(
    "pointermove",
    (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--px", (event.clientX / innerWidth - 0.5).toFixed(3));
        root.style.setProperty("--py", (event.clientY / innerHeight - 0.5).toFixed(3));

        const card = event.target instanceof Element ? event.target.closest(".card") : null;
        if (card) {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${event.clientX - box.left}px`);
          card.style.setProperty("--my", `${event.clientY - box.top}px`);
        }
      });
    },
    { passive: true },
  );
}

// ---------- Появление блоков и счётчики ----------
// IntersectionObserver сообщает, когда элемент появился на экране.
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.12 },
);

const countObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.4 },
);

/** Плавно «докручивает» число от 0 до значения из data-count. */
function animateCount(node) {
  const target = Number(node.dataset.count) || 0;
  const show = (value) => (node.textContent = Math.round(value).toLocaleString("ru-RU"));
  if (reduceMotion) return show(target);

  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    show(target * (1 - Math.pow(1 - progress, 3))); // быстро в начале, медленно в конце
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Вызываем после того, как нарисовали новые блоки, — чтобы анимации их «увидели». */
export function refreshEffects(root = document) {
  root.querySelectorAll(".reveal:not(.is-visible)").forEach((node) => revealObserver.observe(node));
  root.querySelectorAll("[data-count]").forEach((node) => countObserver.observe(node));
}

/** Если данные не загрузились — показываем понятное сообщение вместо пустой страницы. */
export function showError(error) {
  console.error(error);
  const main = document.getElementById("main");
  if (!main) return;
  main.replaceChildren(
    el(
      "div",
      { class: "container section" },
      notice("Не удалось загрузить данные", "Сайт нужно открывать через локальный сервер, а не двойным кликом по файлу. Как это сделать — в README.md."),
    ),
  );
}
