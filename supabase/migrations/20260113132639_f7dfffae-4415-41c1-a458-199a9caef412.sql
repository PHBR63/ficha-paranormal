-- ========================================
-- Sistema de Templates de Personagem
-- Fase 1: MVP - Tabelas e RLS
-- ========================================

-- Tabela principal de templates
CREATE TABLE public.character_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_official BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  usage_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2),
  rating_count INTEGER NOT NULL DEFAULT 0,
  template_data JSONB NOT NULL,
  min_nex INTEGER NOT NULL DEFAULT 5,
  max_nex INTEGER NOT NULL DEFAULT 99,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de avaliações de templates
CREATE TABLE public.template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.character_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Tabela de analytics de aplicação de templates
CREATE TABLE public.template_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.character_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_character_templates_author ON public.character_templates(author_id);
CREATE INDEX idx_character_templates_public ON public.character_templates(is_public) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX idx_character_templates_official ON public.character_templates(is_official) WHERE is_official = true AND deleted_at IS NULL;
CREATE INDEX idx_character_templates_tags ON public.character_templates USING GIN(tags);
CREATE INDEX idx_character_templates_rating ON public.character_templates(rating DESC NULLS LAST);
CREATE INDEX idx_character_templates_usage ON public.character_templates(usage_count DESC);
CREATE INDEX idx_template_ratings_template ON public.template_ratings(template_id);
CREATE INDEX idx_template_applications_template ON public.template_applications(template_id);
CREATE INDEX idx_template_applications_user ON public.template_applications(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_character_templates_updated_at
  BEFORE UPDATE ON public.character_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Habilitar RLS
ALTER TABLE public.character_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_applications ENABLE ROW LEVEL SECURITY;

-- Bloquear acesso anônimo (RESTRICTIVE)
CREATE POLICY "Block anonymous access to character_templates"
  ON public.character_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Block anonymous access to template_ratings"
  ON public.template_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Block anonymous access to template_applications"
  ON public.template_applications FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- CHARACTER_TEMPLATES: Políticas de SELECT
CREATE POLICY "Users can view public templates"
  ON public.character_templates FOR SELECT
  USING (is_public = true AND deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own templates"
  ON public.character_templates FOR SELECT
  USING (auth.uid() = author_id AND deleted_at IS NULL);

CREATE POLICY "Admins can view all templates"
  ON public.character_templates FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- CHARACTER_TEMPLATES: Políticas de INSERT
CREATE POLICY "Users can create templates"
  ON public.character_templates FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- CHARACTER_TEMPLATES: Políticas de UPDATE
CREATE POLICY "Users can update own templates"
  ON public.character_templates FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any template"
  ON public.character_templates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- CHARACTER_TEMPLATES: Políticas de DELETE
CREATE POLICY "Users can delete own templates"
  ON public.character_templates FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any template"
  ON public.character_templates FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- TEMPLATE_RATINGS: Políticas
CREATE POLICY "Users can view ratings of visible templates"
  ON public.template_ratings FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.character_templates t
      WHERE t.id = template_id
      AND (t.is_public = true OR t.author_id = auth.uid())
      AND t.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can rate templates"
  ON public.template_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.character_templates t
      WHERE t.id = template_id
      AND t.is_public = true
      AND t.deleted_at IS NULL
      AND t.author_id != auth.uid()
    )
  );

CREATE POLICY "Users can update own ratings"
  ON public.template_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.template_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- TEMPLATE_APPLICATIONS: Políticas
CREATE POLICY "Users can view own applications"
  ON public.template_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Template authors can view applications"
  ON public.template_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.character_templates t
      WHERE t.id = template_id
      AND t.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can record applications"
  ON public.template_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- Função para atualizar rating médio
-- ========================================
CREATE OR REPLACE FUNCTION public.update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.character_templates
    SET 
      rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.template_ratings
        WHERE template_id = NEW.template_id
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.template_ratings
        WHERE template_id = NEW.template_id
      )
    WHERE id = NEW.template_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.character_templates
    SET 
      rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.template_ratings
        WHERE template_id = OLD.template_id
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM public.template_ratings
        WHERE template_id = OLD.template_id
      )
    WHERE id = OLD.template_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_template_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.template_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_rating();

-- ========================================
-- Função para incrementar usage_count
-- ========================================
CREATE OR REPLACE FUNCTION public.increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.character_templates
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON public.template_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_template_usage();