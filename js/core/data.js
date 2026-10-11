// ============================================================
// data.js — единственное место, где сайт читает данные.
//
// Сейчас данные лежат в JSON-файлах в папке data/.
// Когда появится API (v1.0), достаточно будет поменять адреса здесь —
// страницы переписывать не придётся. Мобильное приложение будет читать то же самое.
// ============================================================

const cache = new Map();

/** Загружает data/<name>.json. Второй раз тот же файл не скачивается — берётся из памяти. */
function loadJSON(name) {
  if (!cache.has(name)) {
    const request = fetch(`data/${name}.json`).then((response) => {
      if (!response.ok) throw new Error(`Не удалось загрузить ${name}.json (код ${response.status})`);
      return response.json();
    });
    cache.set(name, request);
  }
  return cache.get(name);
}

export async function getDirections() {
  return (await loadJSON("directions")).directions ?? [];
}

export async function getProjects() {
  return (await loadJSON("projects")).projects ?? [];
}

/** Новости, отсортированные от свежих к старым. */
export async function getNews() {
  const news = (await loadJSON("news")).news ?? [];
  return [...news].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getRoadmap() {
  return (await loadJSON("roadmap")).columns ?? [];
}

export function getStudio() {
  return loadJSON("studio");
}
