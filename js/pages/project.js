// Страница одного проекта: описание, скриншоты, технологии, история версий, ссылки.

import { el, externalLink, formatDate, getIdParam, notice, safeUrl } from "../core/dom.js";
import { getDirections, getProjects } from "../core/data.js";
import { directionName, statusBadge, thumb } from "../core/components.js";
import { initLayout, refreshEffects, showError } from "../core/layout.js";

/** Блок с заголовком. Если содержимого нет — блок не показываем вообще. */
function block(title, content) {
  if (!content) return null;
  return el("section", { class: "block reveal" }, el("h2", { text: title }), content);
}

async function main() {
  await initLayout("projects");
  const [directions, projects] = await Promise.all([getDirections(), getProjects()]);

  const main = document.getElementById("main");
  const project = projects.find((p) => p.id === getIdParam());

  if (!project) {
    main.replaceChildren(
      el(
        "div",
        { class: "container section" },
        notice("Проект не найден", el("a", { class: "more-link", href: "projects.html" }, "← Вернуться в каталог")),
      ),
    );
    return;
  }

  document.title = `${project.name} — The Pronyxx`;

  // Если скриншотов нет — показываем одну заглушку «скоро»
  const hasScreenshots = project.screenshots?.length > 0;
  const screenshots = hasScreenshots ? project.screenshots : [""];
  const links = (project.links ?? []).filter((link) => safeUrl(link.url));

  main.replaceChildren(
    el(
      "section",
      { class: "page-hero" },
      el(
        "div",
        { class: "container" },
        el("div", { class: "breadcrumbs" }, el("a", { href: "projects.html" }, "Проекты"), " / ", project.name),
        el("h1", { text: project.name }),
        el("p", { class: "page-hero__lead", text: project.short }),
        el(
          "div",
          { class: "page-hero__meta" },
          statusBadge(project.status),
          el("a", { class: "chip", href: `direction.html?id=${project.direction}` }, directionName(directions, project.direction)),
        ),
      ),
    ),
    el(
      "div",
      { class: "container section" },
      block("О проекте", el("div", { class: "prose" }, el("p", { text: project.description }))),
      block("Скриншоты", el("div", { class: hasScreenshots ? "shots" : "shots shots--empty" }, screenshots.map((src) => thumb(project.name, src)))),
      block(
        "Технологии",
        project.tech?.length ? el("div", { class: "chips" }, project.tech.map((t) => el("span", { class: "chip", text: t }))) : null,
      ),
      block(
        "История версий",
        project.versions?.length
          ? el(
              "ul",
              { class: "versions" },
              // копируем список и переворачиваем, чтобы новая версия была сверху
              [...project.versions].reverse().map((v) =>
                el(
                  "li",
                  {},
                  el("div", {}, el("span", { class: "versions__ver", text: `v${v.version}` }), el("span", { class: "versions__date", text: formatDate(v.date) })),
                  el("p", { text: v.notes }),
                ),
              ),
            )
          : null,
      ),
      block(
        "Ссылки",
        links.length ? el("div", { class: "link-list" }, links.map((link) => externalLink(link.label, link.url, "btn btn--ghost"))) : null,
      ),
    ),
  );

  refreshEffects();
}

main().catch(showError);
