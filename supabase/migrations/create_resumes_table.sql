-- 创建简历表
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- 启用 RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的简历
CREATE POLICY "Users can view their own resume"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能更新自己的简历
CREATE POLICY "Users can update their own resume"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的简历
CREATE POLICY "Users can insert their own resume"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能删除自己的简历
CREATE POLICY "Users can delete their own resume"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);
