var navMain = document.querySelector(".header__wrapper");
var navToggle = document.querySelector(".logo__btn");

navMain.classList.remove("header__wrapper--nojs");
navToggle.addEventListener("click", function () {
  if (navMain.classList.contains("header__wrapper--close")) {
    navMain.classList.remove("header__wrapper--close");
    navMain.classList.add("header__wrapper--open");
  } else {
    navMain.classList.add("header__wrapper--close");
    navMain.classList.remove("header__wrapper--open");
  }
});
