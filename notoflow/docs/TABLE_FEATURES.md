# Fonctionnalités Avancées des Tableaux TipTap

Ce document décrit toutes les fonctionnalités avancées disponibles pour les tableaux dans l'éditeur NotoFlow.

---

## 🎯 Menu Contextuel de Tableau

Lorsque vous cliquez dans un tableau, un menu contextuel (bubble menu) apparaît automatiquement avec toutes les options de personnalisation.

### 📍 Accès au Menu

Le menu apparaît automatiquement lorsque :
- Vous cliquez dans une cellule du tableau
- Vous sélectionnez du texte dans le tableau
- Vous naviguez avec le clavier dans le tableau

---

## 🔧 Fonctionnalités Disponibles

### 1. **Insérer** (Menu Insertion)

#### Colonnes
- ✅ **Colonne avant** : Ajoute une nouvelle colonne à gauche de la colonne actuelle
- ✅ **Colonne après** : Ajoute une nouvelle colonne à droite de la colonne actuelle

#### Lignes
- ✅ **Ligne avant** : Ajoute une nouvelle ligne au-dessus de la ligne actuelle
- ✅ **Ligne après** : Ajoute une nouvelle ligne en-dessous de la ligne actuelle

**Raccourcis clavier** :
- Aucun raccourci par défaut (utiliser le menu)

---

### 2. **Supprimer** (Menu Suppression)

- ✅ **Supprimer la colonne** : Supprime la colonne actuelle
- ✅ **Supprimer la ligne** : Supprime la ligne actuelle
- ✅ **Supprimer le tableau** : Supprime l'intégralité du tableau

**Attention** : La suppression est irréversible (utilisez Ctrl+Z pour annuler)

---

### 3. **Cellules** (Menu Fusion/Division)

#### Fusion et Division
- ✅ **Fusionner les cellules** : Fusionne les cellules sélectionnées en une seule
  - Nécessite une sélection de plusieurs cellules
  - Le bouton est désactivé si la fusion n'est pas possible
  
- ✅ **Diviser la cellule** : Divise une cellule fusionnée en cellules individuelles
  - Nécessite une cellule fusionnée
  - Le bouton est désactivé si la division n'est pas possible

#### Navigation
- ✅ **Cellule suivante** : Déplace le curseur vers la cellule suivante
  - **Raccourci** : `Tab`
  
- ✅ **Cellule précédente** : Déplace le curseur vers la cellule précédente
  - **Raccourci** : `Shift + Tab`

---

### 4. **En-têtes** (Menu Configuration)

#### Types d'en-têtes
- ✅ **Colonne d'en-tête** : Active/désactive la première colonne comme en-tête
  - Affiche une coche ✓ quand activé
  - Style visuel différent (gras, fond coloré)
  
- ✅ **Ligne d'en-tête** : Active/désactive la première ligne comme en-tête
  - Affiche une coche ✓ quand activé
  - Style visuel différent (gras, fond coloré)
  
- ✅ **Cellule d'en-tête** : Transforme la cellule actuelle en cellule d'en-tête
  - Affiche une coche ✓ quand activé
  - Utile pour des en-têtes personnalisés

#### Réparation
- ✅ **Réparer le tableau** : Corrige automatiquement les problèmes de structure
  - Utile si le tableau est corrompu
  - Réaligne les cellules
  - Corrige les fusions incorrectes

---

## 🎨 Styles et Apparence

### Styles d'en-têtes

Les cellules d'en-tête ont automatiquement :
- **Police en gras**
- **Fond coloré** (selon le thème)
- **Bordures renforcées**
- **Alignement centré** (optionnel)

### Styles de cellules normales

Les cellules normales ont :
- **Bordures fines**
- **Fond transparent**
- **Padding confortable**
- **Alignement à gauche** par défaut

---

## ⌨️ Raccourcis Clavier

| Action | Raccourci |
|--------|-----------|
| Cellule suivante | `Tab` |
| Cellule précédente | `Shift + Tab` |
| Nouvelle ligne (en fin de tableau) | `Tab` (dans la dernière cellule) |
| Supprimer le tableau | Via menu uniquement |
| Fusionner les cellules | Via menu uniquement |

---

## 💡 Cas d'Usage

### 1. Créer un tableau de données

```
1. Tapez `/tableau` dans l'éditeur
2. Choisissez le nombre de lignes et colonnes
3. Activez "Ligne d'en-tête" pour la première ligne
4. Remplissez les données
```

### 2. Fusionner des cellules pour un titre

```
1. Sélectionnez plusieurs cellules de la première ligne
2. Cliquez sur "Cellules" > "Fusionner les cellules"
3. Tapez votre titre
4. Activez "Cellule d'en-tête" pour le style
```

### 3. Ajouter des colonnes dynamiquement

```
1. Cliquez dans une cellule
2. Menu "Insérer" > "Colonne après"
3. Répétez pour ajouter plusieurs colonnes
```

### 4. Créer un tableau complexe

```
1. Créez un tableau de base (3x3)
2. Ajoutez des lignes/colonnes selon besoin
3. Fusionnez les cellules pour les titres
4. Activez les en-têtes de ligne et colonne
5. Utilisez "Réparer le tableau" si nécessaire
```

---

## 🐛 Résolution de Problèmes

### Erreur "removeChild" lors de la suppression
**Problème résolu** : L'erreur `Failed to execute 'removeChild' on 'Node'` ne se produit plus lors de la suppression du tableau.

**Solution implémentée** : Toutes les actions du menu utilisent maintenant une fonction `safeExecute()` qui :
- Ferme le menu avant l'exécution de l'action
- Utilise `queueMicrotask()` pour différer l'action
- Permet au BubbleMenu de se démonter proprement
- Capture les erreurs potentielles

### Le menu ne s'affiche pas
- Vérifiez que vous êtes bien dans une cellule du tableau
- Cliquez directement dans le texte de la cellule
- Essayez de sélectionner du texte dans la cellule

### Les cellules ne se fusionnent pas
- Vérifiez que vous avez sélectionné plusieurs cellules adjacentes
- Les cellules doivent former un rectangle
- Utilisez "Réparer le tableau" si le problème persiste

### Le tableau est déformé
- Utilisez "En-têtes" > "Réparer le tableau"
- Vérifiez qu'il n'y a pas de cellules fusionnées incorrectement
- En dernier recours, recréez le tableau

### Navigation au clavier ne fonctionne pas
- Assurez-vous que le curseur est dans une cellule
- Utilisez `Tab` et `Shift+Tab` pour naviguer
- Cliquez dans une cellule si la navigation est bloquée

---

## 🚀 Fonctionnalités Futures

### Prévues
- [ ] Redimensionnement des colonnes par glisser-déposer
- [ ] Tri des colonnes
- [ ] Filtrage des lignes
- [ ] Export en CSV/Excel
- [ ] Formules de calcul
- [ ] Styles de cellules personnalisés (couleurs, alignement)
- [ ] Copier/coller de tableaux Excel

### En Réflexion
- [ ] Tableaux imbriqués
- [ ] Graphiques intégrés
- [ ] Validation de données
- [ ] Commentaires sur cellules

---

## 📚 Ressources

- [Documentation TipTap Table](https://tiptap.dev/api/nodes/table)
- [Guide des extensions TipTap](https://tiptap.dev/guide/custom-extensions)
- [Exemples de tableaux](https://tiptap.dev/examples/tables)

---

**Dernière mise à jour** : 2026-05-25
