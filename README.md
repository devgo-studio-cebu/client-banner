# Client Banner — DEVGO Studio

A self-contained **"Under Development" splash page** for [DEVGO Studio](https://devgo.studio) client sites. Built with [Astro](https://astro.build), styled with Tailwind CSS v4, and featuring a real-time WebGL halftone video background. Designed to be dropped onto a bare domain while the main site is in progress — clean, minimal, and production-ready.

---

## ✨ Features

- **Editorial card layout** — Client name, status, about blurb, contact, and DEVGO Studio branding in a single elegant composition.
- **WebGL dithered video background** — Muted background video processed through a real-time Bayer-ordered dither shader with dot, line, or crosshatch modes. Pattern locks to screen pixels for crisp edges.
- **Build-time OG image generation** — Uses [Satori](https://github.com/vercel/satori) + [Sharp](https://sharp.pixelplumbing.com/) to generate `public/og-image.png` at build time, mirroring the editorial card aesthetic.
- **Per-client configuration** — Client name, contact email, and phone are driven by environment variables. Swap the `.env` file per deployment.
- **Full SEO suite** — JSON-LD structured data (Organization, WebSite, LocalBusiness, BreadcrumbList), Open Graph tags, Twitter Cards, canonical URLs, and sitemaps.
- **Entrance animations** — Staggered CSS animations with reduced-motion support.
- **404 page** — Branded error page with the same halftone background and editorial styling.
- **Web app manifest** — Installable as a standalone PWA with dark theme colors.
- **AI crawler governance** — `robots.txt` explicitly allows GPTBot, ChatGPT-User, Claude-Web, Google-Extended, and other AI crawlers.
- **Custom fonts** — MonumentExtended (headings) via local font provider, Montserrat Variable (body) via Fontsource.

---

## 🚀 Quick Start

**Prerequisites:** [Bun](https://bun.sh) (or Node.js ≥22.12.0)

```bash
# Install dependencies
bun install

# Copy and configure environment
cp .env.example .env
# Edit .env — set CLIENT_NAME and contact details

# Start dev server
bun dev
```

The dev server runs at `http://localhost:4321`.

---

## 📋 Commands

| Command           | Action                                              |
| :---------------- | :-------------------------------------------------- |
| `bun install`     | Install dependencies                                |
| `bun dev`         | Start dev server at `localhost:4321`                |
| `bun build`       | Generate OG image, type-check, and build to `dist/` |
| `bun preview`     | Preview the production build locally                |
| `bun start`       | Serve the production build on `0.0.0.0:4321`        |
| `bun generate-og` | Generate `public/og-image.png` from env vars        |
| `bun check`       | Type-check the project with `astro check`           |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable        | Required | Default                 | Description                                                    |
| :-------------- | :------: | :---------------------- | :------------------------------------------------------------- |
| `SITE_URL`      |   Yes    | `https://devgo.studio`  | Canonical site URL for sitemaps, OG tags, and canonical links  |
| `CLIENT_NAME`   |    No    | _(empty)_               | Client name shown in the banner heading. Empty displays "TBA". |
| `CONTACT_EMAIL` |    No    | `official@devgo.studio` | Contact email shown on the banner                              |
| `CONTACT_PHONE` |    No    | _(empty)_               | Optional phone number. Hidden when empty.                      |

---

## 📁 Project Structure

```text
client-banner/
├── public/                          # Static assets served at /
│   ├── _headers                     # Cloudflare headers config
│   ├── bg-fish.mp4                  # Background video for the halftone shader
│   ├── favicon.ico / favicon.svg    # Favicons
│   ├── manifest.webmanifest         # PWA manifest
│   └── fonts/                       # Reserved font directory
├── scripts/
│   └── generate-og-image.mjs        # Build-time OG image generator (Satori + Sharp)
├── src/
│   ├── assets/
│   │   └── fonts/
│   │       ├── MonumentExtended-Regular.otf
│   │       └── MonumentExtended-Ultrabold.otf
│   ├── components/
│   │   ├── DitheredVideoBackground.astro  # WebGL halftone video component
│   │   └── seo.astro                      # SEO head tags + JSON-LD schema
│   ├── layouts/
│   │   └── BaseLayout.astro               # Root HTML shell (fonts, meta, A/B variant init)
│   ├── pages/
│   │   ├── index.astro                    # Main splash page
│   │   ├── 404.astro                      # Custom 404 page
│   │   └── robots.txt.ts                  # Dynamic robots.txt with AI crawler rules
│   ├── styles/
│   │   ├── global.css                     # Tailwind theme, animations, A/B variant CSS
│   │   ├── montserrat-latin.css           # Montserrat variable font subset
│   │   └── montserrat-latin-ext.css       # Montserrat extended subset
│   └── types/
│       └── seo.ts                         # TypeScript interfaces for SEO + schema
├── astro.config.mjs                       # Astro config (site, env schema, fonts, integrations)
├── tsconfig.json                          # TypeScript config (Astro strict preset)
├── package.json
├── .env.example
└── .gitignore
```

---

## 🎨 The Halftone Video Background

The `DitheredVideoBackground` component renders a muted `<video>` element that drives a WebGL fragment shader. The shader:

1. **Samples video luminance** — Converts RGB to perceptual brightness.
2. **Applies a Bayer-ordered dither matrix** — 4×4 Bayer pattern normalised to 0–1.
3. **Generates pattern shapes** — Dots (radial), vertical lines, or crosshatch (diagonal), anti-aliased within each halftone cell.
4. **Locks to screen pixels** — Pattern stays crisp regardless of video panning.
5. **Handles shadows & highlights** — Cuts off below `shadowCrush` (dark areas) and fades above `highlightCeil` (specular highlights) to suppress noisy halftone in overexposed regions.

### Component Props

| Prop             | Type                                | Default      | Description                                                     |
| :--------------- | :---------------------------------- | :----------- | :-------------------------------------------------------------- |
| `src`            | `string`                            | _(required)_ | Video source URL                                                |
| `mode`           | `"dots" \| "lines" \| "crosshatch"` | `"dots"`     | Halftone pattern type                                           |
| `cellSize`       | `number`                            | `6`          | Halftone cell size in pixels                                    |
| `ditherStrength` | `number`                            | `1.0`        | Bayer dither amount (0–2)                                       |
| `dotColor`       | `string`                            | `"#ffffff"`  | Pattern color (hex)                                             |
| `shadowCrush`    | `number`                            | `0.50`       | Luminance threshold below which the pattern is fully suppressed |
| `highlightCeil`  | `number`                            | `0.85`       | Luminance above which the pattern fades out                     |
| `playbackRate`   | `number`                            | `0.5`        | Video playback speed                                            |
| `coverFit`       | `boolean`                           | `true`       | Match shader UVs to CSS `object-fit: cover`                     |
| `poster`         | `string`                            | —            | Poster image before video loads                                 |
| `class`          | `string`                            | `""`         | Extra CSS classes                                               |

The component respects `prefers-reduced-motion: reduce` — disables the video and canvas, showing a static accent glow instead.

---

## 🖼️ OG Image Generation

The script `scripts/generate-og-image.mjs` runs automatically during `bun build`. It:

1. Reads `CLIENT_NAME` and `CONTACT_EMAIL` from environment variables.
2. Renders an SVG layout with Satori that mirrors the editorial card (client name, status, email, DEVGO branding).
3. Converts to PNG with Sharp and writes to `public/og-image.png`.

The generated image is referenced in the SEO component's Open Graph `og:image` and Twitter `twitter:image` tags.

---

## 📡 SEO & Structured Data

The `seo.astro` component injects:

- **JSON-LD** — `@graph` containing Organization, WebSite, LocalBusiness, and BreadcrumbList schemas. Article schema is injected for pages with `type: "article"`.
- **Open Graph** — `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, `og:site_name`, `og:locale`.
- **Twitter Cards** — `summary_large_image` with `twitter:site` and `twitter:creator`.
- **Standard meta** — `description`, `keywords`, `author`, `robots`, `theme-color`, `color-scheme`.
- **Canonical URL** — Per-page canonical link.
- **hreflang** — `en` + `x-default` alternates.
- **Sitemap** — Auto-generated by `@astrojs/sitemap` at `/sitemap-index.xml`.

---

## ⚡ Deployment

The project is designed for deployment on **Cloudflare Workers** using Astro's Cloudflare adapter. The `public/_headers` file configures Cloudflare-specific HTTP headers.

For other platforms, standard Astro deployment applies — the production build outputs static HTML to `dist/`.

---

## 🛠️ Tech Stack

| Layer      | Technology                                                                             |
| :--------- | :------------------------------------------------------------------------------------- |
| Framework  | [Astro 6](https://astro.build)                                                         |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com) + `@tailwindcss/typography`                 |
| TypeScript | TypeScript 6 (Astro strict preset)                                                     |
| Fonts      | MonumentExtended (local), [Montserrat Variable](https://fontsource.org)                |
| OG Images  | [Satori](https://github.com/vercel/satori) + [Sharp](https://sharp.pixelplumbing.com/) |
| WebGL      | Raw WebGL 1.0 fragment shader (no dependencies)                                        |
| Runtime    | Bun or Node.js ≥22.12.0                                                                |
| Icons      | [Lucide Astro](https://lucide.dev)                                                     |
| Deployment | Cloudflare Workers (or any static host)                                                |

---

## 📄 License

Proprietary — DEVGO Studio. All rights reserved.
