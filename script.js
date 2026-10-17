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
  if (document.querySelector(".about-drawer[open]") || !cursorMedia.matches || event.pointerType !== "mouse") {
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

const previewMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const visiblePreviews = new Set();

function showPreviewPoster(video) {
  const media = video.closest(".work-media");
  media.classList.remove("is-playing");
  media.querySelector(".video-preview-toggle").hidden = false;
}

function playVideoPreview(video) {
  video.closest(".work-media").classList.remove("preview-error");
  if (video.error) video.load();
  video.muted = true;
  try {
    const playback = video.play();
    if (playback) playback.catch(() => showPreviewPoster(video));
  } catch {
    showPreviewPoster(video);
  }
}

const previewObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio >= .1) {
      visiblePreviews.add(video);
      if (!previewMotion.matches && !document.hidden) playVideoPreview(video);
    } else {
      visiblePreviews.delete(video);
      video.pause();
    }
  });
}, { threshold: .1 });

function initializeVideoPreviews(root) {
  const videos = [...root.querySelectorAll(".work-media video")];
  videos.forEach((video) => {
    const media = video.closest(".work-media");
    const button = media.querySelector(".video-preview-toggle");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("webkit-playsinline", "");
    button.hidden = false;
    video.addEventListener("playing", () => {
      media.classList.add("is-playing");
      button.hidden = true;
    });
    video.addEventListener("pause", () => showPreviewPoster(video));
    video.addEventListener("error", () => {
      media.classList.add("preview-error");
      showPreviewPoster(video);
    });
    button.addEventListener("click", () => {
      playVideoPreview(video);
      media.querySelector(".work-image").focus({ preventScroll: true });
    });
    previewObserver.observe(video);
  });
  return () => {
    videos.forEach((video) => {
      previewObserver.unobserve(video);
      visiblePreviews.delete(video);
      video.pause();
    });
  };
}

function updateVisiblePreviews() {
  visiblePreviews.forEach((video) => {
    if (document.hidden || previewMotion.matches) video.pause();
    else playVideoPreview(video);
  });
}

document.addEventListener("visibilitychange", updateVisiblePreviews);
previewMotion.addEventListener("change", updateVisiblePreviews);
initializeVideoPreviews(document);

if (document.body.classList.contains("landing-page")) {
  const wings = document.createElement("div");
  wings.className = "floating-wings";
  wings.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 20; index += 1) {
    const wing = document.createElement("img");
    wing.className = "floating-wing";
    wing.src = "assets/floating-wings.png";
    wing.alt = "";
    wing.width = 48;
    wing.height = 24;
    wing.decoding = "async";
    wing.draggable = false;
    wing.style.left = `${Math.random() * 90 + 2}%`;
    wing.style.top = `${Math.random() * 90 + 2}%`;
    wing.style.animationDelay = `${Math.random() * -10}s`;
    wings.append(wing);
  }

  document.querySelector(".landing-hero").append(wings);

  const mobileProjectsMedia = window.matchMedia("(max-width: 760px)");
  const mobileProjectsTemplate = document.getElementById("mobile-projects-template");
  const workCue = document.querySelector(".mobile-work-cue");
  const projectEntry = document.querySelector(".project-entry");
  let mobileProjects;
  let disposeMobilePreviews;

  function updateMobileProjects() {
    if (!mobileProjectsTemplate) return;
    if (mobileProjectsMedia.matches && !mobileProjects) {
      mobileProjects = document.createElement("div");
      mobileProjects.className = "mobile-projects";
      mobileProjects.append(mobileProjectsTemplate.content.cloneNode(true));
      document.querySelector(".landing-main").append(mobileProjects);
      workCue.href = "#work";
      projectEntry.href = "#work";
      disposeMobilePreviews = initializeVideoPreviews(mobileProjects);
    } else if (!mobileProjectsMedia.matches && mobileProjects) {
      disposeMobilePreviews();
      mobileProjects.remove();
      mobileProjects = null;
      workCue.href = "work.html";
      projectEntry.href = "work.html";
    }
  }

  updateMobileProjects();
  mobileProjectsMedia.addEventListener("change", updateMobileProjects);
}

const projectBack = document.querySelector(".project-back");

if (projectBack) {
  const projectBackMedia = window.matchMedia("(max-width: 760px)");
  const projectBackHref = projectBack.getAttribute("href");

  function updateProjectBack() {
    projectBack.href = projectBackMedia.matches ? projectBackHref.replace("work.html#", "index.html#") : projectBackHref;
  }

  updateProjectBack();
  projectBackMedia.addEventListener("change", updateProjectBack);
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

});

const aboutTriggers = document.querySelectorAll("[data-open-about]");

if (aboutTriggers.length) {
  const aboutPanel = document.createElement("dialog");
  aboutPanel.className = "about-drawer";
  aboutPanel.id = "about-panel";
  aboutPanel.setAttribute("aria-labelledby", "about-panel-title");
  aboutPanel.innerHTML = `
    <div class="about-drawer-heading">
      <h2 id="about-panel-title">About Me</h2>
      <button class="about-close" type="button" aria-label="Close About Me" autofocus><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg></button>
    </div>
    <div class="about-drawer-body">
      <img class="about-drawer-portrait" src="assets/about-illustration.jpg" alt="Portrait illustration by Yuyao Wang" width="96" height="96">
      <p class="about-english" lang="en">I’m Yuyao Wang, a designer and illustrator who graduated from Parsons School of Design. My projects often start with everyday objects and the memories they bring back. I use soft colors and layered images to give familiar things a dreamlike feel. When designing websites, I like to include small details that people can discover as they explore.</p>
      <p class="about-chinese" lang="zh-CN">我是王雨遥，毕业于帕森斯设计学院，平时做书、做网页，也画插画。我常常从日常物件和它们带来的记忆开始创作，用柔和的色彩和层叠的图像，让熟悉的东西多一点梦境的感觉。做网页时，我喜欢留一些可以点击、慢慢发现的小细节。</p>
    </div>`;
  document.body.append(aboutPanel);
  let aboutOpener;
  let aboutClosing = false;

  function openAboutPanel(trigger) {
    if (aboutPanel.open) return;
    aboutOpener = trigger;
    hideCursor();
    contactMenus.forEach((menu) => { menu.open = false; });
    aboutTriggers.forEach((button) => button.setAttribute("aria-expanded", "true"));
    aboutPanel.showModal();
    aboutPanel.querySelector(".about-drawer-body").scrollTop = 0;
  }

  function closeAboutPanel() {
    if (!aboutPanel.open || aboutClosing) return;
    const finish = () => {
      aboutPanel.close();
      aboutClosing = false;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    aboutClosing = true;
    const animation = aboutPanel.animate([
      { transform: getComputedStyle(aboutPanel).transform },
      { transform: "translateX(-100%)" }
    ], { duration: 160, easing: "ease-in", fill: "forwards" });
    animation.finished.then(() => {
      finish();
      animation.cancel();
    });
  }

  aboutTriggers.forEach((button) => button.addEventListener("click", () => openAboutPanel(button)));
  aboutPanel.querySelector(".about-close").addEventListener("click", closeAboutPanel);
  aboutPanel.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAboutPanel();
  });
  aboutPanel.addEventListener("click", (event) => {
    if (event.target !== aboutPanel) return;
    const bounds = aboutPanel.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeAboutPanel();
  });
  aboutPanel.addEventListener("close", () => {
    aboutTriggers.forEach((button) => button.setAttribute("aria-expanded", "false"));
    aboutOpener?.focus({ preventScroll: true });
  });

  const aboutUrl = new URL(window.location.href);
  if (aboutUrl.searchParams.get("about") === "open") {
    openAboutPanel(aboutTriggers[0]);
    aboutUrl.searchParams.delete("about");
    window.history.replaceState(null, "", aboutUrl);
  }
}
