-- ============================================================================
-- Supabase Storage — Bucket "documents" + Politiques RLS
-- ============================================================================
-- À exécuter dans le SQL Editor de Supabase après avoir créé le bucket via UI.
-- Le bucket doit être créé manuellement : Storage → New bucket → "documents" (public)

-- ─── Politiques RLS ───────────────────────────────────────────────────────────

-- 1. Lecture publique (permet les URLs publiques)
CREATE POLICY "Public read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- 2. Upload : utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 3. Suppression : uniquement le propriétaire du fichier
-- Le chemin de stockage est : {workspaceId}/{uploaderId}/{timestamp}-{uuid}.{ext}
-- On extrait l'uploaderId (2e segment du path) et on compare avec auth.uid()
CREATE POLICY "Owner delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ─── Vérification ─────────────────────────────────────────────────────────────

-- Lister les politiques du bucket documents :
-- SELECT * FROM storage.policies WHERE bucket_id = 'documents';
