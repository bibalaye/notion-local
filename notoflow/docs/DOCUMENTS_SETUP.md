# Setup — Système de Documents NotoFlow

## 1. Créer le bucket Supabase Storage

Dans le **Dashboard Supabase** → Storage → New bucket :

| Champ | Valeur |
|-------|--------|
| Name | `documents` |
| Public bucket | ✅ Oui (pour les URLs publiques) |
| File size limit | `50 MB` (recommandé) |
| Allowed MIME types | `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*, image/*, text/plain, text/csv, text/markdown` |

## 2. Politique RLS du bucket (SQL Editor)

Coller dans **SQL Editor** de Supabase :

```sql
-- Lecture publique (les URLs publiques fonctionnent)
CREATE POLICY "Public read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Upload : utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Suppression : uniquement le propriétaire du fichier
CREATE POLICY "Owner delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

## 3. Variables d'environnement

Aucune variable supplémentaire requise — le système utilise les variables Supabase existantes :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Types de fichiers supportés

| Type | Rendu |
|------|-------|
| PDF | Natif navigateur (iframe) |
| Word (.docx) | Google Docs Viewer |
| Excel (.xlsx) | Google Docs Viewer |
| PowerPoint (.pptx) | Google Docs Viewer |
| Images (png, jpg, gif, webp, svg) | Natif `<img>` |
| Texte / Markdown / CSV | iframe direct |
| Autres | Lien de téléchargement |
