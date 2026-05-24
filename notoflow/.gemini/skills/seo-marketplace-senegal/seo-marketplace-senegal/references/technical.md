# SEO Technique — Next.js & Performance Mobile Afrique

## Configuration Next.js pour SEO Optimal

### 1. next.config.js — Configuration de base
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression et optimisation
  compress: true,
  
  // Optimisation images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 768, 1024, 1280],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    domains: ['cdn.ndarmarket.sn'],
  },
  
  // Headers de sécurité et SEO
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Robots-Tag', value: 'index, follow' },
        ],
      },
      {
        // Cache aggressif pour les assets statiques
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  
  // Redirections importantes
  async redirects() {
    return [
      // Forcer www ou non-www (choisir et être cohérent)
      {
        source: '/',
        has: [{ type: 'host', value: 'www.ndarmarket.sn' }],
        destination: 'https://ndarmarket.sn/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. Sitemap XML dynamique — app/sitemap.js (App Router)
```javascript
import { getAllProducts, getAllCategories, getAllVendors } from '@/lib/api'

export default async function sitemap() {
  const baseUrl = 'https://ndarmarket.sn'
  
  const products = await getAllProducts()
  const categories = await getAllCategories()
  const vendors = await getAllVendors()
  
  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/categories`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/vendeurs`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/saint-louis`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  ]
  
  const productPages = products.map(p => ({
    url: `${baseUrl}/produits/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily', // Les prix changent souvent
    priority: 0.8,
  }))
  
  const categoryPages = categories.map(c => ({
    url: `${baseUrl}/${c.slug}/`,
    lastModified: c.updatedAt,
    changeFrequency: 'daily',
    priority: 0.85,
  }))
  
  const vendorPages = vendors.map(v => ({
    url: `${baseUrl}/vendeurs/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
  
  return [...staticPages, ...productPages, ...categoryPages, ...vendorPages]
}
```

### 3. robots.txt — app/robots.js
```javascript
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/compte/',
          '/panier/',
          '/*?sort=',
          '/*?page=',
          '/*?ref=',
        ],
      },
      {
        // Bloquer les bots de scraping agressifs
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://ndarmarket.sn/sitemap.xml',
    host: 'https://ndarmarket.sn',
  }
}
```

### 4. Metadata API Next.js 13+ (App Router)
```javascript
// app/produits/[slug]/page.jsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug)
  
  return {
    title: `Acheter ${product.name} à Saint-Louis | ${product.price} F CFA | ndarmarket`,
    description: `${product.name} disponible chez ${product.vendor.name}, vendeur vérifié à Saint-Louis. Paiement Orange Money, Wave. Livraison rapide au Sénégal.`,
    
    // Open Graph (partage Facebook/WhatsApp — crucial au Sénégal)
    openGraph: {
      title: `${product.name} — ${product.price} F CFA`,
      description: product.shortDescription,
      url: `https://ndarmarket.sn/produits/${product.slug}`,
      siteName: 'ndarmarket',
      images: [
        {
          url: product.images[0].url,
          width: 1200,
          height: 630,
          alt: `${product.name} - Saint-Louis, Sénégal`,
        },
      ],
      locale: 'fr_SN',
      type: 'website',
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ndarmarket`,
      description: product.shortDescription,
      images: [product.images[0].url],
    },
    
    // Canonical automatique
    alternates: {
      canonical: `https://ndarmarket.sn/produits/${product.slug}`,
    },
    
    // Robots
    robots: {
      index: product.isActive && product.stock > 0,
      follow: true,
      googleBot: {
        index: product.isActive,
        follow: true,
      },
    },
  }
}
```

---

## Core Web Vitals — Objectifs pour Réseau Mobile Sénégal

### Cibles (simuler un réseau 3G lent — Moto G4)
| Métrique | Seuil Bon | Objectif ndarmarket |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | < 3.5s (3G) |
| FID / INP (Interaction to Next Paint) | < 200ms | < 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.05 |
| TTFB (Time to First Byte) | < 800ms | < 1s |
| FCP (First Contentful Paint) | < 1.8s | < 2.5s |

### Optimisations critiques pour l'Afrique

#### Images
```jsx
import Image from 'next/image'

// Hero image — priorité haute
<Image
  src="/hero-saint-louis-marketplace.webp"
  alt="Marketplace ndarmarket Saint-Louis Sénégal"
  width={1200}
  height={600}
  priority={true}          // Préchargement LCP
  quality={75}             // Bon équilibre qualité/poids
  placeholder="blur"       // Évite le CLS
  blurDataURL="data:..."   // Placeholder base64 tiny
/>

// Images produit — lazy loading
<Image
  src={product.image}
  alt={`${product.name} - ${product.vendor.city}, Sénégal`}
  width={400}
  height={400}
  loading="lazy"
  sizes="(max-width: 768px) 50vw, 25vw"
/>
```

#### Fonts — Éviter le FOUT/FOIT
```jsx
// app/layout.jsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',        // Évite le texte invisible
  preload: true,
  variable: '--font-inter',
})
```

#### Prefetch des pages critiques
```jsx
import Link from 'next/link'

// Prefetch automatique sur hover
<Link href="/produits/samsung-galaxy-a54" prefetch={true}>
  Voir le produit
</Link>
```

---

## SEO Technique Spécifique Marketplace

### Gestion des pages sans stock (noindex dynamique)
```javascript
// app/produits/[slug]/page.jsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug)
  
  return {
    robots: {
      // Noindex si produit épuisé depuis > 30 jours
      index: product.isActive && (product.stock > 0 || product.daysSinceEmpty < 30),
    }
  }
}
```

### Hreflang (si version multilingue FR/Wolof/EN)
```javascript
alternates: {
  canonical: 'https://ndarmarket.sn/produits/samsung-galaxy-a54',
  languages: {
    'fr-SN': 'https://ndarmarket.sn/produits/samsung-galaxy-a54',
    'wo-SN': 'https://ndarmarket.sn/wo/jaay-jënd/samsung-galaxy-a54',
  },
},
```

### Pagination SEO (catégories avec beaucoup de produits)
```javascript
// Page 1: canonical elle-même, rel="next"
// Pages 2+: canonical vers page 1, rel="prev/next"
export async function generateMetadata({ params, searchParams }) {
  const page = parseInt(searchParams.page) || 1
  
  return {
    alternates: {
      canonical: page === 1 
        ? `https://ndarmarket.sn/electronique/telephones/`
        : `https://ndarmarket.sn/electronique/telephones/`, // Toujours vers page 1
    },
    robots: page > 1 ? { index: false } : { index: true },
  }
}
```

---

## Monitoring Technique

### Google Search Console — Actions prioritaires
1. Soumettre sitemap.xml dès le lancement
2. Vérifier les erreurs 404 et les corriger (301 redirect)
3. Surveiller les Core Web Vitals dans le rapport "Expérience"
4. Contrôler l'indexation via l'outil d'inspection d'URL
5. Surveiller les requêtes pour détecter les nouvelles opportunités

### Script de vérification SEO technique (bash)
```bash
# Vérifier que le sitemap est accessible
curl -I https://ndarmarket.sn/sitemap.xml

# Vérifier robots.txt
curl https://ndarmarket.sn/robots.txt

# Vérifier les redirections www
curl -I http://www.ndarmarket.sn

# Tester la vitesse via PageSpeed Insights API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://ndarmarket.sn&strategy=mobile&key=YOUR_KEY"
```
