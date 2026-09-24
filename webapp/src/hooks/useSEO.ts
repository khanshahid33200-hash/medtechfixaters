import { useEffect } from 'react'
import seoContent from '../content/seoRoutes.json'

interface SEOOptions {
  title: string
  description?: string
  ogImage?: string
}

const SITE_URL = seoContent.siteUrl
const INDEXABLE = new Set(seoContent.routes.map((r) => r.path))
const CANONICAL_ALIAS: Record<string, string> = Object.fromEntries(
  seoContent.redirects.map((r) => [r.source, r.destination])
)

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Keeps <head> in sync on client-side navigation. The first load of each public
// page already ships the same tags from the static SEO build (seo/build-seo.mjs).
export function useSEO({ title, description, ogImage }: SEOOptions) {
  useEffect(() => {
    // Every spelling of the brand counts, so titles never end up with it twice.
    const formattedTitle = /med\s?tech\s?fixaters/i.test(title) ? title : `${title} | MedTech Fixaters`
    document.title = formattedTitle

    const rawPath = window.location.pathname.replace(/\/+$/, '') || '/'
    const path = CANONICAL_ALIAS[rawPath] || rawPath
    const indexable = INDEXABLE.has(path)
    const url = `${SITE_URL}${path === '/' ? '/' : path}`

    // App screens, patient booking/tracking links and unknown URLs stay out of search results.
    upsertMeta('name', 'robots', indexable ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow')
    upsertCanonical(indexable ? url : null)

    upsertMeta('property', 'og:title', formattedTitle)
    upsertMeta('name', 'twitter:title', formattedTitle)
    upsertMeta('property', 'og:url', url)
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    const image = ogImage || `${SITE_URL}${seoContent.defaultImage}`
    upsertMeta('property', 'og:image', image)
    upsertMeta('name', 'twitter:image', image)
  }, [title, description, ogImage])
}
