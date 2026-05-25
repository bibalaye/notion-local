# Optimistic Updates & Page Transitions dans NotoFlow

Ce document décrit l'implémentation des **Optimistic Updates** et des **Transitions de Page** dans NotoFlow pour une expérience utilisateur fluide et réactive.

## 🎯 Objectifs

1. **Optimistic Updates** : Rendre l'interface instantanément réactive en mettant à jour l'UI **avant** la réponse du serveur
2. **Page Transitions** : Ajouter des transitions fluides entre les pages pour une expérience premium

---

## ✅ Composants Optimisés

### 1. **PageTree** (`components/layout/PageTree.tsx`)

Le composant principal de l'arborescence des pages utilise `useOptimistic` et `useTransition`.

#### Actions optimisées :
- ✅ **Création de page** : La nouvelle page apparaît instantanément avec un indicateur ⏳
- ✅ **Archivage** : La page disparaît immédiatement de la liste
- ✅ **Duplication** : Feedback visuel pendant la duplication
- ✅ **Toggle favori** : Mise à jour instantanée des favoris

#### Implémentation :
```tsx
const [optimisticPages, updateOptimisticPages] = useOptimistic(
  pages,
  (state: Page[], action: { type: string; page?: Page; id?: string }): Page[] => {
    switch (action.type) {
      case "add":
        return action.page ? [...state, { ...action.page, pending: true }] : state;
      case "remove":
        return state.filter((p) => p.id !== action.id);
      default:
        return state;
    }
  }
);
```

#### Feedback visuel :
- Opacité réduite (`opacity-60`) pour les éléments en cours de traitement
- Icône ⏳ pour indiquer l'état "pending"
- Boutons désactivés pendant les transitions

---

### 2. **AppSidebar** (`components/layout/AppSidebar.tsx`)

Le bouton "+" pour créer une page utilise `useTransition`.

#### Actions optimisées :
- ✅ **Création rapide de page** : Bouton désactivé pendant la création
- ✅ **Navigation instantanée** : Redirection immédiate vers la nouvelle page

#### Implémentation :
```tsx
const [isPending, startTransition] = useTransition();

const handleCreatePage = () => {
  startTransition(async () => {
    try {
      const newPage = await api.pages.create();
      toast.success("Page créée !");
      if (newPage) {
        router.push(`/app/page/${newPage.id}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la création.");
    }
  });
};
```

---

### 3. **TrashPage** (`app/app/trash/page.tsx`)

La page de corbeille utilise `useOptimistic` pour les restaurations et suppressions.

#### Actions optimisées :
- ✅ **Restauration** : La page disparaît instantanément de la corbeille
- ✅ **Suppression définitive** : Retrait immédiat de la liste

#### Implémentation :
```tsx
const [optimisticPages, updateOptimisticPages] = useOptimistic(
  archivedPages,
  (state: ArchivedPage[], action: { type: string; id: string }) => {
    return state.filter((p) => p.id !== action.id);
  }
);

const handleRestore = (pageId: string) => {
  startTransition(async () => {
    updateOptimisticPages({ type: "restore", id: pageId });
    try {
      await restorePage(pageId);
      queryClient.invalidateQueries({ queryKey: ["archived-pages"] });
      toast.success("Page restaurée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la restauration");
    }
  });
};
```

---

## 🔧 Patterns Utilisés

### Pattern 1 : `useOptimistic` pour les listes
Utilisé pour les opérations CRUD sur des listes (pages, favoris, etc.)

**Avantages :**
- Mise à jour UI instantanée
- Rollback automatique en cas d'erreur
- Pas de flash de contenu

### Pattern 2 : `useTransition` pour les actions simples
Utilisé pour les boutons d'action (créer, supprimer, etc.)

**Avantages :**
- UI reste interactive pendant l'action
- État `isPending` pour désactiver les boutons
- Pas de blocage du thread UI

### Pattern 3 : Feedback visuel
Tous les éléments en cours de traitement ont :
- `opacity-50` ou `opacity-60` pour indiquer l'état pending
- Icône ⏳ pour les opérations longues
- Boutons désactivés avec `disabled:opacity-50 disabled:cursor-not-allowed`

---

## 📊 Comparaison Avant/Après

### ❌ Avant (avec useMutation)
```tsx
const createMutation = useMutation({
  mutationFn: (parentId) => api.pages.create(parentId),
  onSuccess: (newPage) => {
    queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
    toast.success("Page créée !");
  },
});

// Attente de la réponse serveur avant mise à jour UI
<button onClick={() => createMutation.mutate(null)}>
  Créer
</button>
```

**Problèmes :**
- Délai perceptible (200-500ms)
- UI bloquée pendant l'attente
- Expérience utilisateur saccadée

### ✅ Après (avec useOptimistic + useTransition)
```tsx
const [isPending, startTransition] = useTransition();
const [optimisticPages, updateOptimisticPages] = useOptimistic(pages, reducer);

const handleCreate = () => {
  startTransition(async () => {
    // 1. Mise à jour UI instantanée
    updateOptimisticPages({ type: "add", page: newPage });
    
    // 2. Appel serveur en arrière-plan
    try {
      await api.pages.create();
      toast.success("Page créée !");
    } catch {
      // Rollback automatique par React
      toast.error("Erreur");
    }
  });
};

<button onClick={handleCreate} disabled={isPending}>
  {isPending ? "Création..." : "Créer"}
</button>
```

**Avantages :**
- UI instantanée (0ms de délai perçu)
- Rollback automatique en cas d'erreur
- Expérience fluide et professionnelle

---

## 🚀 Prochaines Étapes

### Composants à optimiser :
- [ ] **DatabaseView** : Ajout/suppression de lignes
- [ ] **WorkspaceSwitcher** : Création de workspace
- [ ] **Settings** : Invitation de membres
- [ ] **CreatePageButton** : Bouton de création rapide

### Améliorations futures :
- [ ] Ajouter des animations Framer Motion pour les transitions
- [ ] Implémenter un système de queue pour les opérations multiples
- [ ] Ajouter des indicateurs de progression pour les opérations longues
- [ ] Créer un hook personnalisé `useOptimisticMutation` pour réutiliser la logique

---

## 📚 Ressources

- [React 19 useOptimistic](https://react.dev/reference/react/useOptimistic)
- [React 19 useTransition](https://react.dev/reference/react/useTransition)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 🎨 Règles d'Or

1. **Ne jamais bloquer le thread UI** : Toujours wrapper les server actions dans `startTransition`
2. **Feedback visuel obligatoire** : Toujours indiquer l'état pending (opacity, icône, disabled)
3. **Rollback automatique** : Laisser React gérer les erreurs et restaurer l'état précédent
4. **Pas d'optimistic pour les opérations critiques** : Paiements, auth, etc. doivent attendre la confirmation serveur
5. **Toast pour le feedback** : Toujours notifier l'utilisateur du succès ou de l'erreur

---

**Dernière mise à jour** : 2026-05-25


---

## 🎬 Transitions de Page

### 1. **loading.tsx** - Skeletons pour chaque route

Des fichiers `loading.tsx` ont été créés pour afficher des skeletons pendant le chargement des pages.

#### Routes avec loading states :
- ✅ `/app/loading.tsx` - Page d'accueil
- ✅ `/app/page/[id]/loading.tsx` - Éditeur de page
- ✅ `/app/databases/loading.tsx` - Liste des bases de données
- ✅ `/app/settings/loading.tsx` - Page de paramètres

#### Exemple de skeleton :
```tsx
export default function PageLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b border-border/30 px-6 py-4 space-y-3">
        <div className="h-10 w-10 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-6 bg-muted/30 rounded w-1/3 animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="space-y-4">
          <div className="h-4 bg-muted/20 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/20 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
```

---

### 2. **TransitionLink** - Navigation fluide

Un composant `TransitionLink` qui utilise `useTransition` pour des navigations non-bloquantes.

#### Fonctionnalités :
- ✅ Navigation avec `useTransition` (UI reste interactive)
- ✅ Support des modificateurs (Ctrl+Click, Cmd+Click)
- ✅ Feedback visuel optionnel avec `showLoader`
- ✅ Compatible avec tous les liens Next.js

#### Utilisation :
```tsx
import { TransitionLink } from "@/components/navigation/TransitionLink";

<TransitionLink 
  href="/app/page/123" 
  showLoader // Optionnel : ajoute opacity-60 pendant la transition
>
  Ma Page
</TransitionLink>
```

---

### 3. **PageTransition** - Animations Framer Motion

Trois variantes de transitions de page avec Framer Motion.

#### Variantes disponibles :

**a) SubtlePageTransition** (utilisée dans le layout principal)
```tsx
// Fade simple et rapide (150ms)
<SubtlePageTransition className="flex-1 overflow-y-auto">
  {children}
</SubtlePageTransition>
```

**b) PageTransition** (fade + slide vertical)
```tsx
// Fade + slide vertical (200ms)
<PageTransition>
  {children}
</PageTransition>
```

**c) SlidePageTransition** (slide horizontal)
```tsx
// Slide horizontal pour navigation entre pages (250ms)
<SlidePageTransition>
  {children}
</SlidePageTransition>
```

---

### 4. **Layout avec transitions**

Le layout principal (`app/app/layout.tsx`) utilise `SubtlePageTransition` pour animer les changements de page.

```tsx
export default function AppLayout({ children }) {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Topbar />
      <SubtlePageTransition className="flex-1 overflow-y-auto">
        {children}
      </SubtlePageTransition>
    </main>
  );
}
```

---

## 📊 Comparaison Navigation Avant/Après

### ❌ Avant
- Délai perceptible (200-500ms)
- Flash blanc entre les pages
- UI bloquée pendant la navigation
- Pas de feedback visuel

### ✅ Après
- Transition fluide (150ms)
- Fade élégant entre les pages
- UI reste interactive
- Skeletons pendant le chargement
- Expérience premium

---

## 🎨 Bonnes Pratiques

### 1. Choisir la bonne transition

| Cas d'usage | Composant recommandé |
|-------------|---------------------|
| Navigation principale (layout) | `SubtlePageTransition` |
| Pages avec beaucoup de contenu | `PageTransition` |
| Navigation entre pages similaires | `SlidePageTransition` |
| Liens dans le sidebar | `TransitionLink` |

### 2. Skeletons

- Reproduire la structure de la page réelle
- Utiliser `animate-pulse` pour l'animation
- Varier les largeurs pour un effet naturel
- Ajouter `animationDelay` pour les listes

### 3. Performance

- Utiliser `mode="wait"` dans `AnimatePresence` pour éviter les overlaps
- Garder les transitions courtes (150-250ms)
- Utiliser `initial={false}` pour éviter l'animation au premier rendu
- Préférer `opacity` et `transform` (GPU-accelerated)

---

## 🚀 Résumé des Améliorations

### Optimistic Updates
- ✅ PageTree (création, archivage, duplication, favoris)
- ✅ AppSidebar (création rapide)
- ✅ TrashPage (restauration, suppression)
- ✅ Feedback visuel avec opacity et icônes
- ✅ Rollback automatique en cas d'erreur

### Page Transitions
- ✅ 4 fichiers loading.tsx avec skeletons
- ✅ TransitionLink pour navigation fluide
- ✅ 3 variantes de PageTransition (Framer Motion)
- ✅ Layout principal avec SubtlePageTransition
- ✅ Tous les liens du sidebar utilisent TransitionLink

### Résultat
**Expérience utilisateur premium** : UI instantanée + transitions fluides = application qui semble native et ultra-réactive !

---

**Dernière mise à jour** : 2026-05-25
