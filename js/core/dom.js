// ============================================================
// dom.js — маленькие помощники для безопасной работы со страницей.
//
// ГЛАВНОЕ ПРАВИЛО БЕЗОПАСНОСТИ САЙТА:
// мы нигде не используем innerHTML. Весь текст из JSON попадает на страницу
// как обычный текст. Поэтому, даже если в данных окажется <script>,
// браузер покажет его буквами, а не запустит. Это и есть защита от XSS.
// ============================================================

/**
 * Проверяет ссылку. Разрешает только:
 *  - https://... и mailto:...
 *  - ссылки на этот же сайт (например "projects.html")
 * Всё остальное (например "javascript:...") отбрасывает и возвращает null.
 */
export function safeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return null;
  try {
    // document.baseURI учитывает тег <base> (он есть на странице 404), а без него равен адресу страницы
    const parsed = new URL(url, document.baseURI);
    if (parsed.protocol === "https:" || parsed.protocol === "mailto:") return parsed.href;
    if (parsed.origin === location.origin) return parsed.href;
  } catch {
    // строка вообще не похожа на адрес — считаем её небезопасной
  }
  return null;
}

/**
 * Создаёт HTML-элемент.
 *   el("a", { class: "btn", href: "projects.html" }, "Проекты")
 * Дети-строки добавляются как текст, а href и src проходят проверку safeUrl.
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key === "class") {
      node.className = value;
    } else if (key === "text") {
      node.textContent = value;
    } else if (key === "href" || key === "src") {
      const url = safeUrl(value);
      if (url) node.setAttribute(key, url);
    } else {
      node.setAttribute(key, value === true ? "" : String(value));
    }
  }

  node.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

/** Ссылка на другой сайт. Открывается в новой вкладке; rel защищает нашу страницу от чужой. */
export function externalLink(label, url, className) {
  return el("a", { class: className, href: url, target: "_blank", rel: "noopener noreferrer" }, label);
}

/**
 * Достаёт id из адреса страницы: project.html?id=prism-realm → "prism-realm".
 * Разрешаем только маленькие латинские буквы, цифры и дефис — это проверка входных данных.
 */
export function getIdParam(name = "id") {
  const value = new URLSearchParams(location.search).get(name);
  return value && /^[a-z0-9-]{1,64}$/.test(value) ? value : null;
}

/** "2026-10-11" → "11 октября 2026 г." */
export function formatDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/** Правильное окончание слова: plural(5, "проект", "проекта", "проектов") → "5 проектов" */
export function plural(n, one, few, many) {
  return `${n} ${pluralWord(n, one, few, many)}`;
}

/** То же, но только слово: pluralWord(260, "день", "дня", "дней") → "дней" */
export function pluralWord(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Сколько полных дней осталось до даты "2027-07-01". Сегодня → 0, прошедшая дата → отрицательное число. */
export function daysUntil(iso) {
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Math.round, а не floor: при переводе часов в сутках бывает 23 или 25 часов
  return Math.round((target - today) / 86400000);
}

/** Показывает сообщение в блоке (например «ничего не найдено»). */
export function notice(title, text) {
  return el("div", { class: "notice" }, el("strong", { text: title }), text);
}
