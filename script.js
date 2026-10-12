if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.removeAttribute("autoplay");
    video.pause();
  });
}

const cursorMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
const cursor = document.createElement("div");
cursor.className = "cursor";
cursor.hidden = true;
cursor.setAttribute("aria-hidden", "true");
document.body.append(cursor);

function hideCursor() {
  cursor.hidden = true;
  document.documentElement.classList.remove("custom-cursor-active");
}

document.addEventListener("pointermove", (event) => {
  if (!cursorMedia.matches || event.pointerType !== "mouse") {
    hideCursor();
    return;
  }
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
  cursor.hidden = false;
  document.documentElement.classList.add("custom-cursor-active");
});

document.addEventListener("pointerleave", hideCursor);
window.addEventListener("blur", hideCursor);
cursorMedia.addEventListener("change", hideCursor);
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") hideCursor();
});

if (document.body.matches(".landing-page, .about-page")) {
  function updateNavigationBackground() {
    document.body.classList.toggle("is-scrolled", window.scrollY > 0);
  }

  window.addEventListener("scroll", updateNavigationBackground, { passive: true });
  window.addEventListener("pageshow", updateNavigationBackground);
  updateNavigationBackground();
}

if (document.body.classList.contains("landing-page")) {
  const wings = document.createElement("div");
  wings.className = "floating-wings";
  wings.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 20; index += 1) {
    const wing = document.createElement("span");
    wing.className = "floating-wing";
    wing.textContent = "🪽";
    wing.style.left = `${Math.random() * 90 + 2}%`;
    wing.style.top = `${Math.random() * 90 + 2}%`;
    wing.style.animationDelay = `${Math.random() * -10}s`;
    wings.append(wing);
  }

  document.querySelector(".landing-hero").append(wings);
}

const contactMenus = document.querySelectorAll(".contact-menu");

contactMenus.forEach((menu) => {
  const summary = menu.querySelector("summary");
  const dropdown = menu.querySelector(".contact-dropdown");

  function positionContactMenu() {
    if (!menu.open) return;
    const menuLeft = menu.getBoundingClientRect().left;
    const desiredLeft = Math.max(12, Math.min(menuLeft, window.innerWidth - dropdown.offsetWidth - 12));
    dropdown.style.left = `${desiredLeft - menuLeft}px`;
  }

  menu.addEventListener("toggle", positionContactMenu);
  window.addEventListener("resize", positionContactMenu);
  document.fonts.ready.then(positionContactMenu);

  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target)) menu.open = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });

  menu.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget)) menu.open = false;
  });

  dropdown.addEventListener("click", (event) => {
    if (event.target.closest("a")) menu.open = false;
  });
});
