# Stratégie de Contenu & Analytics — NdarMarket

## Plan de Contenu Éditorial

### Piliers de contenu pour un marketplace sénégalais

**Pilier 1 — Guides d'achat** (intention commerciale)
```
Format: "Meilleur [produit] pas cher à Saint-Louis en [année]"
Exemples:
- "Meilleurs smartphones pas chers à Saint-Louis en 2024"
- "Top 5 vendeurs d'électronique fiables à Saint-Louis"
- "Guide complet pour acheter un climatiseur au Sénégal"
Fréquence: 2/mois | Longueur cible: 1200-2000 mots
```

**Pilier 2 — Guides vendeurs** (attirer les marchands)
```
Format: "Comment vendre [catégorie] en ligne à Saint-Louis"
Exemples:
- "Comment vendre votre artisanat en ligne depuis Saint-Louis"
- "Guide complet pour créer sa boutique sur NdarMarket"
- "Paiement mobile pour vendeurs : Orange Money, Wave au Sénégal"
Fréquence: 1/mois | Longueur cible: 1500-2500 mots
```

**Pilier 3 — Actualités locales** (trafic et autorité)
```
Format: News + analyse locale
Exemples:
- "Le commerce en ligne explose à Saint-Louis : chiffres 2024"
- "Les artisans de Saint-Louis se tournent vers le digital"
- "Interview : rencontre avec [vendeur phare] d'NdarMarket"
Fréquence: 1/semaine | Longueur cible: 600-900 mots
```

**Pilier 4 — Contenu pratique** (SEO longue durée)
```
Format: How-to, FAQ, tutoriels
Exemples:
- "Comment payer en Orange Money sur un site e-commerce"
- "Livraison à Saint-Louis : tout savoir sur les délais et tarifs"
- "Comment vérifier si un vendeur est fiable en ligne au Sénégal"
Fréquence: 2/mois | Longueur cible: 800-1500 mots
```

---

## Calendrier Éditorial — 3 premiers mois

### Mois 1 — Fondations
| Semaine | Article | Mots-clés cibles |
|---|---|---|
| S1 | Guide complet achat en ligne Saint-Louis | acheter en ligne saint-louis sénégal |
| S2 | Comment vendre sur NdarMarket (guide vendeur) | vendre en ligne sénégal |
| S3 | Top téléphones pas cher Saint-Louis 2024 | téléphone pas cher saint-louis |
| S4 | Paiement Orange Money : guide complet | orange money paiement en ligne sénégal |

### Mois 2 — Croissance
| Semaine | Article | Mots-clés cibles |
|---|---|---|
| S5 | Artisanat de Saint-Louis à acheter en ligne | artisanat saint-louis sénégal |
| S6 | Interview vendeur phare NdarMarket | marketplace sénégal témoignage |
| S7 | Guide produits alimentaires locaux en ligne | épices sénégalaises acheter |
| S8 | Livraison Sénégal : tout savoir | livraison express saint-louis |

### Mois 3 — Autorité
| Semaine | Article | Mots-clés cibles |
|---|---|---|
| S9 | Commerce électronique au Sénégal : état des lieux | e-commerce sénégal 2024 |
| S10 | Mode africaine : les créateurs de Saint-Louis | mode africaine en ligne sénégal |
| S11 | Guide cadeaux pour la diaspora sénégalaise | envoyer cadeau sénégal |
| S12 | Bilan 3 mois + rapport commerce local | news commerce saint-louis |

---

## Structure d'un Article Optimisé

```markdown
# [Titre H1 avec mot-clé principal] — NdarMarket

**Temps de lecture : X min** | Mis à jour le [date]

[Introduction 150 mots — inclure mot-clé dans la 1ère phrase + contexte local St-Louis]

## [H2 — Section principale 1]
[300-400 mots avec mots-clés secondaires]

### [H3 — Sous-section]

## [H2 — Section principale 2]

## [H2 — FAQ : Questions fréquentes]
**Q: [Question longue traîne ?]**
R: [Réponse 100-150 mots]

**Q: [Question locale ?]**
R: [Réponse avec mention Saint-Louis]

## Conclusion
[100-150 mots + CTA vers marketplace]

---
*Cet article vous a été utile ? Découvrez nos [catégorie] sur NdarMarket.*
[Bouton CTA → /saint-louis/[categorie]/]
```

---

## Analytics & Métriques SEO

### Configuration Google Analytics 4

```javascript
// lib/gtag.js
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'

export const trackEvent = (action, category, label, value) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Événements e-commerce à tracker
export const trackPurchase = (order) => {
  window.gtag('event', 'purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'XOF',
    items: order.items.map(item => ({
      item_id: item.sku,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    }))
  })
}

// Tracker les clics WhatsApp (conversion importante au Sénégal)
export const trackWhatsAppClick = (vendorName, productName) => {
  window.gtag('event', 'whatsapp_click', {
    event_category: 'Contact',
    event_label: `${vendorName} - ${productName}`,
  })
}
```

### KPIs SEO à suivre mensuellement

| Métrique | Outil | Objectif M3 | Objectif M6 | Objectif M12 |
|---|---|---|---|---|
| Trafic organique | GA4 | +30% | +100% | +300% |
| Positions Top 10 | GSC | 20 mots-clés | 60 mots-clés | 150 mots-clés |
| CTR moyen | GSC | 3% | 4% | 5% |
| Avis Google | GMB | 30 avis | 80 avis | 200 avis |
| Backlinks | Ahrefs/GSC | 15 domaines | 40 domaines | 100 domaines |
| LCP mobile | PSI | < 3.5s | < 3s | < 2.5s |
| Pages indexées | GSC | 200 | 500 | 2000+ |

### Tableau de bord hebdomadaire (30 min/semaine)

```
Lundi matin — Revue SEO hebdomadaire :
1. GSC → Clics et impressions vs semaine précédente
2. GA4 → Sessions organiques + taux de conversion
3. GSC → Nouvelles erreurs d'exploration ?
4. GMB → Nouveaux avis à répondre ?
5. PSI → LCP homepage mobile ?
```

### Rapport mensuel — Template

```markdown
## Rapport SEO NdarMarket — [Mois Année]

### Résumé Exécutif
- Sessions organiques : [N] (+X% vs mois précédent)
- Trafic local Saint-Louis : [N] sessions
- Mots-clés Top 3 : [liste]
- Conversions depuis organique : [N]

### Mots-clés en progression
| Mot-clé | Position M-1 | Position M | Trend |
|---|---|---|---|
| acheter en ligne saint-louis | 15 | 8 | ↑ |

### Mots-clés à travailler
[Mots-clés position 11-20 = opportunité]

### Actions pour le mois prochain
1. [Action prioritaire 1]
2. [Action prioritaire 2]
3. [Action prioritaire 3]
```

---

## Netlinking (Backlinks) — Stratégie Off-Page

### Sources de backlinks qualifiés pour un marketplace sénégalais

**Priorité 1 — Partenaires locaux**
- Mairie de Saint-Louis (partenariat e-commerce local)
- Chambre de Commerce de Saint-Louis
- Université Gaston Berger (UGB) — page ressources entreprises
- ADEPME (Agence de développement des PME)

**Priorité 2 — Médias & blogs**
- SenActu, DakarActu, Seneweb — proposer des communiqués de presse
- Blogs tech africains (Africa Tech, Afrik 21, Jeuneafrique tech)
- Influenceurs sénégalais tech sur YouTube/TikTok

**Priorité 3 — Annuaires qualifiés**
- Annuaires d'entreprises Sénégal
- Pages jaunes Sénégal
- Répertoires e-commerce Afrique de l'Ouest

**Tactique — Guest posting**
Écrire des articles invités sur :
- "L'e-commerce à Saint-Louis : opportunités pour les vendeurs locaux"
- "Comment la tech révolutionne le commerce à Saint-Louis"
Cibles : blogs partenaires, médias locaux, sites UGB/ADEPME
```
