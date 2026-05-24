# SEO Local — Saint-Louis, Sénégal

## Stratégie de Référencement Local pour ndarmarket

### Pourquoi le SEO local est crucial pour un marketplace sénégalais

Saint-Louis est une ville de ~300 000 habitants avec :
- Faible présence en ligne des commerces locaux = concurrence SEO locale quasi nulle
- Forte communauté diaspora cherchant des produits locaux depuis l'étranger
- Croissance de la recherche mobile dans la région nord du Sénégal
- Économie locale diversifiée (pêche, commerce, tourisme, agriculture)

---

## 1. Google Business Profile (ex Google My Business)

### Fiche ndarmarket principale
```
Nom : ndarmarket — Marketplace en ligne Saint-Louis
Catégorie principale : Marché en ligne
Catégories secondaires : Centre commercial, Boutique en ligne
Adresse : [Adresse physique Saint-Louis si vous en avez une]
Zone de service : Saint-Louis, Région de Saint-Louis, Sénégal
Téléphone : +221-XX-XXX-XX-XX
Site web : https://ndarmarket.com
Horaires : Lundi-Samedi 8h-20h (ou "En ligne 24h/24")
Description (750 car. max) :
"ndarmarket est la première marketplace en ligne de Saint-Louis, Sénégal. 
Achetez et vendez électronique, mode, artisanat, alimentation auprès de vendeurs locaux vérifiés. 
Paiement Orange Money, Wave et à la livraison. Livraison rapide à Saint-Louis et dans tout le Sénégal."
```

### Posts Google Business (publier 1x/semaine)
```
Types de posts efficaces :
- Nouveaux vendeurs rejoint la plateforme
- Produit de la semaine avec prix
- Conseils pour vendre en ligne à Saint-Louis
- Promotions et offres spéciales
- Actualités du marché local
```

### Gestion des avis Google
```
Stratégie d'acquisition d'avis :
1. Email automatique post-achat J+3 demandant un avis
2. Message WhatsApp automatique avec lien direct vers avis Google
3. QR code sur les emballages de livraison
4. Répondre à 100% des avis (positifs et négatifs)
   - Réponse positive : "Merci [Prénom] ! Votre confiance nous honore à Saint-Louis."
   - Réponse négative : Reconnaître, expliquer, proposer solution
```

---

## 2. Pages de Localisation (SEO Géographique)

### Architecture des pages locales
```
/saint-louis/                     → Hub ville principale
/saint-louis/electronique/        → Catégorie + ville
/saint-louis/mode/
/saint-louis/artisanat/
/saint-louis/alimentation/

/louga/                           → Ville secondaire
/matam/
/podor/
/dagana/
/richard-toll/

/region-saint-louis/              → Région entière
```

### Template page /saint-louis/ (hub local)
```
H1: Acheter et Vendre en ligne à Saint-Louis | ndarmarket
Meta title: "Marketplace en ligne Saint-Louis, Sénégal | ndarmarket"
Meta desc: "Découvrez les meilleurs vendeurs de Saint-Louis sur ndarmarket. Électronique, mode, artisanat. Livraison rapide, paiement Orange Money."

Contenu:
- Paragraphe intro (250 mots) sur le commerce à Saint-Louis
- Grille des catégories disponibles à Saint-Louis
- Vendeurs vedettes de Saint-Louis
- Carte Google Maps avec localisation des vendeurs
- Section "Pourquoi acheter à Saint-Louis via ndarmarket"
- FAQ locale (schema FAQPage)
```

### Contenu local pour construire l'autorité
```
Articles de blog ciblant Saint-Louis :
- "Les meilleurs vendeurs de téléphones à Saint-Louis en 2024"
- "Comment vendre ses produits en ligne à Saint-Louis"
- "Guide du shopping en ligne pour les habitants de Saint-Louis"
- "Artisanat de Saint-Louis : les créateurs locaux sur ndarmarket"
- "Paiement mobile à Saint-Louis : Orange Money, Wave, comment ça marche ?"
```

---

## 3. NAP (Name, Address, Phone) — Cohérence Critique

### Règle d'or du SEO local
Le NAP doit être **identique** sur toutes les plateformes :

```
ndarmarket
[Adresse complète], Saint-Louis, Sénégal
+221-XX-XXX-XX-XX
https://ndarmarket.com
```

### Plateformes où soumettre le NAP
| Plateforme | Priorité | Lien |
|---|---|---|
| Google Business Profile | 🔴 Critique | business.google.com |
| Facebook Page (Business) | 🔴 Critique | facebook.com |
| Yelp | 🟡 Important | yelp.fr |
| Foursquare | 🟡 Important | foursquare.com |
| Yellow Pages Sénégal | 🟡 Important | yellowpages.sn |
| SenegalServices.com | 🟢 Utile | senegalservices.com |
| Annuaire du Sénégal | 🟢 Utile | Annuaires locaux |
| Apple Maps | 🟡 Important | mapsconnect.apple.com |

---

## 4. Stratégie Diaspora Sénégalaise

### Cible : Sénégalais vivant en France, Italie, Espagne, USA
```
Mots-clés diaspora :
- envoyer cadeau Sénégal en ligne
- acheter produit sénégalais depuis France
- livraison Sénégal depuis étranger
- commande pour famille Saint-Louis
- envoyer téléphone Sénégal
- artisanat sénégalais acheter online
- produits africains livraison France → Sénégal

Pages dédiées :
/diaspora/ → Guide pour commander depuis l'étranger
/envoyer-cadeau-senegal/ → Cadeaux pour la famille
/livraison-internationale/ → Informations de livraison
```

### Open Graph optimisé pour partage WhatsApp (diaspora)
```javascript
// WhatsApp utilise OG tags pour l'aperçu
openGraph: {
  images: [{
    url: product.image,
    width: 1200,   // Min 1200px pour bel aperçu WhatsApp
    height: 630,
    alt: `${product.name} - Disponible à Saint-Louis, livraison internationale`,
  }]
}
```

---

## 5. Intégration Carte et Localisation

### Google Maps Embed pour les pages vendeurs
```jsx
// components/VendorMap.jsx
export default function VendorMap({ vendor }) {
  const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_KEY}&q=${encodeURIComponent(vendor.address + ', Saint-Louis, Sénégal')}`
  
  return (
    <div className="vendor-map" aria-label={`Localisation de ${vendor.name}`}>
      <iframe
        src={mapsUrl}
        width="100%"
        height="300"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Carte de localisation - ${vendor.name}`}
      />
    </div>
  )
}
```

---

## 6. Calendrier SEO Local — Actions par Trimestre

### Q1 — Fondations
- [ ] Créer et optimiser Google Business Profile ndarmarket
- [ ] Publier pages locales /saint-louis/ et top catégories
- [ ] Soumettre NAP sur les 5 plateformes prioritaires
- [ ] Créer 3 articles de blog sur Saint-Louis

### Q2 — Accélération
- [ ] Objectif : 50 avis Google avec 4.5+ étoiles
- [ ] Créer pages pour villes secondaires (Louga, Richard-Toll, Dagana)
- [ ] Lancer stratégie contenu diaspora
- [ ] Intégrer cartes pour tous les vendeurs

### Q3 — Expansion
- [ ] Cibler Dakar et région de Thiès
- [ ] Contenu saisonnier Tabaski et Korité
- [ ] Programme partenariat avec influenceurs locaux

### Q4 — Consolidation
- [ ] Audit complet SEO local
- [ ] Contenu saisonnier fêtes de fin d'année
- [ ] Rapport annuel et planification N+1
