---
name: ux-design-rules
description: >
  Apply the 10 fundamental UX design rules when reviewing interfaces, giving design feedback,
  creating wireframe specifications, auditing user flows, or advising on any UI/UX task.
  Trigger this skill whenever the user asks to review a design, improve an interface, check
  UX quality, create a UI component, build a landing page, form, navigation, or any interactive
  element — even if they don't mention "UX" explicitly. Also trigger for questions about
  button placement, information architecture, menus, cognitive load, error handling, form
  design, or user journey optimization. Use this skill proactively: if a frontend or product
  task could benefit from a UX lens, apply it.
---

# 10 Règles Fondamentales de l'UX Design

Source : [mtsites.fr](https://www.mtsites.fr/articles/10-regles-de-l-ux-design)

Lorsqu'on te demande de revoir, créer ou améliorer une interface, applique systématiquement
ces 10 règles. Pour chaque tâche UX, identifie quelles règles sont les plus pertinentes et
structure ta réponse autour d'elles.

---

## 1. Connexité Uniforme
**Cohérence visuelle et logique de l'interface**

Tous les éléments de l'interface doivent être connectés de manière logique et cohérente.

**Principes d'application :**
- Les boutons doivent avoir le même style, la même couleur et le même comportement partout
- Les icônes ont un sens cohérent dans tout le système
- Couleurs, polices et espacements sont uniformes sur toutes les pages
- La navigation suit toujours la même structure

**Questions à poser :**
- Est-ce qu'un élément similaire ailleurs dans l'interface se comporte différemment ?
- L'utilisateur peut-il prédire le comportement d'un élément sans l'avoir encore utilisé ?

---

## 2. Loi de Fitts
**La taille et la position des éléments interactifs comptent**

Le temps pour atteindre une cible dépend de sa distance et de sa taille. Plus une cible est
grande et proche, plus elle est facile à atteindre.

**Principes d'application :**
- Les CTA (Call-to-Action) principaux doivent être grands et bien placés
- Sur mobile, les zones tactiles font minimum 44×44px
- Les actions fréquentes sont accessibles sans scroll ni navigation profonde
- Les éléments dangereux (supprimer, annuler) sont éloignés des actions principales
- Éviter les liens ou boutons trop petits ou trop proches les uns des autres

**Questions à poser :**
- L'utilisateur doit-il viser précisément pour cliquer sur cet élément ?
- Les zones cliquables sont-elles assez grandes sur mobile ?

---

## 3. Loi de Hick
**Réduire le nombre d'options pour accélérer la décision**

Plus le nombre d'options est élevé, plus le temps de décision augmente. Trop de choix
paralyse l'utilisateur.

**Principes d'application :**
- Limiter les items de navigation (idéalement 5-7 max)
- Regrouper les options par pertinence ou fréquence d'utilisation
- Utiliser des menus déroulants ou des catégories pour organiser la complexité
- Présenter les choix progressivement (progressive disclosure)
- Mettre en avant l'action recommandée par défaut

**Questions à poser :**
- L'utilisateur est-il face à trop d'options d'un coup ?
- Peut-on regrouper ou masquer certaines options secondaires ?

---

## 4. Loi de Jakob
**Respecter les conventions établies du web**

Les utilisateurs passent la majorité de leur temps sur d'autres sites. Ils s'attendent à ce
que ton interface fonctionne comme ceux qu'ils connaissent déjà.

**Principes d'application :**
- Logo en haut à gauche, cliquable → retour à l'accueil
- Navigation principale en haut ou dans un menu hamburger sur mobile
- Liens en bleu/soulignés ou visuellement distincts
- Panier/compte en haut à droite pour les e-commerces
- Formulaires avec labels au-dessus des champs
- Bouton de soumission en bas à droite du formulaire

**Questions à poser :**
- L'utilisateur doit-il apprendre quelque chose de nouveau pour utiliser cette interface ?
- Cette convention est-elle vraiment meilleure que la norme, ou juste "originale" ?

---

## 5. Théorie de la Gestalt
**Le cerveau perçoit les formes globalement, pas élément par élément**

Le cerveau organise les éléments visuels en groupes. Utilise ces lois pour guider la perception.

**Lois clés :**

| Loi | Principe | Application pratique |
|-----|----------|---------------------|
| **Proximité** | Les éléments proches sont perçus comme liés | Grouper label + champ, bouton + description |
| **Similitude** | Les éléments similaires semblent liés | Même style pour les éléments de même type |
| **Continuité** | L'œil suit les lignes et les alignements | Aligner les éléments sur une grille cohérente |

**Questions à poser :**
- Les éléments visuellement proches sont-ils fonctionnellement liés ?
- Les éléments de même nature partagent-ils un style visuel commun ?

---

## 6. Loi de Miller
**La mémoire à court terme ne retient que 7 (±2) éléments**

Ne pas surcharger l'utilisateur. La capacité de traitement de l'information est limitée.

**Principes d'application :**
- Maximum 7 items dans un menu de navigation
- Regrouper les informations en chunks logiques
- Un seul objectif par écran / par étape
- Formulaires longs découpés en étapes (wizard/stepper)
- Ne pas afficher plus de 5-9 produits ou options sur une même vue

**Questions à poser :**
- Combien d'informations l'utilisateur doit-il mémoriser simultanément ?
- Peut-on découper cette page en sections plus digestes ?

---

## 7. Loi de Postel
**Tolérance aux erreurs et robustesse de l'interface**

L'interface doit accepter les entrées de façon généreuse et produire des sorties précises.
L'utilisateur ne doit pas avoir à apprendre pour effectuer une tâche basique.

**Principes d'application :**
- Accepter les formats variés (téléphone avec ou sans espaces, email en majuscules)
- Afficher des messages d'erreur clairs, précis et constructifs
- Proposer de l'autocomplétion et de la correction automatique
- Guider l'utilisateur dans la saisie (placeholder, format attendu, exemple)
- Permettre l'annulation et le retour en arrière facilement
- Valider en temps réel plutôt qu'à la soumission

**Questions à poser :**
- Que se passe-t-il si l'utilisateur entre une valeur inattendue ?
- Le message d'erreur dit-il comment corriger le problème ?

---

## 8. Loi de Prägnanz
**Simplicité et clarté : la forme la plus simple est préférée**

Le cerveau choisit la forme la plus simple et stable pour interpréter ce qu'il voit. Éviter
la complexité inutile.

**Principes d'application :**
- Hiérarchie visuelle claire (H1 > H2 > corps de texte)
- Couleurs contrastées et peu nombreuses (palette limitée)
- Formes simples et reconnaissables pour les icônes
- Organisation cohérente de l'information (pas de désordre visuel)
- Whitespace généreux pour respirer et focaliser l'attention
- Supprimer tout élément qui n'a pas de rôle fonctionnel ou communicationnel

**Questions à poser :**
- Peut-on simplifier cet élément sans perdre de sens ?
- Y a-t-il des éléments décoratifs qui distraient de l'essentiel ?

---

## 9. Principe de Région Commune
**Les éléments dans une même zone sont perçus comme liés**

Regrouper visuellement les éléments qui ont une relation fonctionnelle.

**Principes d'application :**
- Utiliser des cartes, encadrés, fond coloré ou bordure pour créer des groupes
- Chaque section de la page est une région clairement délimitée
- Les actions liées à un contenu sont dans la même région (ex: boutons sous une card)
- Éviter de mélanger des éléments de fonctions différentes dans la même zone

**Questions à poser :**
- L'utilisateur comprend-il intuitivement quels éléments vont ensemble ?
- Les actions contextuelles sont-elles clairement associées à leur contenu ?

---

## 10. Peak-End Rule
**L'expérience est jugée sur ses moments forts et sa conclusion**

Notre mémoire retient principalement le pic émotionnel (positif ou négatif) et la fin de
l'expérience — pas l'ensemble.

**Principes d'application :**
- Créer un moment "wow" mémorable dans le parcours utilisateur
- Soigner particulièrement les écrans de confirmation, succès ou fin de parcours
- Les micro-interactions positives (animations, feedback visuel) renforcent les pics positifs
- Éviter que le dernier contact soit une frustration (erreur, page vide, 404)
- L'onboarding et la completion d'une tâche doivent être des moments positifs
- Les emails transactionnels (confirmation, bienvenue) font partie de l'expérience

**Questions à poser :**
- Quel est le moment le plus fort (positif ou négatif) de ce parcours ?
- Comment se termine l'expérience ? Est-ce mémorable positivement ?

---

## Guide d'utilisation de ce skill

### Pour un audit UX
Analyse l'interface ou le parcours décrit et évalue-le règle par règle. Identifie les violations
et propose des améliorations concrètes. Format suggéré :

```
✅ Règle respectée : [explication]
⚠️ Amélioration possible : [problème] → [solution]
❌ Violation : [problème] → [correction recommandée]
```

### Pour créer une interface
Avant de produire le code ou les specs, vérifie mentalement chaque règle applicable.
Documente les choix de design dans les commentaires ou la spec.

### Pour donner du feedback
Structure ton feedback autour des règles les plus pertinentes pour le contexte.
Priorise : Hick et Miller (charge cognitive) > Fitts (accessibilité) > Peak-End (mémorabilité).

### Règles prioritaires par type de tâche

| Tâche | Règles prioritaires |
|-------|-------------------|
| Formulaire | Postel, Fitts, Miller, Gestalt |
| Navigation | Hick, Jakob, Connexité |
| Landing page | Prägnanz, Peak-End, Fitts |
| Onboarding | Peak-End, Hick, Jakob |
| Dashboard | Miller, Gestalt, Région commune |
| Mobile | Fitts, Miller, Hick |
