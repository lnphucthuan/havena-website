# Havena — demo website

A landing site for **Havena**, a fictional real-estate brand. Built with plain HTML/CSS/JS, [GSAP](https://gsap.com) + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering) smooth scroll and a small WebGL water shader.

- `index.html` — preloader, hero marquee, "Our Selection" zoom-out with category cards
- `category.html?c=seaside|greenline|city|rare` — collection pages
- `about.html`, `contact.html`

Content lives in `js/data.js`. Photos from [Unsplash](https://unsplash.com/license). All names, figures and quotes are placeholders.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (opening the files directly with `file://` works, but without the water effect).
