-- AI 知识库：目录与文章（公开读、匿名可写，与 articles/notes 策略一致；生产可收紧为 Edge Function + service_role）
CREATE TABLE IF NOT EXISTS knowledge_folders (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📁',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id text PRIMARY KEY,
  folder_id text NOT NULL REFERENCES knowledge_folders (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_folder_sort ON knowledge_articles (folder_id, sort_order);

ALTER TABLE knowledge_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_all ON knowledge_folders;
CREATE POLICY public_all ON knowledge_folders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS public_all ON knowledge_articles;
CREATE POLICY public_all ON knowledge_articles FOR ALL USING (true) WITH CHECK (true);
