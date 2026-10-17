# Yuyao Wang — Portfolio

Personal portfolio: https://yuyaow66.github.io/

The homepage introduces the portfolio; `work.html` holds the Web design, Book design, Motion, and Illustrations sections. The site also includes an About drawer, individual project pages, contact details, and the current resume.

## Project websites

- Souls in Repetition: `projects/digital-zine/`
- Abandoned Chairs: `projects/abandoned-chairs/`
- In Praise of Shadows: `projects/inpraiseofshadows/`
- Recipe Design: `projects/recipe-design/`
- Môme Choix links to its existing website at https://momechoix.com/.

## Local preview

Run `python3 -m http.server 8767 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:8767/.

## Publishing

GitHub Pages publishes the root of the `main` branch. Push changes to `main` to update the website. `.nojekyll` preserves the exported Next.js assets in `projects/abandoned-chairs/_next/`.

The MP4 files ending in `-web.mp4` are optimized for browser playback. Original source videos and superseded resumes stay local and are excluded from Git.
