document.addEventListener("DOMContentLoaded", function () {
  var buttons = document.querySelectorAll(".theme-toggle");
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function getEffectiveTheme() {
    var forced = document.documentElement.getAttribute("data-theme");
    if (forced) return forced;
    return darkQuery.matches ? "dark" : "light";
  }

  function updateButtons() {
    var theme = getEffectiveTheme();
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
      buttons[i].title = theme === "dark" ? "Светлая тема" : "Тёмная тема";
    }
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      var current = getEffectiveTheme();
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      updateButtons();
    });
  }

  darkQuery.addEventListener("change", updateButtons);
  updateButtons();
});
