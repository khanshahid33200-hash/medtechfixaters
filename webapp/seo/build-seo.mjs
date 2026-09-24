// Post-build SEO / GEO step (runs after `vite build`).
//
// The app is a client-rendered SPA, so crawlers that do not execute JavaScript
// (most AI answer-engine crawlers, social link previews) would otherwise see an
// empty <div id="root">. For every public marketing route this writes
// dist/<route>/index.html with that route's own <head> (title, description,
// canonical, Open Graph, JSON-LD) and a readable HTML snapshot of the page's key
// content inside #root, which React replaces on load. Vercel serves these files
// before the SPA rewrite. It also generates sitemap.xml, robots.txt, llms.txt and
// llms-full.txt from the same route data (src/content/seoRoutes.json).

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'dist')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))

const site = read('src/content/seoRoutes.json')
const faqSets = {
  landing: read('src/content/landingFaqs.json'),
  contact: read('src/content/contactFaqs.json'),
}
const today = new Date().toISOString().slice(0, 10)
const abs = (p) => site.siteUrl + (p === '/' ? '/' : p)

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// JSON-LD inside <script>: escape "<" so content can never close the tag.
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

const organization = {
  '@type': 'Organization',
  '@id': `${site.siteUrl}/#organization`,
  name: site.siteName,
  alternateName: site.alternateName,
  url: `${site.siteUrl}/`,
  logo: `${site.siteUrl}/logo.png`,
  email: site.email,
  telephone: site.telephone,
  description: site.summary,
  areaServed: { '@type': 'Country', name: 'India' },
  sameAs: [site.linkedin],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: site.email,
    telephone: site.telephone,
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
}

const website = {
  '@type': 'WebSite',
  '@id': `${site.siteUrl}/#website`,
  url: `${site.siteUrl}/`,
  name: site.siteName,
  alternateName: site.alternateName,
  inLanguage: 'en-IN',
  publisher: { '@id': `${site.siteUrl}/#organization` },
}

const pricingRoute = site.routes.find((r) => r.pricing)
const software = {
  '@type': 'SoftwareApplication',
  '@id': `${site.siteUrl}/#software`,
  name: site.siteName,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Hospital & clinic management (OPD, EMR, queue, CRM)',
  operatingSystem: 'Web browser',
  url: `${site.siteUrl}/`,
  description: site.summary,
  publisher: { '@id': `${site.siteUrl}/#organization` },
  offers: pricingRoute.pricing.map((p) => ({
    '@type': 'Offer',
    name: p.name,
    description: p.desc,
    price: p.priceMonthly,
    priceCurrency: 'INR',
    url: abs('/pricing'),
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: p.priceMonthly,
      priceCurrency: 'INR',
      unitText: 'MONTH',
    },
  })),
}

function jsonLdFor(route) {
  const graph = [organization, website]
  const page = {
    '@type': route.faqs ? ['WebPage', 'FAQPage'] : 'WebPage',
    '@id': `${abs(route.path)}#webpage`,
    url: abs(route.path),
    name: route.title,
    description: route.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${site.siteUrl}/#website` },
    about: { '@id': `${site.siteUrl}/#software` },
    dateModified: today,
  }
  if (route.faqs) {
    page.mainEntity = faqSets[route.faqs].map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }))
  }
  graph.push(page)
  if (route.path === '/' || route.pricing) graph.push(software)
  if (route.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: label(route), item: abs(route.path) },
      ],
    })
  }
  return ld({ '@context': 'https://schema.org', '@graph': graph })
}

function headFor(route) {
  const url = abs(route.path)
  const image = site.siteUrl + site.defaultImage
  return [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en-IN" href="${url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.siteName)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${esc(site.siteName)} — connected hospital platform" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    jsonLdFor(route),
  ].join('\n    ')
}

const LABELS = {
  '/': 'Home', '/how-it-works': 'How it works', '/features': 'Features', '/pricing': 'Pricing',
  '/about': 'About', '/architecture': 'Architecture', '/features/upcoming': 'Roadmap', '/contact': 'Contact',
  '/privacy': 'Privacy policy', '/terms': 'Terms of service', '/refund-policy': 'Refund policy',
}
const label = (r) => LABELS[r.path] || r.h1.replace(/\.$/, '')
const navLinks = site.routes.map((r) => `<a href="${r.path}">${esc(label(r))}</a>`).join(' · ')

function snapshotFor(route) {
  const parts = [`<h1>${esc(route.h1)}</h1>`, `<p>${esc(route.description)}</p>`]
  if (route.lead) parts.push(`<p>${esc(route.lead)}</p>`)
  if (route.path === '/') parts.push(`<p>${esc(site.summary)}</p>`)
  if (route.sections?.length) {
    parts.push(`<ul>${route.sections.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`)
  }
  if (route.pricing) {
    for (const p of route.pricing) {
      parts.push(
        `<section><h2>${esc(p.name)} — ${esc(p.tag)}</h2><p>₹${p.priceMonthly.toLocaleString('en-IN')} per month, or ₹${p.priceAnnual.toLocaleString('en-IN')} per month billed annually. ${esc(p.desc)}</p><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>`
      )
    }
  }
  if (route.faqs) {
    parts.push('<section><h2>Frequently asked questions</h2>')
    for (const f of faqSets[route.faqs]) parts.push(`<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`)
    parts.push('</section>')
  }
  parts.push(
    `<nav aria-label="Site">${navLinks}</nav>`,
    `<p>Contact: <a href="mailto:${site.email}">${site.email}</a> · <a href="tel:${site.telephone.replace(/-/g, '')}">${site.telephone.replace(/-/g, ' ').replace('+91 ', '+91 ')}</a></p>`
  )
  return `<main id="seo-snapshot" style="max-width:860px;margin:0 auto;padding:48px 20px;font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6">\n      ${parts.join('\n      ')}\n    </main>`
}

// ---------- build ----------
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const stripHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(name|property)="(description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
const base = stripHead(template)
if (!base.includes('<div id="root"></div>')) throw new Error('build-seo: #root not found in dist/index.html')

// Generic shell for every non-prerendered URL (app screens, unknown paths): noindex.
fs.writeFileSync(
  path.join(dist, 'spa.html'),
  base.replace('</head>', `  <title>${esc(site.siteName)}</title>\n    <meta name="robots" content="noindex, follow" />\n  </head>`)
)

for (const route of site.routes) {
  const html = base
    .replace('</head>', `  ${headFor(route)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">\n    ${snapshotFor(route)}\n    </div>`)
  const out = route.path === '/' ? path.join(dist, 'index.html') : path.join(dist, route.path.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
}

// sitemap.xml
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${site.routes
    .map(
      (r) =>
        `  <url>\n    <loc>${abs(r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`
)

// robots.txt — one group for every crawler (including AI answer engines such as
// GPTBot, ClaudeBot, PerplexityBot, Google-Extended): public pages open, app screens closed.
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `# ${site.siteName} — public marketing pages are open to all crawlers, including AI answer engines.
User-agent: *
Allow: /
Disallow: /login
Disallow: /signup
Disallow: /doctor
Disallow: /dashboard
Disallow: /doctordashboard
Disallow: /hospitaldashboard
Disallow: /hospitaladmin
Disallow: /mrshahidbabu
Disallow: /MRSHAHIDBABU
Disallow: /appointments
Disallow: /queue
Disallow: /reports
Disallow: /history
Disallow: /medicines
Disallow: /settings
Disallow: /payments
Disallow: /checkin
Disallow: /qr-kiosk
Disallow: /rx
Disallow: /track
Disallow: /a/
Disallow: /book/
Disallow: /intake/
Disallow: /appointment/
Disallow: /display/
Disallow: /account-blocked
Disallow: /thank-you

Sitemap: ${site.siteUrl}/sitemap.xml
`
)

// llms.txt (https://llmstxt.org) — concise guide for AI assistants.
const pageLine = (r) => `- [${label(r)}](${abs(r.path)}): ${r.description}`
const main = site.routes.filter((r) => !['/privacy', '/terms', '/refund-policy'].includes(r.path))
const legal = site.routes.filter((r) => ['/privacy', '/terms', '/refund-policy'].includes(r.path))
fs.writeFileSync(
  path.join(dist, 'llms.txt'),
  `# ${site.siteName}

> ${site.summary}

Key facts:
- Product: web-based OPD and hospital operations platform (no installation required).
- Users: solo doctors, polyclinics, nursing homes and multi-specialty hospitals in India.
- Patients book by scanning a hospital-specific QR code and track their live queue token online.
- Doctors each get a private workspace; hospital administrators manage doctors, departments, queues and reports.
- AI assists with symptom intake, department routing and note formatting; it does not replace clinical judgement.
- Pricing (INR per month): ${pricingRoute.pricing.map((p) => `${p.name} ₹${p.priceMonthly} (₹${p.priceAnnual} billed annually)`).join('; ')}.
- Contact: ${site.email}, ${site.telephone}

## Pages
${main.map(pageLine).join('\n')}

## Optional
- [Full content for AI assistants](${site.siteUrl}/llms-full.txt): pricing details and complete FAQ
${legal.map(pageLine).join('\n')}
`
)

// llms-full.txt — the same facts plus complete pricing and FAQ text.
const faqText = (set) => faqSets[set].map((f) => `### ${f.question}\n${f.answer}`).join('\n\n')
fs.writeFileSync(
  path.join(dist, 'llms-full.txt'),
  `# ${site.siteName} — full reference

> ${site.summary}

Website: ${site.siteUrl}/
Contact: ${site.email} · ${site.telephone}

## Pricing (INR)
${pricingRoute.pricing
  .map(
    (p) =>
      `### ${p.name} — ${p.tag}\n₹${p.priceMonthly} per month, or ₹${p.priceAnnual} per month billed annually. ${p.desc}\n${p.features.map((f) => `- ${f}`).join('\n')}`
  )
  .join('\n\n')}

## Frequently asked questions
${faqText('landing')}

## Implementation and contact questions
${faqText('contact')}
`
)

console.log(`build-seo: ${site.routes.length} prerendered routes, spa.html, sitemap.xml, robots.txt, llms.txt, llms-full.txt`)
