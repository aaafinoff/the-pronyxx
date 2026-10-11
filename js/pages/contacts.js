// Контакты: форма связи и соцсети.
//
// У сайта пока нет сервера, поэтому форма не отправляет письмо сама.
// Она проверяет поля и открывает почтовую программу с готовым письмом (mailto:).
// Настоящая отправка появится в v1.0 вместе с бэкендом.

import { getStudio } from "../core/data.js";
import { initLayout, refreshEffects, showError, socialItems, validEmail } from "../core/layout.js";

// Правила проверки. Каждая функция возвращает текст ошибки или пустую строку, если всё хорошо.
const RULES = {
  name: (value) => (value.length < 2 ? "Напиши имя — хотя бы 2 буквы." : value.length > 60 ? "Слишком длинное имя." : ""),
  email: (value) => (validEmail(value) && value.length <= 100 ? "" : "Проверь почту — она должна выглядеть как name@example.com."),
  message: (value) =>
    value.length < 10 ? "Сообщение слишком короткое — хотя бы 10 символов." : value.length > 2000 ? "Сообщение слишком длинное." : "",
};

async function main() {
  await initLayout("contacts");
  const studio = await getStudio();

  document.getElementById("socials").replaceChildren(...socialItems(studio));

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  /** Проверяет одно поле и показывает ошибку под ним. Возвращает true, если поле в порядке. */
  function validate(field) {
    const input = form.elements[field];
    const error = RULES[field](input.value.trim());
    document.getElementById(`${field}-error`).textContent = error;
    input.setAttribute("aria-invalid", String(Boolean(error)));
    return !error;
  }

  // Проверяем поле, когда человек из него вышел
  for (const field of Object.keys(RULES)) {
    form.elements[field].addEventListener("blur", () => validate(field));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // не даём браузеру перезагрузить страницу
    status.className = "form__status";

    // map (а не every) — чтобы проверить и подсветить сразу все поля
    const results = Object.keys(RULES).map(validate);
    if (results.includes(false)) {
      status.textContent = "Исправь поля, отмеченные красным.";
      return;
    }

    const to = validEmail(studio.email);
    if (!to) {
      status.textContent = "Почта студии ещё не указана. Впиши её в data/studio.json в поле email.";
      return;
    }

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    // encodeURIComponent превращает пробелы и спецсимволы в безопасный для адреса вид
    const subject = encodeURIComponent(`Сообщение с сайта от ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}, ${email}`);
    location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    status.textContent = "Открываем почтовую программу — осталось нажать «Отправить».";
    status.classList.add("form__status--ok");
  });

  refreshEffects();
}

main().catch(showError);
