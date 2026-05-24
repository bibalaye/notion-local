---
name: seo-marketplace-senegal
description: >
  Skill SEO et référencement complet pour une plateforme marketplace multi-produits et multi-vendeurs
  ciblant le Sénégal, en particulier la zone de Saint-Louis (NdarMarket/NdarMarket).
  Utilise ce skill pour toute demande liée au référencement naturel, à l'optimisation des pages
  produits et vendeurs, à la stratégie de contenu locale, aux balises méta, au SEO technique,
  aux mots-clés en wolof/français/anglais, au référencement Google Maps / local, à la vitesse
  de chargement pour les réseaux mobiles africains, et à toute stratégie d'acquisition de trafic
  organique pour un e-commerce ou marketplace en Afrique de l'Ouest. Déclenche ce skill dès que
  l'utilisateur mentionne "SEO", "référencement", "trafic organique", "Google", "mots-clés",
  "optimisation", "visibilité", "fiche produit", "marketplace", "Saint-Louis", "Sénégal",
  "NdarMarket" ou "NdarMarket", même sans demande explicite d'audit complet.
---

# SEO & Référencement — Marketplace Multi-vendeurs Sénégal (NdarMarket)

## Contexte du Projet

- **Projet** : NdarMarket / NdarMarket — marketplace multi-produits, multi-vendeurs
- **Zone cible primaire** : Saint-Louis, Sénégal
- **Zone cible secondaire** : Sénégal national, diaspora sénégalaise francophone
- **Stack technique** : Next.js / React / Django (API) / PostgreSQL
- **Public** : Vendeurs locaux (artisans, boutiques, PME) + acheteurs particuliers et B2B
- **Langues** : Français (principal), Wolof (secondaire), Anglais (tertiaire)

---

## Structure de ce Skill

| Besoin | Fichier de référence |
|---|---|
| Stratégie mots-clés & recherche sémantique | `references/keywords.md` |
| SEO On-Page (fiches produits, vendeurs, catégories) | `references/onpage.md` |
| SEO Technique (Next.js, Core Web Vitals, mobile) | `references/technical.md` |
| SEO Local (Google My Business, Saint-Louis) | `references/local.md` |
| Stratégie de contenu & blog | `references/content.md` |
| Netlinking & autorité de domaine | `references/offpage.md` |
| Métriques & suivi de performance | `references/analytics.md` |

Lis le fichier de référence correspondant à la demande avant de répondre.

---

## Workflow Standard

### 1. Identifier le type de demande SEO

```
A) Audit SEO global → lire onpage.md + technical.md + local.md
B) Optimisation fiche produit/vendeur → lire onpage.md + keywords.md
C) Stratégie mots-clés → lire keywords.md
D) SEO technique (vitesse, crawl, schema.org) → lire technical.md
E) SEO local Saint-Louis → lire local.md
F) Blog / contenu → lire content.md
G) Backlinks → lire offpage.md
H) Analytics / suivi → lire analytics.md
```

### 2. Adapter au contexte local sénégalais

**Toujours tenir compte de :**
- Connexions mobiles majoritairement 3G/4G → priorité performance
- Wolof comme langue du commerce local (intégrer termes wolof dans strategy)
- Google.sn comme moteur principal + Facebook Search
- WhatsApp comme canal de conversion majeur (ajouter CTAs WhatsApp)
- Recherches vocales en wolof et français mélangés
- Manque de contenu de qualité en français sur l'Afrique de l'Ouest = opportunité SEO forte

### 3. Produire les livrables

Selon la demande, produire :
- ✅ Liste de mots-clés priorisés (volume estimé + intention + langue)
- ✅ Template de fiche produit optimisée (titre H1, méta, description, schema.org)
- ✅ Checklist SEO technique pour Next.js
- ✅ Plan de contenu éditorial (thèmes + fréquence + mots-clés cibles)
- ✅ Audit SEO local (Google My Business, NAP, avis)
- ✅ Rapport de performance (KPIs, outils, fréquence)

---

## Principes Fondamentaux SEO NdarMarket

### Pilier 1 — Structuration des URLs

```
# Catégories
/[categorie]/                          → /electronique/
/[categorie]/[sous-categorie]/         → /electronique/telephones/

# Produits
/produits/[slug-produit]/              → /produits/samsung-galaxy-a54-saint-louis/

# Vendeurs
/vendeurs/[slug-vendeur]/              → /vendeurs/boutique-ndiar-telecoms/

# Localisation (SEO local fort)
/saint-louis/[categorie]/              → /saint-louis/electronique/
/dakar/[categorie]/                    → /dakar/artisanat/
```

### Pilier 2 — Schema.org pour Marketplace

Implémenter en priorité :
- `Product` (avec `offers`, `seller`, `aggregateRating`)
- `LocalBusiness` (pour chaque vendeur)
- `BreadcrumbList`
- `WebSite` avec `SearchAction` (Sitelinks Search Box)
- `FAQPage` sur les pages catégories
- `Organization` sur la homepage

### Pilier 3 — Signaux E-E-A-T locaux

- Profils vendeurs vérifiés (badge, adresse physique, NINEA si disponible)
- Avis clients authentiques (date, localisation)
- Présence physique Saint-Louis mentionnée explicitement
- Contenu produit en français correct + termes locaux
- Mise à jour régulière des prix et stocks (fraîcheur du contenu)

### Pilier 4 — Mobile-First pour l'Afrique

- LCP < 2.5s sur réseau 3G simulé
- Images en WebP / AVIF avec lazy loading
- PWA avec mode offline pour navigation catalogue
- AMP optionnel pour pages produits critiques
- CLS < 0.1 (stabilité de mise en page)

---

## Mots-clés Seeds (Saint-Louis & Sénégal)

### Intention Transactionnelle (forte priorité)
```
acheter [produit] Saint-Louis
[produit] pas cher Sénégal
livraison Saint-Louis [produit]
boutique en ligne Saint-Louis
marketplace Sénégal
vendre en ligne Sénégal
```

### Intention Locale
```
[produit] Saint-Louis
commerce Saint-Louis Sénégal
marché en ligne nord Sénégal
vendeurs Saint-Louis
artisanat Saint-Louis
```

### Termes Wolof à intégrer (longue traîne)
```
Marché bi (le marché)
Jënd [produit] (acheter [produit])
Dakar / Ndar (Saint-Louis en wolof)
Xaalis (argent / paiement)
```

---

## Checklist Rapide SEO On-Page (Fiche Produit)

- [ ] Titre H1 : `[Produit] - [Marque] | [Ville] | NdarMarket`
- [ ] Méta title (55-60 car.) : `Acheter [Produit] à Saint-Louis | NdarMarket`
- [ ] Méta description (150-160 car.) avec CTA et prix si possible
- [ ] URL courte et descriptive en français (sans accents)
- [ ] Images : alt text descriptif (`samsung-galaxy-saint-louis.webp`)
- [ ] Description produit > 300 mots, unique, termes locaux
- [ ] Prix et disponibilité visibles (bénéfice schema.org)
- [ ] Fil d'Ariane structuré
- [ ] Section avis clients avec date
- [ ] Lien interne vers vendeur + catégorie
- [ ] Schema.org `Product` complet

---

## Outils Recommandés

| Outil | Usage | Coût |
|---|---|---|
| Google Search Console | Suivi positions, crawl | Gratuit |
| Google Analytics 4 | Trafic, conversions | Gratuit |
| Google My Business | SEO local | Gratuit |
| Ahrefs / Semrush | Recherche mots-clés | Payant |
| Ubersuggest | Alternative gratuite | Freemium |
| PageSpeed Insights | Performance mobile | Gratuit |
| Screaming Frog | Audit technique | Freemium (500 URLs) |
| Answer The Public | Questions longue traîne | Freemium |
| Rank Math / Yoast | Si CMS WordPress | Freemium |

---

## Instructions pour Claude

1. **Toujours contextualiser** les recommandations SEO pour le marché sénégalais et la ville de Saint-Louis
2. **Proposer des exemples concrets** : titres, méta descriptions, slugs, schema.org JSON-LD prêts à copier-coller
3. **Prioriser le mobile** dans toutes les recommandations techniques
4. **Mentionner WhatsApp** comme canal de conversion complémentaire au SEO
5. **Distinguer** les actions quick wins (impact rapide) vs long terme
6. **Fournir des templates réutilisables** pour les vendeurs (non-techniques)
7. **Intégrer la dimension multilingue** (FR/Wolof) dans la stratégie de contenu
8. Lire le fichier de référence approprié avant chaque réponse détaillée
