// Страница 404: GitHub Pages показывает её, если по адресу ничего нет.
// Сама страница статичная, скрипт только рисует шапку и подвал.

import { initLayout, showError } from "../core/layout.js";

initLayout(null).catch(showError);
