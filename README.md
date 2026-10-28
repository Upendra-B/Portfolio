# upendrabhandari.com.np

Personal portfolio site for **Upendra Bhandari** — Data Science Master's student
in Sydney, Australia. Static, dependency-free, and deployed on Cloudflare.

**Live:** <https://upendrabhandari.com.np>

---

## Design

The page is built around the instruments of the subject. A faint plot grid sits
behind everything, section labels are drawn as axis gradations, and two signal
hues carry consistent meaning throughout:

| Hue | Token | Means |
| --- | --- | --- |
| Cyan | `--sig-a` | study, model, class A, historical data |
| Amber | `--sig-b` | work, residual below the fit, class B, forecast |

Two elements do real work rather than decorate:

- **The hero plot** fits an ordinary least-squares line to the points on screen
  and recomputes slope, intercept and R² every frame. Clicking adds a point and
  the fit moves. The faint vertical segments are the residuals — the quantity
  least squares minimises.
- **The timeline** is a Gantt chart on a true date axis spanning 2022–2028, so
  the overlap between full-time work and study is measured, not illustrated.

Both themes are designed rather than inverted. The site defaults to dark,
follows the operating system preference, and remembers an explicit choice.

---

## Structure

```
.
├── index.html                  # all content, semantic and crawlable
├── assets/
│   ├── css/
│   │   ├── tokens.css          # the design system: colour, type, scale
│   │   ├── base.css            # reset, typography, layout primitives
│   │   └── components.css      # one block per region of the page
│   ├── js/
│   │   ├── theme.js            # light/dark switching, palette broadcast
│   │   ├── regression.js       # the interactive least-squares plot
│   │   └── ui.js               # scroll progress, footer year
│   └── favicon.svg
├── robots.txt
├── sitemap.xml
└── README.md
```

Content lives in `index.html` rather than a JSON file loaded at runtime, so
search engines and screen readers get the full page without executing
JavaScript. Every colour value is declared once in `tokens.css`; components
only read tokens, which keeps the two themes in step.

---

## Running it locally

No build step and no dependencies. Open `index.html` directly, or serve the
folder to get correct relative paths:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Deploying

Hosted on Cloudflare Pages, with DNS and TLS handled by Cloudflare.

**Via Git** — push to `main` and Cloudflare rebuilds automatically:

```bash
git add .
git commit -m "Update project descriptions"
git push
```

**Build settings** (static site, nothing to compile):

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `/` |

---

## Browser support

Modern evergreen browsers. The page degrades sensibly:

- `prefers-reduced-motion` is respected — the plot renders once and stays still.
- Without JavaScript, all content still reads; only the plot and the theme
  toggle are lost.
- `localStorage` access is wrapped in `try/catch` for private browsing.
- The plot is reachable by keyboard through the **Add point** and **Reset**
  buttons.

---

## Licence

Code is released under the MIT Licence — see [LICENSE](LICENSE).
Written content and personal details are not covered by it.
