import type { APIRoute } from 'astro'

const siteUrl = 'https://devgo.studio'

export const GET: APIRoute = () => {
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
# Allow all crawlers
User-agent: *
Allow: /

# AI Crawlers (for AI governance)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: FacebookBot
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap-index.xml

# Disallow admin/private areas for all crawlers
User-agent: *
Disallow: /_astro/
`

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
