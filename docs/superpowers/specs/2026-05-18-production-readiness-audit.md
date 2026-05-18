# Production Readiness Audit — Client Banner

**Date:** 2026-05-18  
**Scope:** Full-site audit covering performance (device & network), SEO, and production deployment readiness.  
**Site:** Single-page Astro 6 "under development" banner for DEVGO Studio clients.  
**Stack:** Astro 6.3.3, Tailwind CSS 4, animejs, WebGL (custom shaders), Cloudflare Workers target.

---

## 1. CRITICAL — HTML Output Corruption

Two structural bugs in the generated HTML must be fixed before any production deployment. These are **blocking**.

### 1.1 Nested `<head>` Elements (BLOCKING)

**Root cause:** `BaseLayout.astro` renders a `<head>` tag, and `Seo.astro` (invoked inside it via `<Seo seo={seo} />`) also renders its own `<head>` tag. This produces:

```html
<head>...<title>...</title><head>...JSON-LD...OG tags...</head></head>
```

A `<head>` inside another `<head>` is invalid HTML 5. Browsers may recover but search engine parsers, accessibility tools, and Open Graph scrapers may not. This can silently break structured data extraction and social-card rendering.

**Required fix:** `Seo.astro` must not render a wrapping `<head>` element. Either emit only the `<slot/>`-compatible tags directly, or remove the `<head>` wrapper and rely on `BaseLayout.astro` as the sole `<head>` provider.

### 1.2 Duplicate `<title>` Tag (BLOCKING)

Both `BaseLayout.astro` and `Seo.astro` emit a `<title>` element. The spec allows only one `<title>` per document. Duplicate titles are undefined behavior; some parsers take the first, others the last. This also wastes bytes and may confuse SEO tools.

**Required fix:** Choose a single source of truth for the `<title>`. Remove the duplicate.

---

## 2. PERFORMANCE — Device

### 2.1 Background Video: 5.3 MB Single-File (HIGH)

The `banner-bg.webm` is 5.3 MB, served as a single file regardless of viewport or network conditions.

- **Mobile impact:** A 3G connection (~1.6 Mbps) would take ~26 seconds to download just the video before the shader has any data to sample.
- **No adaptive bitrate:** No `<source>` alternatives for lower resolutions or codec fallbacks (H.264 MP4 for Safari).
- **No `poster` attribute:** The video element has no poster image, so the background stays solid black until the first frame is decoded.
- **No lazy loading:** `preload="auto"` forces immediate download on page load.

**Constraints for fix:**
- Provide a compressed 720p variant (≤1.5 MB) as the default source, with the 1080p version as a `<source media>` option.
- Add an MP4 fallback for Safari/iOS compatibility.
- Generate and reference a static poster image (a single representative frame exported as WebP, ≤50 KB).
- Consider `preload="metadata"` to delay full download until the video is needed.

### 2.2 WebGL Shader Runs Unconditionally (MEDIUM)

The `DitheredVideoBackground` component creates a `requestAnimationFrame` render loop that uploads every video frame to a WebGL texture even when:
- The tab is backgrounded (battery drain on mobile).
- The user has `prefers-reduced-motion` set.
- The video hasn't started playing yet.

**Constraints for fix:**
- Integrate the Page Visibility API: pause the render loop when `document.hidden === true`.
- Respect `prefers-reduced-motion`: skip the shader entirely and fall back to a static background color or poster image.
- Add a `will-change: transform` or GPU layer hint so the browser composites the canvas efficiently.
- Cap DPR at 2 (already done in `resize()`) — verify it doesn't go above 2 on 3× devices (e.g., iPhone).

### 2.3 Font Payload: ~235 KB Total (MEDIUM)

The site ships:
- MonumentExtended Regular + Ultrabold: 67 KB (OTF, inlined as base64 via Astro fonts)
- Montserrat Variable subsets: 168 KB across 5 woff2 files (cyrillic, cyrillic-ext, latin, latin-ext, vietnamese)

The body text uses "Montserrat Variable" for a single line of contact email and a few label strings.

**Constraints for fix:**
- Strip unused Montserrat subsets: only `latin` and `latin-ext` are needed for Western European languages. Remove cyrillic, cyrillic-ext, and vietnamese subsets (saves ~78 KB).
- Consider replacing the Montserrat variable font with a system font stack for the minimal body text (saves all 168 KB). The `font-sans` variable could fall back to `system-ui, -apple-system, sans-serif` with negligible visual impact given the tiny amount of body text.
- Monument Extended OTF files (34 KB + 33 KB) are already small but could be subset further to include only uppercase Latin A-Z, digits, and punctuation (the site only uses uppercase for headings).

### 2.4 animejs Payload for Stagger Animation (LOW)

The full `animejs` library (~32 KB minified) is loaded for a single entrance stagger animation on 4 elements. This can be replaced with:
- CSS `@keyframes` with `animation-delay` for the stagger effect.
- A tiny custom JS animation (~1 KB) using `Element.animate()` (WAAPI).

### 2.5 No GPU Layer Hint on Card (LOW)

The editorial card uses `backdrop-filter: blur(3px)` which triggers a GPU paint on every frame the card is visible. No `will-change: transform` or `transform: translateZ(0)` is set, so the browser may repaint the entire card subtree on scroll or video frame changes.

---

## 3. PERFORMANCE — Network

### 3.1 No Cache-Control Headers (HIGH)

Neither a `_headers` file (Cloudflare Pages) nor server-rendered headers are configured. All assets are served with Cloudflare's default cache policy, which may be too short or non-deterministic. The hashed assets (`_astro/*.js`, `_astro/*.css`, `_astro/fonts/*.otf`) are immutable and should be cached aggressively.

**Constraints for fix:**
- Add a `public/_headers` file for Cloudflare Pages:
  ```
  /_astro/*
    Cache-Control: public, max-age=31536000, immutable
  /favicon.ico
    Cache-Control: public, max-age=604800
  /og-image.png
    Cache-Control: public, max-age=86400
  /banner-bg.webm
    Cache-Control: public, max-age=604800
  ```
- Alternatively, add Cloudflare `_headers` via Astro middleware or a Cloudflare Pages function.

### 3.2 No `preconnect` or `dns-prefetch` Hints (MEDIUM)

The site has no external third-party domains currently, but the `sameAs` URLs in JSON-LD (facebook.com, instagram.com, github.com, linkedin.com) imply future social integrations. If any analytics, CDN, or font provider is added, preconnect hints should be included.

### 3.3 No Compression Verification (LOW)

The built HTML (8.3 KB uncompressed) and CSS/JS should be served with Brotli or Gzip. Cloudflare does this automatically, but it's worth verifying with a `curl -H "Accept-Encoding: br"` on the deployed URL.

### 3.4 Missing Resource Hints for Critical Path (LOW)

The CSS file (`index.DFqYOlca.css`, 18 KB) is render-blocking. Consider inlining critical CSS (the Tailwind classes actually used above the fold) and loading the full stylesheet asynchronously. For a single-page site this small, the benefit is marginal but worth noting for future multi-page expansions.

---

## 4. SEO

### 4.1 Structured Data Gaps (MEDIUM)

The existing JSON-LD includes `Organization` and `WebSite` schemas. Missing:

- **`LocalBusiness` schema:** If DEVGO Studio has a physical address, phone, and geo-coordinates, this should be added for local SEO.
- **`BreadcrumbList` schema:** Even for a single-page site, a minimal breadcrumb helps search engines understand site hierarchy.
- **`sameAs` verification:** The JSON-LD `sameAs` array links to `facebook.com/devgostudio`, `instagram.com/devgostudio`, `github.com/devgo-studio-cebu`, and `linkedin.com/company/devgo-studio/`. Verify all four URLs return 200. A 404 on any `sameAs` link weakens the entity association signal.

### 4.2 Missing Meta Tags (MEDIUM)

- **`<meta name="robots">`:** While `robots.txt` allows crawling, a `meta robots` tag with `index, follow` provides defense-in-depth.
- **`<meta name="theme-color">`:** Browsers use this for the address bar / status bar color. Should match `#040906` (site background).
- **`<meta name="color-scheme">`:** Should be `dark` since the site is exclusively dark-themed.
- **`<meta name="format-detection">`:** `telephone=no` prevents iOS from auto-linking random numbers, but since you display a phone number intentionally, consider `telephone=yes` or omit entirely.
- **`<link rel="manifest">`:** A web app manifest enables "Add to Home Screen" on mobile. Even for a coming-soon page, it improves the mobile experience.

### 4.3 Sitemap Quality (LOW)

The sitemap contains a single `<url>` with no `lastmod`, `changefreq`, or `priority` children. While these are optional, search engines use `lastmod` for crawl scheduling. Add at minimum:

```xml
<lastmod>2026-05-18</lastmod>
<changefreq>weekly</changefreq>
<priority>1.0</priority>
```

### 4.4 Missing `hreflang` Tags (LOW)

If the site is English-only and targets a global audience, add `<link rel="alternate" hreflang="en" href="https://devgo.studio/">` and `<link rel="alternate" hreflang="x-default" href="https://devgo.studio/">`.

### 4.5 OG Image Fallback URL (LOW)

The OG image points to `https://devgo.studio/og-image.png`. If this endpoint returns 404 at deploy time (before the OG generation script runs), social scrapers cache the failure. Implement a build-time guard: the build must fail if `public/og-image.png` does not exist.

---

## 5. PRODUCTION DEPLOYMENT READINESS

### 5.1 No Custom 404 Page (HIGH)

Only `src/pages/index.astro` exists. Any malformed URL returns Cloudflare's default 404 page, which breaks brand consistency and loses traffic. Astro supports `src/pages/404.astro` (static) or `src/pages/[...path].astro` (catch-all).

### 5.2 No Security Headers (HIGH)

Neither a `_headers` file nor Astro middleware injects security headers:

| Header | Recommended Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (or `SAMEORIGIN` if embedding is ever needed) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | See §5.3 below |

### 5.3 Content Security Policy (MEDIUM)

The site loads:
- Inline styles (Tailwind generates these)
- Inline scripts (Astro hydration + animejs animation)
- WebGL canvas
- WebM video
- Fonts from same origin

A CSP should be constructed allowing these while blocking everything else. The `script-src` must include `'unsafe-inline'` for the inline animation script (or the script should be extracted to an external module). CSP is defense-in-depth; even a bare-minimum policy is better than none.

### 5.4 Missing `_headers` File for Cloudflare Pages (HIGH)

Cloudflare Pages reads `_headers` from the output directory. Astro copies `public/*` to `dist/*` during build. A `public/_headers` file should be created with:
- Immutable cache for hashed assets.
- Security headers for all routes.
- CORS headers if the video/fonts are ever loaded cross-origin.

### 5.5 Environment Variable Hygiene (MEDIUM)

- `.env.example` references `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` but the project has no `wrangler.toml` or Cloudflare deployment config. Clarify whether Cloudflare Workers or Cloudflare Pages is the intended target.
- The `SITE_URL` in `.env` is `https://devgo.studio` but Astro's `site` in `astro.config.mjs` also defaults to this. Having the default in two places creates a maintenance risk. Move the hardcoded default out of `astro.config.mjs` and let `SITE_URL` be the single source of truth (with a production-appropriate fallback).
- `.env` is listed in `.gitignore` but verify it has never been committed with `git log -- .env`. If it was ever committed, rotate any secrets.

### 5.6 `@img/sharp-darwin-arm64` in Dependencies (MEDIUM)

`package.json` lists `@img/sharp-darwin-arm64` as a direct dependency. This is a platform-specific optional dependency that Sharp pulls automatically. It should not be in the direct dependencies list because:
- It won't install on Linux (Cloudflare Workers build environment), potentially breaking the build.
- It's unnecessary; `sharp` already declares it as an `optionalDependency`.

Remove it from `dependencies` and let `sharp` manage its own platform packages.

### 5.7 No Build-Time Validation (MEDIUM)

The build script is `bun run generate-og && astro build`. There is no:
- TypeScript type-checking step (`astro check` or `tsc --noEmit`).
- Linting step.
- Test step.
- HTML validation step.

At minimum, add `astro check` before the build to catch TypeScript errors.

### 5.8 Video Accessibility (LOW)

The `<video>` element has no:
- `aria-label` or `aria-describedby` for screen readers.
- `<track>` elements for captions (not applicable for abstract background video, but an empty `<track>` with `kind="captions"` silences some validators).
- The canvas overlay is invisible to screen readers — consider `aria-hidden="true"` on the canvas and the wrapper.

### 5.9 No Analytics or Monitoring (LOW)

No performance monitoring (Web Vitals), error tracking, or analytics. For a coming-soon page this is low priority, but if the client wants metrics (visit count, location, device), a lightweight privacy-respecting solution like Plausible or Cloudflare Web Analytics should be considered.

### 5.10 `favicon.ico` Quality (LOW)

The `favicon.ico` is 655 bytes — likely a 16×16 or 32×32 single-resolution file. Modern browsers prefer SVG favicons (which you have) but some contexts (bookmarks, older browsers) still use `.ico`. Ensure the `.ico` contains at least 16×16, 32×32, and 48×48 resolutions.

---

## 6. ARCHITECTURAL CONSTRAINTS

### 6.1 Component Boundaries

The current component tree is:

```
BaseLayout.astro         ← <html>, <head>, <body>, <slot/>
├── Seo.astro            ← <head> with meta tags, JSON-LD, OG
│   (invoked inside BaseLayout's <head> — NESTING BUG)
└── index.astro          ← page content
    └── DitheredVideoBackground.astro  ← self-contained WebGL component
```

**Post-fix architecture should be:**

```
BaseLayout.astro         ← <html>, <head>, <body>, <slot/>
├── Seo.astro            ← Fragment of <meta>/<link>/<script> tags (NO <head>)
│   (slotted/inlined inside BaseLayout's <head>)
└── index.astro          ← page content
    └── DitheredVideoBackground.astro  ← self-contained WebGL component
```

`Seo.astro` must be a **headless fragment** — a collection of `<meta>`, `<link>`, `<script>`, and `<title>` elements with no wrapping tag.

### 6.2 Data Flow

```
.env / Cloudflare env vars
    ↓
astro.config.mjs (envField schema)
    ↓
astro:env/server (CLIENT_NAME, CONTACT_EMAIL, CONTACT_PHONE)
    ↓
index.astro (constructs seoProps, passes to BaseLayout)
    ↓
BaseLayout.astro (wraps in <html>, delegates to Seo.astro)
    ↓
Seo.astro (renders meta tags from seoProps)
```

No client-side data fetching. All content is build-time static. This is the correct pattern for this site.

### 6.3 Asset Pipeline

```
src/assets/fonts/        ← Source fonts (.otf)
    ↓ (Astro Fonts API)
dist/_astro/fonts/       ← Hashed font copies optimized

public/banner-bg.webm    ← Source video (manual)
    ↓ (cp)
dist/banner-bg.webm      ← Copied as-is (no optimization step)

scripts/generate-og-image.mjs  ← Build-time OG generator
    ↓
public/og-image.png      ← Generated, then copied to dist/
```

**Gap:** No video optimization step in the build pipeline. The 5.3 MB source is copied verbatim. A `scripts/optimize-video.mjs` should be added that produces 720p and 1080p variants, plus an MP4 fallback and a poster frame.

### 6.4 Deployment Target

The `.env.example` references Cloudflare Workers. Astro 6 supports Cloudflare Pages natively via the `@astrojs/cloudflare` adapter. If Workers is the actual target (not Pages), the deployment architecture differs:

- **Cloudflare Pages:** Static output (`astro build`), deploy via `wrangler pages deploy` or Git integration. `_headers` and `_redirects` in output directory are honored.
- **Cloudflare Workers:** SSR output, requires `@astrojs/cloudflare` adapter with `mode: "advanced"` or `mode: "directory"`.

Clarify which target is intended and add the appropriate adapter and deployment configuration.

---

## 7. SECURITY REQUIREMENTS

### 7.1 Input Sanitization

`CLIENT_NAME` is user-provided and rendered directly into HTML via `{clientName}`. Astro's expression syntax auto-escapes HTML entities, so XSS through env vars is mitigated. **No additional escaping needed** as long as the value is only rendered via `{expression}` syntax (not `set:html`).

### 7.2 Secrets Management

- `CONTACT_EMAIL` and `CONTACT_PHONE` are public by design (displayed on-page).
- No API keys, tokens, or secrets are used at build or runtime beyond what Cloudflare injects.
- If analytics or third-party services are added, use Cloudflare Workers secrets (`wrangler secret put`) rather than `.env` files.

### 7.3 Dependencies

- `animejs` v4.4.1 — actively maintained, no known vulnerabilities. Consider removing if animation is rewritten in CSS/WAAPI.
- `sharp` v0.34.5 — actively maintained, used only for OG image generation at build time.
- `satori` v0.26.0 — used only at build time for OG image SVG rendering.
- `@img/sharp-darwin-arm64` — should be removed from direct dependencies per §5.6.

---

## 8. PRIORITY MATRIX

| # | Issue | Category | Priority | Effort |
|---|---|---|---|---|
| 1 | Nested `<head>` elements | HTML Validity | BLOCKING | 15 min |
| 2 | Duplicate `<title>` tag | HTML Validity | BLOCKING | 5 min |
| 3 | 5.3 MB video, no variants | Performance | HIGH | 1-2 hr |
| 4 | No cache headers (`_headers`) | Network | HIGH | 15 min |
| 5 | No security headers | Security | HIGH | 15 min |
| 6 | No custom 404 page | Production | HIGH | 30 min |
| 7 | WebGL loop runs in background | Performance | MEDIUM | 30 min |
| 8 | Unused font subsets (~78 KB) | Performance | MEDIUM | 15 min |
| 9 | `@img/sharp-darwin-arm64` in deps | Build | MEDIUM | 5 min |
| 10 | No build-time validation | Production | MEDIUM | 10 min |
| 11 | Missing meta tags (theme-color, robots, etc.) | SEO | MEDIUM | 15 min |
| 12 | Sitemap missing metadata | SEO | LOW | 5 min |
| 13 | animejs replacement | Performance | LOW | 30 min |
| 14 | Video poster image | Performance | LOW | 20 min |
| 15 | CSP header | Security | LOW | 30 min |
| 16 | Analytics/monitoring | Production | LOW | 30 min |
| 17 | favicon.ico multi-resolution | Polish | LOW | 10 min |
| 18 | Video accessibility attributes | A11y | LOW | 5 min |
| 19 | Deployment target clarification | Infrastructure | MEDIUM | 20 min |

---

## 9. OUT OF SCOPE

The following are explicitly excluded from this audit and should be addressed separately:

- Multi-page expansion (this site is intentionally single-page).
- Admin dashboard or CMS integration.
- User authentication or login.
- Database or API backend.
- Internationalization (i18n) beyond English.
- A/B testing or feature flags.
- Real-time WebSocket or subscription features.

---

*End of audit. All items above represent issues observed in the current codebase and build output as of 2026-05-18.*
