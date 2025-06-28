-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Base de Connaissances Vectorielle - AssistLux
-- ═══════════════════════════════════════════════════════════

-- Activer l'extension pgvector pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table pour stocker les documents sources
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, txt, md
  file_size INTEGER,
  language TEXT DEFAULT 'fr',
  category TEXT, -- procedures, faq, guides, regulations
  tags TEXT[], -- tags personnalisés
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les chunks vectorisés
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- ordre dans le document
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding vector(1536), -- Azure OpenAI text-embedding-ada-002
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des recherches (analytics)
CREATE TABLE IF NOT EXISTS knowledge_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  query_embedding vector(1536),
  results_count INTEGER,
  execution_time_ms INTEGER,
  user_session TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches vectorielles performantes
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index pour les métadonnées
CREATE INDEX IF NOT EXISTS knowledge_documents_category_idx ON knowledge_documents(category);
CREATE INDEX IF NOT EXISTS knowledge_documents_language_idx ON knowledge_documents(language);
CREATE INDEX IF NOT EXISTS knowledge_documents_tags_idx ON knowledge_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS knowledge_chunks_document_id_idx ON knowledge_chunks(document_id);

-- Index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS knowledge_documents_content_fts 
ON knowledge_documents USING gin(to_tsvector('french', content));
CREATE INDEX IF NOT EXISTS knowledge_chunks_content_fts 
ON knowledge_chunks USING gin(to_tsvector('french', content));

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_knowledge_documents_updated_at 
  BEFORE UPDATE ON knowledge_documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Fonction pour la recherche sémantique
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_language text DEFAULT 'fr'
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  chunk_content text,
  similarity float,
  metadata jsonb
)
LANGUAGE sql
AS $$
  SELECT 
    kc.id as chunk_id,
    kd.id as document_id,
    kd.title as document_title,
    kc.content as chunk_content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.metadata
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE 
    (1 - (kc.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND (filter_language IS NULL OR kd.language = filter_language)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Politique de sécurité RLS (optionnel selon vos besoins)
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_searches ENABLE ROW LEVEL SECURITY;

-- Permettre la lecture publique (ajustez selon vos besoins de sécurité)
CREATE POLICY "Allow public read access on knowledge_documents" 
  ON knowledge_documents FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access on knowledge_chunks" 
  ON knowledge_chunks FOR SELECT 
  USING (true);

-- Politique d'écriture pour les administrateurs seulement
CREATE POLICY "Allow admin insert on knowledge_documents" 
  ON knowledge_documents FOR INSERT 
  WITH CHECK (true); -- Ajustez selon votre système d'auth

CREATE POLICY "Allow admin insert on knowledge_chunks" 
  ON knowledge_chunks FOR INSERT 
  WITH CHECK (true); -- Ajustez selon votre système d'auth

-- Commentaires pour la documentation
COMMENT ON TABLE knowledge_documents IS 'Documents sources de la base de connaissances';
COMMENT ON TABLE knowledge_chunks IS 'Chunks vectorisés des documents pour la recherche sémantique';
COMMENT ON TABLE knowledge_searches IS 'Historique des recherches pour analytics et optimisation';
COMMENT ON FUNCTION search_knowledge IS 'Fonction de recherche sémantique dans la base de connaissances'; 