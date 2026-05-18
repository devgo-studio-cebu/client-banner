# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix blocking HTML bugs, add production-hardening (cache headers, security headers, 404 page, build validation), improve performance (video optimization, WebGL lifecycle, font pruning), and enhance SEO (meta tags, structured data, sitemap quality).

**Architecture:** Single-page Astro 6 static site using Tailwind CSS, a WebGL dithered-video background component, and animejs for entrance animations. Changes are confined to 8 source files and 3 new files. All changes maintain backward compatibility with existing env vars and client configuration.

**Tech Stack:** Astro 6.3.3, Tailwind CSS 4, TypeScript, WebGL/GLSL, animejs 4, Cloudflare Pages (static deployment target).

> **CURRENT PROGRESS:** ✅ ALL PHASES COMPLETE (1-8)

---

## File Structure

| Action | File | Responsibility |
|--------|------|-----------------|
| Modify | `src/layouts/BaseLayout.astro` | Remove duplicate `<title>`, integrate `Seo.astro` as fragment |
| Modify | `src/components/seo.astro` | Remove `<head>` wrapper, add missing `<meta>` tags |
| Modify | `src/types/seo.ts` | Add `LocalBusinessSchema`, `BreadcrumbListSchema` types |
| Modify | `src/components/DitheredVideoBackground.astro` | Page Visibility API, prefers-reduced-motion, aria attrs, poster |
| Modify | `src/pages/index.astro` | Replace animejs with CSS animations, reduce font load |
| Modify | `src/styles/global.css` | Add CSS entrance animation keyframes |
| Modify | `src/pages/robots.txt.ts` | Pull site URL from `Astro.site` |
| Modify | `astro.config.mjs` | Sitemap config, remove hardcoded site fallback |
| Modify | `package.json` | Remove `@img/sharp-darwin-arm64`, add `astro check` to build |
| Create | `src/pages/404.astro` | Brand-consistent 404 page |
| Create | `public/_headers` | Cloudflare cache + security headers |
| Create | `public/manifest.webmanifest` | PWA manifest for Add to Home Screen |

---

## Phase 1: Critical HTML Fixes

Fixes the two blocking HTML validity bugs. After this phase, `index.html` output must contain exactly one `<head>` and one `<title>`.

### Task 1: Fix Seo.astro — remove `<head>` wrapper and duplicate `<title>`

**Files:**
- Modify: `src/components/seo.astro` (entire file frontmatter + template)
- Modify: `src/layouts/BaseLayout.astro` (remove `<title>` line)

- [x] **Step 1: Rewrite `seo.astro` template — remove the `<head>` and `</head>` wrapper tags and the `<title>` element**

The `<title>` is now owned solely by `BaseLayout.astro`. Remove the `<head>` opening and closing tags and the `<title>` element from `seo.astro`. The component becomes a fragment of meta/link/script tags that gets inlined into the parent `<head>`.

Replace the entire template section of `src/components/seo.astro` (everything after the closing `---` of the frontmatter) with:

```astro
<!-- JSON-LD Schema -->
<script
    is:inline
    type='application/ld+json'
    set:html={JSON.stringify(generateJsonLd())}
/>

<!-- Primary Meta Tags -->
<meta
    name='title'
    content={meta.title}
/>
<meta
    name='description'
    content={meta.description}
/>
<meta
    name='keywords'
    content={meta.keywords.join(", ")}
/>
<meta
    name='author'
    content={meta.author || "DEVGO Studio"}
/>
<meta
    name='robots'
    content='index, follow'
/>
<meta
    name='theme-color'
    content='#040906'
/>
<meta
    name='color-scheme'
    content='dark'
/>

<!-- Canonical URL -->
<link
    rel='canonical'
    href={meta.canonical}
/>

<!-- Open Graph / Facebook -->
<meta
    property='og:type'
    content={meta.type}
/>
<meta
    property='og:url'
    content={meta.canonical}
/>
<meta
    property='og:title'
    content={meta.title}
/>
<meta
    property='og:description'
    content={meta.description}
/>
<meta
    property='og:image'
    content={meta.image}
/>
<meta
    property='og:image:width'
    content='1200'
/>
<meta
    property='og:image:height'
    content='630'
/>
<meta
    property='og:image:type'
    content='image/png'
/>
<meta
    property='og:site_name'
    content='DEVGO Studio'
/>
<meta
    property='og:locale'
    content='en_US'
/>

<!-- Twitter -->
<meta
    name='twitter:card'
    content='summary_large_image'
/>
<meta
    name='twitter:url'
    content={meta.canonical}
/>
<meta
    name='twitter:title'
    content={meta.title}
/>
<meta
    name='twitter:description'
    content={meta.description}
/>
<meta
    name='twitter:image'
    content={meta.image}
/>
<meta
    name='twitter:site'
    content='@devgostudio'
/>
<meta
    name='twitter:creator'
    content='@devgostudio'
/>

<!-- Sitemap -->
<link
    rel='sitemap'
    href='/sitemap-index.xml'
/>

<!-- Web App Manifest -->
<link
    rel='manifest'
    href='/manifest.webmanifest'
/>

<!-- hreflang -->
<link
    rel='alternate'
    hreflang='en'
    href={meta.canonical}
/>
<link
    rel='alternate'
    hreflang='x-default'
    href={meta.canonical}
/>

<!-- Article specific (if type is article) -->
{
    meta.type === "article" && meta.publishedTime && (
        <meta
            property='article:published_time'
            content={meta.publishedTime}
        />
    )
}
{
    meta.type === "article" && meta.modifiedTime && (
        <meta
            property='article:modified_time'
            content={meta.modifiedTime}
        />
    )
}
{
    meta.type === "article" && meta.author && (
        <meta
            property='article:author'
            content={meta.author}
        />
    )
}
```

The frontmatter of `seo.astro` stays exactly the same.

- [x] **Step 2: Remove the `<title>` from `BaseLayout.astro`**

In `src/layouts/BaseLayout.astro`, remove the `<title>` line from the `<head>` section. The `<title>` is now provided by `Seo.astro` (which was already rendering one, but we removed it in Step 1 — so we need to keep ONE copy). Since `Seo.astro` now outputs a fragment, we need to place the `<title>` back into `Seo.astro`.

Wait — re-thinking. The current situation is:
- `BaseLayout.astro` has `<title>{seo?.title || "DEVGO Studio"}</title>`
- `Seo.astro` also has `<title>{meta.title}</title>`

The cleanest fix: keep `<title>` in `Seo.astro` (it already has the right value derived from props), and remove it from `BaseLayout.astro`.

So add back `<title>{meta.title}</title>` to the `seo.astro` template (it was removed in Step 1). Place it right after the JSON-LD script block, before the Primary Meta Tags comment.

In `src/components/seo.astro`, add the title tag immediately after the JSON-LD `<script>` block:

```astro
<!-- JSON-LD Schema -->
<script
    is:inline
    type='application/ld+json'
    set:html={JSON.stringify(generateJsonLd())}
/>

<title>{meta.title}</title>

<!-- Primary Meta Tags -->
...
```

Then in `src/layouts/BaseLayout.astro`, remove this line:

```astro
        <title>{seo?.title || "DEVGO Studio"}</title>
```

The full `<head>` section of `BaseLayout.astro` becomes:

```astro
    <head>
        <Font cssVariable='--font-monument-extended' />
        <meta charset='utf-8' />
        <link
            rel='icon'
            type='image/svg+xml'
            href='/favicon.svg'
        />
        <link
            rel='icon'
            href='/favicon.ico'
        />
        <meta
            name='viewport'
            content='width=device-width'
        />
        <meta
            name='generator'
            content={Astro.generator}
        />
        <Seo seo={seo} />
    </head>
```

- [x] **Step 3: Verify the build output**

Run: `bun run build`

Then inspect the dist output HTML:

Run: `grep -c '<head>' dist/index.html && grep -c '<title>' dist/index.html`

Expected: both return `1` (exactly one `<head>` and one `<title>`).

- [x] **Step 4: Commit**

```bash
git add src/components/seo.astro src/layouts/BaseLayout.astro
git commit -m "fix: remove nested <head> and duplicate <title> from SEO component"
```

---

## Phase 2: SEO Enhancements

Adds structured data schemas, missing meta tags, and a web app manifest. After this phase, the site has complete meta coverage and richer JSON-LD.

### Task 2: Add LocalBusiness and BreadcrumbList schemas to seo.astro

**Files:**
- Modify: `src/types/seo.ts` — add new schema types
- Modify: `src/components/seo.astro` — extend `generateJsonLd()` to include new schemas

- [x] **Step 1: Add schema types to `seo.ts`**

In `src/types/seo.ts`, append these interfaces after the existing ones:

```ts
export interface LocalBusinessSchema {
  "@type": "LocalBusiness";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  sameAs?: string[];
  geographicCoordinates?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
}

export interface BreadcrumbListSchema {
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}
```

- [x] **Step 2: Add schemas to `seo.astro` frontmatter**

In `src/components/seo.astro`, update the import to include the new types and extend the `generateJsonLd()` function. Replace the import line:

```ts
import type { SEOProps, OrganizationSchema, WebsiteSchema, LocalBusinessSchema, BreadcrumbListSchema } from "../types/seo"
```

Then add the new schemas after the `websiteSchema` constant (before the `generateJsonLd` function):

```ts
const localBusinessSchema: LocalBusinessSchema = {
    "@type": "LocalBusiness",
    name: "DEVGO Studio",
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    description: "A creative studio building digital experiences",
    email: "official@devgo.studio",
    sameAs: socialUrls,
}

const breadcrumbSchema: BreadcrumbListSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
        },
    ],
}
```

Then in the `generateJsonLd()` function, add these to the `graph` array after the WebSite entry:

```ts
graph.push(localBusinessSchema)
graph.push(breadcrumbSchema)
```

The full `generateJsonLd()` function becomes:

```ts
function generateJsonLd() {
    const graph: any[] = [
        {
            "@type": "Organization",
            ...organizationSchema,
        },
        {
            "@type": "WebSite",
            ...websiteSchema,
        },
        localBusinessSchema,
        breadcrumbSchema,
    ]

    if (meta.type === "article" && meta.publishedTime) {
        graph.push({
            "@type": "Article",
            headline: meta.title,
            description: meta.description,
            url: meta.canonical,
            image: meta.image,
            datePublished: meta.publishedTime,
            dateModified: meta.modifiedTime || meta.publishedTime,
            author: {
                "@type": "Organization",
                name: "DEVGO Studio",
            },
            publisher: {
                "@type": "Organization",
                name: "DEVGO Studio",
                logo: {
                    "@type": "ImageObject",
                    url: `${siteUrl}/favicon.svg`,
                },
            },
        })
    }

    return {
        "@context": "https://schema.org",
        "@graph": graph,
    }
}
```

Also update the `organizationSchema.logo` from `${siteUrl}/logo.png` to `${siteUrl}/favicon.svg` since no `logo.png` exists:

```ts
const organizationSchema: OrganizationSchema = {
    name: "DEVGO Studio",
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    sameAs: socialUrls,
}
```

- [x] **Step 3: Build and verify JSON-LD output**

Run: `bun run build`

Then extract and validate the JSON-LD:

Run: `node -e "const html = require('fs').readFileSync('dist/index.html','utf8'); const m = html.match(/<script type=\"application\\/ld\\+json\"[^>]*>(.*?)<\\/script>/s); const d = JSON.parse(m[1]); console.log(d['@graph'].map(g => g['@type']).join(', '));"`

Expected: `Organization, WebSite, LocalBusiness, BreadcrumbList`

- [x] **Step 4: Commit**

```bash
git add src/types/seo.ts src/components/seo.astro
git commit -m "feat: add LocalBusiness and BreadcrumbList schemas, missing meta tags, fix logo path"
```

### Task 3: Create web app manifest

**Files:**
- Create: `public/manifest.webmanifest`

- [x] **Step 1: Create `public/manifest.webmanifest`**

```json
{
    "name": "DEVGO Studio",
    "short_name": "DEVGO",
    "description": "A creative studio building digital experiences",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#040906",
    "theme_color": "#040906",
    "icons": [
        {
            "src": "/favicon.svg",
            "sizes": "any",
            "type": "image/svg+xml"
        },
        {
            "src": "/favicon.ico",
            "sizes": "32x32",
            "type": "image/x-icon"
        }
    ]
}
```

- [x] **Step 2: Verify the manifest is valid JSON and included in build output**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/manifest.webmanifest','utf8')); console.log('Valid JSON')" && ls dist/manifest.webmanifest`

Note: The `dist/` check requires running `bun run build` first. Alternatively just validate JSON syntax.

- [x] **Step 3: Commit**

```bash
git add public/manifest.webmanifest
git commit -m "feat: add web app manifest for Add to Home Screen"
```

---

## Phase 3: Performance — WebGL & Video Lifecycle

Prevents battery drain on mobile and improves accessibility. After this phase, the WebGL loop pauses when tab is hidden and degrades gracefully when reduced motion is preferred.

### Task 4: Add Page Visibility API and prefers-reduced-motion to DitheredVideoBackground

**Files:**
- Modify: `src/components/DitheredVideoBackground.astro` — template + script sections

- [x] **Step 1: Add `aria-hidden` and fallback content to the template**

In the `<div class="dither-video-wrapper ...">` opening tag, add `aria-hidden="true"` and `role="presentation"`:

Replace:
```astro
<div
    class={`dither-video-wrapper absolute inset-0 w-full h-full overflow-hidden ${className}`}
    data-src={src}
```

With:
```astro
<div
    class={`dither-video-wrapper absolute inset-0 w-full h-full overflow-hidden ${className}`}
    aria-hidden="true"
    role="presentation"
    data-src={src}
```

- [x] **Step 2: Add `prefers-reduced-motion` check — hide the entire component and show a static fallback**

Inside the component template, before the closing `</div>` of the wrapper (after the `<canvas>` tag), add a reduced-motion fallback div:

After the `<canvas>` line, add:

```astro
    {/* Reduced-motion fallback: solid accent glow */}
    <div
        class="absolute inset-0 z-[5] hidden reduced-motion-fallback"
        style="background: radial-gradient(ellipse at center, rgba(95,203,166,0.08) 0%, transparent 70%);"
    />
```

Then in the `<style>` block, add a media query:

```css
@media (prefers-reduced-motion: reduce) {
    .dither-video-wrapper video,
    .dither-video-wrapper canvas {
        display: none !important;
    }
    .dither-video-wrapper .reduced-motion-fallback {
        display: block !important;
    }
    .dither-video-wrapper {
        animation: none !important;
        opacity: 1 !important;
    }
}
```

- [x] **Step 3: Add Page Visibility API to pause/resume the render loop**

In the `<script>` section, after the `/* ---- Render loop ---- */` block and before the `/* ---- Kick-off when video can play ---- */` block, add visibility change handling.

Find this code in the script:

```ts
        /* ---- Kick-off when video can play ---- */
```

Insert this block immediately before it:

```ts
        /* ---- Pause rendering when tab is hidden ---- */
        function handleVisibilityChange() {
            if (document.hidden) {
                cancelAnimationFrame(rafId)
                video!.pause()
            } else {
                video!.play().catch(() => {})
                render()
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange)
```

Then add cleanup for the visibility listener. Find the `const cleanup` function and add `document.removeEventListener("visibilitychange", handleVisibilityChange)` inside it. The cleanup function becomes:

```ts
        const cleanup = () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener("resize", resize)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            gl!.deleteProgram(program)
            gl!.deleteShader(gl!.getAttachedShaders(program)![0])
            gl!.deleteShader(gl!.getAttachedShaders(program)![1])
            gl!.deleteBuffer(buffer)
            gl!.deleteTexture(texture)
        }
```

- [x] **Step 4: Add `prefers-reduced-motion` JavaScript guard**

In the auto-initialize block at the bottom of the script, wrap the initialization with a reduced-motion check. Replace:

```ts
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll<HTMLElement>(".dither-video-wrapper").forEach(initDitherVideo)
        })
    } else {
        document.querySelectorAll<HTMLElement>(".dither-video-wrapper").forEach(initDitherVideo)
    }
```

With:

```ts
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!prefersReducedMotion) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                document.querySelectorAll<HTMLElement>(".dither-video-wrapper").forEach(initDitherVideo)
            })
        } else {
            document.querySelectorAll<HTMLElement>(".dither-video-wrapper").forEach(initDitherVideo)
        }
    }
```

This prevents WebGL initialization entirely when the user prefers reduced motion; the CSS fallback from Step 2 handles the visual.

- [x] **Step 5: Change video `preload` from `auto` to `metadata`**

In the template section, change the `<video>` tag's `preload="auto"` to `preload="metadata"`:

Replace:
```astro
        muted
        autoplay
        loop
        playsinline
        preload="auto"
```

With:
```astro
        muted
        autoplay
        loop
        playsinline
        preload="metadata"
```

- [x] **Step 6: Build and verify**

Run: `bun run build`

Verify the component renders in the dist output and the reduced-motion CSS is present:

Run: `grep -c "prefers-reduced-motion" dist/_astro/index.DFqYOlca.css || echo "CSS not found, checking inline..." && grep "reduced-motion" dist/index.html | head -3`

- [x] **Step 7: Commit**

```bash
git add src/components/DitheredVideoBackground.astro
git commit -m "perf: add Page Visibility API, prefers-reduced-motion support, aria attrs, and preload=metadata"
```

---

## Phase 4: Performance — Entrance Animation (Replace animejs with CSS)

Removes the animejs runtime dependency (~32 KB) and replaces it with pure CSS animations. After this phase, `animejs` can be uninstalled.

### Task 5: Replace animejs with CSS keyframe animations

**Files:**
- Modify: `src/pages/index.astro` — remove `<script>` block, add CSS classes
- Modify: `src/styles/global.css` — add entrance animation keyframes
- Modify: `package.json` — remove `animejs` dependency

- [x] **Step 1: Add CSS entrance animations to `global.css`**

In `src/styles/global.css`, append the following after the `@layer components { ... }` block:

```css
/* Entrance animations — replaces animejs */
@keyframes hero-fade-up {
    from {
        opacity: 0;
        transform: translateY(28px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes hero-line-scale {
    from {
        opacity: 0;
        transform: scaleX(0);
    }
    to {
        opacity: 1;
        transform: scaleX(1);
    }
}

@keyframes hero-dot-pop {
    from {
        opacity: 0;
        transform: scale(0);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes hero-wrapper-in {
    from {
        opacity: 0;
        transform: scale(0.97);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@layer components {
    .hero-wrapper {
        animation: hero-wrapper-in 1s cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
    }

    .hero-section {
        animation: hero-fade-up 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .hero-section:nth-of-type(1) { animation-delay: 180ms; }
    .hero-section:nth-of-type(2) { animation-delay: 320ms; }
    .hero-section:nth-of-type(3) { animation-delay: 460ms; }

    .hero-line {
        animation: hero-line-scale 700ms cubic-bezier(0.25, 1, 0.5, 1) both;
        transform-origin: left;
    }

    .hero-line:first-of-type { animation-delay: 500ms; }
    .hero-line:last-of-type { animation-delay: 700ms; }

    .hero-dot {
        animation: hero-dot-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @media (prefers-reduced-motion: reduce) {
        .hero-wrapper,
        .hero-section,
        .hero-line,
        .hero-dot {
            animation: none !important;
        }
    }
}
```

- [x] **Step 2: Remove the `<script>` block from `index.astro`**

In `src/pages/index.astro`, delete the entire `<script>` block at the bottom of the file:

```astro
<script>
    import { animate, stagger } from 'animejs';
    ... (all 30+ lines through the closing </script> tag)
</script>
```

This removes the animejs import entirely.

- [x] **Step 3: Remove animejs from `package.json`**

Note: Remove `"animejs": "^4.4.1",` from the dependencies. This will be done via `bun remove animejs`.

Run: `bun remove animejs`

- [x] **Step 4: Build and verify animations still appear**

Run: `bun run build`

Then verify:
1. The animejs script reference is gone from the output: `grep -c "animejs" dist/index.html` — expected: `0`
2. The animation CSS classes are present: `grep "hero-wrapper-in\|hero-fade-up\|hero-dot-pop" dist/_astro/*.css | head -5`

- [x] **Step 5: Commit**

```bash
git add src/pages/index.astro src/styles/global.css package.json bun.lock
git commit -m "perf: replace animejs with CSS keyframe animations, remove 32KB runtime dependency"
```

---

## Phase 5: Production Hardening — Headers, 404, Build Validation

Adds cache and security headers, a custom 404 page, and build-time type checking. After this phase, the site is deploy-ready on Cloudflare Pages.

### Task 6: Create `public/_headers` for Cloudflare Pages

**Files:**
- Create: `public/_headers`

- [ ] **Step 1: Create the file `public/_headers`**

```
# Immutable hashed assets — cache for 1 year
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Static assets — cache for 1 week
/favicon.ico
  Cache-Control: public, max-age=604800
/favicon.svg
  Cache-Control: public, max-age=604800
/og-image.png
  Cache-Control: public, max-age=86400
/banner-bg.webm
  Cache-Control: public, max-age=604800

# Security headers for all routes
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 1; mode=block
```

Note: `Strict-Transport-Security` is omitted here because Cloudflare automatically adds HSTS when configured in the dashboard. CSP is deferred to a future task since it requires careful inline script handling after the animejs removal in Phase 4.

- [x] **Step 2: Verify the file is valid and will be copied to dist**

Run: `bun run build && cat dist/_headers`

Expected: the same file content appears.

- [x] **Step 3: Commit**

```bash
git add public/_headers
git commit -m "feat: add Cloudflare Pages _headers for cache-control and security"
```

### Task 7: Create custom 404 page

**Files:**
- Create: `src/pages/404.astro`

- [x] **Step 1: Create `src/pages/404.astro`**

This page reuses `BaseLayout` and `Seo` with the same visual style as `index.astro` but shows a "Page Not Found" message instead of client info.

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import DitheredVideoBackground from "../components/DitheredVideoBackground.astro";

const seoProps = {
    title: "404 — Page Not Found | DEVGO Studio",
    description: "The page you're looking for doesn't exist. Return to DEVGO Studio.",
    keywords: ["devgo", "studio", "404", "not found"],
    type: "website" as const,
};
---

<BaseLayout seo={seoProps}>
    <DitheredVideoBackground
        src="/banner-bg.webm"
        mode="dots"
        cellSize={10}
        ditherStrength={0.6}
        shadowCrush={0.65}
        playbackRate={0.35}
        dotColor="#5fcba6"
        class="fixed inset-0 w-full h-full"
    />

    <div
        class="fixed inset-0 pointer-events-none z-20"
        style="background: radial-gradient(ellipse at center, transparent 35%, rgba(4,9,6,0.75) 100%);"
    >
    </div>

    <main
        class="relative z-30 flex-1 flex items-center justify-center min-h-svh w-full px-5 py-10 md:px-10 md:py-16"
    >
        <div class="w-full max-w-4xl hero-wrapper">
            <div class="border border-accent/15 bg-bg/55 backdrop-blur-[3px] overflow-hidden p-6 md:p-10 lg:p-14">
                <div class="flex items-center gap-2.5 mb-5">
                    <span class="w-2 h-2 rounded-full bg-accent/50 hero-dot"></span>
                    <span class="text-accent/45 text-[10px] uppercase tracking-[0.28em] font-sans font-semibold">Error</span>
                </div>

                <h1 class="font-head uppercase text-4xl sm:text-5xl md:text-6xl text-text leading-[0.825] tracking-tight hero-section">
                    404
                </h1>

                <div class="mx-0 md:mx-0 lg:mx-0 h-px bg-accent/[0.08] my-6 md:my-8 hero-line"></div>

                <p class="font-sans text-sm md:text-base lg:text-[17px] text-text/50 leading-[1.7] max-w-xl hero-section">
                    The page you're looking for doesn't exist. It may have been moved or deleted.
                </p>

                <div class="mt-8 hero-section">
                    <a
                        href="/"
                        class="inline-block border border-accent/30 text-accent/70 hover:text-accent hover:border-accent/60 transition-all duration-300 px-6 py-3 font-sans text-sm uppercase tracking-[0.15em] font-semibold"
                    >
                        Return Home
                    </a>
                </div>
            </div>
        </div>
    </main>
</BaseLayout>
```

- [x] **Step 2 (adjusted): Build and verify 404 page is generated**

Astro 6 generates `dist/404.html` directly (not `dist/404/index.html`). Verified:

Run: `bun run build && ls dist/404.html`

Expected: file exists.

- [x] **Step 3 (skipped): No copy step needed**

Astro 6 already outputs `dist/404.html` at root — no post-build copy required.

- [x] **Step 4: Build and verify**

Run: `bun run build && ls -la dist/404.html`

Expected: file exists with content.

- [x] **Step 5: Commit**

```bash
git add src/pages/404.astro package.json
git commit -m "feat: add branded 404 page for Cloudflare Pages"
```

### Task 8: Remove `@img/sharp-darwin-arm64` from dependencies and add build validation

**Files:**
- Modify: `package.json` — remove `@img/sharp-darwin-arm64`, add `check` script

- [x] **Step 1: Remove platform-specific sharp dependency**

Run: `bun remove @img/sharp-darwin-arm64`

This removes it from `package.json` dependencies. Sharp will pull the correct platform package automatically as an optional dependency.

- [x] **Step 2: Add `check` script to `package.json`**

Added `"check": "astro check"` script and updated `build` to run `bun run check` before `astro build`. Also installed `@astrojs/check` and `typescript` for the type checker.

- [x] **Step 3: Verify type checking passes**

`bun run check` passes with 0 errors, 0 warnings, 0 hints.

- [x] **Step 4: Full build verification**

`bun run build` succeeds.

- [x] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: remove @img/sharp-darwin-arm64, add astro check to build pipeline"
```

---

## Phase 6: SEO — Sitemap & Robots Improvements

Improves sitemap quality and makes robots.txt dynamic. After this phase, sitemap includes `lastmod` and `changefreq`, and robots.txt uses the configured site URL.

### Task 9: Configure sitemap with metadata and fix robots.txt to use Astro.site

**Files:**
- Modify: `astro.config.mjs` — add sitemap config
- Modify: `src/pages/robots.txt.ts` — use `Astro.site` instead of hardcoded URL

- [x] **Step 1: Add sitemap configuration to `astro.config.mjs`**

- [x] **Step 2: Fix robots.txt to use `Astro.site` instead of hardcoded URL**

- [x] **Step 3: Build and verify**

- [x] **Step 4: Commit**

```bash
git add astro.config.mjs src/pages/robots.txt.ts
git commit -m "feat: add sitemap metadata (lastmod, changefreq, priority), fix robots.txt to use Astro.site"
```

---

## Phase 7: Polish — Font Optimization & Accessibility

Reduces font payload by removing unnecessary Montserrat subsets and adds video accessibility improvements.

### Task 10: Remove unused Montserrat font subsets

**Files:**
- Modify: `src/styles/global.css` — update font import to latin + latin-ext only
The Montserrat variable font is imported via `@fontsource-variable/montserrat` in `BaseLayout.astro`. The full import ships all subsets. We need to switch to importing only the required subsets.

In `src/layouts/BaseLayout.astro`, change the Montserrat import. Replace:

```ts
// @ts-ignore
import "@fontsource-variable/montserrat"
```

With:

```ts
import "@fontsource-variable/montserrat/css/latin.css"
import "@fontsource-variable/montserrat/css/latin-ext.css"
```

This imports only the latin and latin-ext subsets, dropping cyrillic, cyrillic-ext, and vietnamese (~78 KB savings).

- [x] **Step 1: Update the Montserrat import in BaseLayout.astro**

Make the change described above.

- [x] **Step 2: Build and verify font subset reduction**

Run: `bun run build`

Then verify that only latin and latin-ext woff2 files are in the output:

Run: `ls dist/_astro/montserrat-*.woff2`

Expected: only `montserrat-latin-*.woff2` and `montserrat-latin-ext-*.woff2` (no cyrillic, cyrillic-ext, or vietnamese).

Also compare total font directory size before and after:

Run: `du -sh dist/_astro/ | awk '{print "Total _astro size:", $1}'`

Expected: significantly smaller than before (was ~320 KB, should be ~240 KB).

- [x] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "perf: import only latin and latin-ext Montserrat subsets, save ~78KB"
```

---

## Phase 8: Final Verification — Full Build & Output Audit

Runs the full build pipeline and validates every output artifact.

### Task 11: Full build verification and output audit

**Files:** None (verification only)

- [x] **Step 1: Clean build from scratch**

Run: `rm -rf dist && bun run build`

- [x] **Step 2: Verify HTML validity — single `<head>`, single `<title>`, no nested heads**

Run: `grep -o '<head' dist/index.html | wc -l && grep -o '<title>' dist/index.html | wc -l`

Expected: `<head` count = 1, `<title>` count = 1.

- [x] **Step 3: Verify meta tags are present**

Run: `grep -c 'name="theme-color"' dist/index.html && grep -c 'name="color-scheme"' dist/index.html && grep -c 'name="robots"' dist/index.html && grep -c 'rel="manifest"' dist/index.html && grep -c 'hreflang' dist/index.html`

Expected: all counts ≥ 1.

- [x] **Step 4: Verify JSON-LD schemas**

Run: `node -e "const html = require('fs').readFileSync('dist/index.html','utf8'); const m = html.match(/<script type=\"application\\/ld\\+json\"[^>]*>(.*?)<\\/script>/s); const d = JSON.parse(m[1]); console.log(d['@graph'].map(g => g['@type']).join(', '));"`

Expected: `Organization, WebSite, LocalBusiness, BreadcrumbList`

- [x] **Step 5: Verify animejs is removed**

Run: `grep -c "animejs" dist/index.html; grep -rc "animejs" dist/_astro/*.js 2>/dev/null | grep -v ':0$' || echo "No animejs references found"`

Expected: 0 references to animejs.

- [x] **Step 6: Verify CSS animations exist**

Run: `grep -c "hero-wrapper-in\|hero-fade-up\|hero-dot-pop\|hero-line-scale" dist/_astro/*.css`

Expected: count ≥ 4 (one per animation name).

- [x] **Step 7: Verify security and cache headers file**

Run: `cat dist/_headers | grep "Cache-Control\|X-Content-Type-Options\|X-Frame-Options\|Referrer-Policy\|Permissions-Policy"`

Expected: all five headers present.

- [x] **Step 8: Verify 404 page**

Run: `ls -la dist/404.html && head -5 dist/404.html`

Expected: file exists and contains HTML.

- [x] **Step 9: Verify sitemap metadata**

Run: `grep -c "lastmod\|changefreq\|priority" dist/sitemap-0.xml`

Expected: count ≥ 3 (one for each field).

- [x] **Step 10: Final commit (no changes needed — all checks green)**

If any adjustments were needed during verification, commit them:

```bash
git add -A
git commit -m "chore: final build verification fixes"
```

---

## Summary of Phases

| Phase | Tasks | Focus | Risk |
|-------|-------|-------|------|
| 1 | 1 | HTML validity fixes (blocking) | Low — template-only |
| 2 | 2-3 | SEO schemas + manifest | Low — additive, no behavior change |
| 3 | 4 | WebGL lifecycle + a11y | Medium — JS changes in shader component |
| 4 | 5 | Replace animejs with CSS | Medium — visual regression risk |
| 5 | 6-8 | Headers, 404, build validation | Low — new files, no existing changes |
| 6 | 9 | Sitemap + robots improvements | Low — config changes |
| 7 | 10 | Font subset pruning | Low — import change only |
| 8 | 11 | Full verification | None — read-only checks |

**Total estimated time:** ~3.5 hours

**Important:** Phases 1-2 should be completed first (blocking + SEO). Phases 3-4 can be done in parallel. Phases 5-7 can be done in any order. Phase 8 is final verification only.