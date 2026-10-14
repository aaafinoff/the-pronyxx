"""
Собирает sitemap.xml — «карту сайта» для поисковиков (Google, Яндекс).

В карте перечислены все страницы сайта, включая страницу каждого проекта,
направления и новости. Поисковик читает карту и быстрее находит все страницы.

Запуск (из папки проекта) — после добавления проектов или новостей:
    py tools/build_sitemap.py
"""

import json
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://aaafinoff.github.io/the-pronyxx/"

# Обычные страницы и их важность для поисковика (от 0.0 до 1.0)
PAGES = [
    ("", 1.0),
    ("projects.html", 0.9),
    ("news.html", 0.8),
    ("roadmap.html", 0.7),
    ("about.html", 0.7),
    ("contacts.html", 0.6),
]


def load(name, key):
    return json.loads((ROOT / "data" / f"{name}.json").read_text(encoding="utf-8")).get(key, [])


def main():
    today = date.today().isoformat()
    urls = [(SITE_URL + path, today, priority) for path, priority in PAGES]

    for direction in load("directions", "directions"):
        urls.append((f"{SITE_URL}direction.html?id={direction['id']}", today, 0.7))
    for project in load("projects", "projects"):
        urls.append((f"{SITE_URL}project.html?id={project['id']}", today, 0.6))
    for post in load("news", "news"):
        # у новости дата изменения — дата самой новости
        urls.append((f"{SITE_URL}post.html?id={post['id']}", post.get("date", today), 0.5))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, priority in urls:
        # escape превращает «&» и другие спецсимволы в безопасный для XML вид
        lines.append(f"  <url><loc>{escape(loc)}</loc><lastmod>{lastmod}</lastmod><priority>{priority}</priority></url>")
    lines.append("</urlset>")

    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"sitemap.xml: {len(urls)} страниц")


if __name__ == "__main__":
    main()
