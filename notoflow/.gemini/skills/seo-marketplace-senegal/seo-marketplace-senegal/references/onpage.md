# SEO On-Page — Fiches Produits, Vendeurs & Catégories

## Templates Optimisés pour ndarmarket

---

## 1. Fiche Produit

### Structure HTML / Next.js recommandée
```html
<!-- Titre H1 unique et optimisé -->
<h1>[Nom Produit] - [Marque] à Saint-Louis | ndarmarket</h1>

<!-- Fil d'Ariane -->
<nav aria-label="breadcrumb">
  Accueil > Électronique > Téléphones > Samsung Galaxy A54
</nav>

<!-- Images optimisées -->
<img 
  src="/produits/samsung-galaxy-a54-saint-louis.webp"
  alt="Samsung Galaxy A54 noir - disponible à Saint-Louis, Sénégal"
  width="800" height="800"
  loading="lazy"
/>

<!-- Description produit (min 300 mots, unique) -->
<div class="product-description">
  <!-- Paragraphe 1: Présentation produit avec mot-clé principal -->
  <!-- Paragraphe 2: Caractéristiques techniques -->
  <!-- Paragraphe 3: Pourquoi acheter chez ce vendeur à Saint-Louis -->
  <!-- Paragraphe 4: Livraison, paiement (Orange Money, Wave) -->
</div>
```

### Template Méta (à adapter par catégorie)
```
Méta Title (55-60 car.):
"Acheter [Produit] à Saint-Louis | [Prix] | ndarmarket"
Ex: "Acheter Samsung Galaxy A54 à Saint-Louis | 180 000 F CFA | ndarmarket"

Méta Description (150-160 car.):
"Trouvez [Produit] [Marque] à [Prix] chez [Vendeur], vendeur vérifié à Saint-Louis. 
Livraison rapide, paiement Orange Money ou Wave. ✓ [X] avis clients."
```

### Schema.org Product (JSON-LD — à injecter dans <head>)
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Samsung Galaxy A54 128Go Noir",
  "description": "Smartphone Samsung Galaxy A54 disponible à Saint-Louis, Sénégal...",
  "image": [
    "https://ndarmarket.sn/produits/samsung-a54-face.webp",
    "https://ndarmarket.sn/produits/samsung-a54-dos.webp"
  ],
  "sku": "SAM-A54-128-BLK",
  "brand": {
    "@type": "Brand",
    "name": "Samsung"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://ndarmarket.sn/produits/samsung-galaxy-a54-saint-louis",
    "priceCurrency": "XOF",
    "price": "180000",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Boutique Ndiar Telecoms"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "SN"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "23"
  }
}
```

---

## 2. Page Vendeur

### Structure recommandée
```
URL: /vendeurs/[slug-vendeur-saint-louis]/
Ex: /vendeurs/boutique-ndiar-telecoms-saint-louis/

H1: Boutique Ndiar Telecoms — Vendeur Vérifié à Saint-Louis | ndarmarket
H2: Nos produits (liste des fiches)
H2: Avis clients (schema.org Review)
H2: Informations boutique (adresse, horaires, contact WhatsApp)
```

### Schema.org LocalBusiness pour page vendeur
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Boutique Ndiar Telecoms",
  "image": "https://ndarmarket.sn/vendeurs/ndiar-telecoms-logo.webp",
  "url": "https://ndarmarket.sn/vendeurs/boutique-ndiar-telecoms-saint-louis",
  "telephone": "+221-77-XXX-XX-XX",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rue X, Quartier Y",
    "addressLocality": "Saint-Louis",
    "addressRegion": "Saint-Louis",
    "postalCode": "46000",
    "addressCountry": "SN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 16.0179,
    "longitude": -16.4896
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      "opens": "08:00",
      "closes": "20:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "89"
  },
  "priceRange": "$$",
  "paymentAccepted": "Cash, Orange Money, Wave"
}
```

---

## 3. Page Catégorie

### Structure SEO d'une page catégorie
```
URL: /electronique/telephones/
H1: Téléphones & Smartphones à Saint-Louis — ndarmarket
Meta title: "Téléphones pas cher à Saint-Louis | ndarmarket"
Meta desc: "Découvrez [X] téléphones disponibles à Saint-Louis chez nos vendeurs vérifiés. Paiement Orange Money, Wave. Livraison rapide partout au Sénégal."

Contenu de la page catégorie (souvent négligé mais crucial):
- Bloc intro: 150-200 mots avec mots-clés principaux naturellement intégrés
- Filtres: marque, prix, vendeur, quartier Saint-Louis → URLs paramétriques (gérer canonical!)
- FAQ: 3-5 questions (schema FAQPage) sur la catégorie
- Texte de bas de page: 100-150 mots décrivant l'offre locale
```

### FAQ Schema pour pages catégories (exemple Téléphones)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment acheter un téléphone à Saint-Louis en ligne ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sur ndarmarket, parcourez notre sélection de téléphones proposés par des vendeurs vérifiés de Saint-Louis. Ajoutez au panier, payez par Orange Money ou Wave, et recevez votre commande sous 24h."
      }
    },
    {
      "@type": "Question",
      "name": "Peut-on payer en Orange Money sur ndarmarket ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui, ndarmarket accepte Orange Money, Wave, et le paiement à la livraison pour toutes les commandes à Saint-Louis et dans la région."
      }
    }
  ]
}
```

---

## 4. Homepage

### Structure SEO Homepage
```
Title: "ndarmarket — Marketplace N°1 à Saint-Louis, Sénégal"
Meta desc: "Achetez et vendez en ligne à Saint-Louis. Électronique, mode, artisanat, alimentation. Paiement Orange Money & Wave. Vendeurs locaux vérifiés."

Sections à inclure (ordre SEO):
1. Hero: Tagline + CTA acheteur + CTA vendeur
2. Catégories populaires (liens internes fort)
3. Vendeurs mis en avant (schema LocalBusiness)
4. Produits tendance Saint-Louis
5. Pourquoi ndarmarket (E-E-A-T signaux de confiance)
6. Témoignages clients (schema Review)
7. Zone de couverture (carte interactive Saint-Louis)
8. Blog / Actualités (liens vers articles)
```

### Schema.org WebSite avec SearchAction (Sitelinks Search Box)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ndarmarket",
  "url": "https://ndarmarket.sn",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://ndarmarket.sn/recherche?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## 5. Règles de Contenu pour Descriptions Produits

### Ce qu'il faut faire ✅
- Écrire des descriptions uniques (pas copier-coller du fournisseur)
- Minimum 300 mots pour les produits phares
- Intégrer naturellement : nom produit, marque, localisation (Saint-Louis/Sénégal), prix indicatif
- Mentionner les modes de paiement acceptés (Orange Money, Wave, cash)
- Intégrer les avis vendeur et certifications
- Ajouter un CTA WhatsApp ou bouton contact vendeur

### Ce qu'il faut éviter ❌
- Contenu dupliqué entre produits similaires
- Descriptions trop courtes < 100 mots
- Keyword stuffing (répétition forcée de mots-clés)
- URLs avec paramètres non canonicalisés (?sort=price, ?page=2)
- Texte sur image (illisible par Google)
- Liens brisés vers des produits/vendeurs supprimés

---

## 6. Gestion des URLs Canoniques (Crucial pour Marketplace)

```javascript
// Next.js — pages/produits/[slug].jsx
import Head from 'next/head'

export default function ProductPage({ product }) {
  return (
    <>
      <Head>
        <link 
          rel="canonical" 
          href={`https://ndarmarket.sn/produits/${product.slug}`} 
        />
        {/* Gérer les variantes de produit */}
        {product.variants && (
          <link 
            rel="canonical" 
            href={`https://ndarmarket.sn/produits/${product.parentSlug}`} 
          />
        )}
      </Head>
    </>
  )
}
```

### Règles canoniques pour les filtres de catégories
```
/electronique/telephones/?marque=samsung → canonical vers /electronique/telephones/
/electronique/telephones/?prix=50000-100000 → canonical vers /electronique/telephones/
/electronique/telephones/?page=2 → canonical vers /electronique/telephones/
Exception: pages de marque importantes → leur propre canonical si contenu unique
```
