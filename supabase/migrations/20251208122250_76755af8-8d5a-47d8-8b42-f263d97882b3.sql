-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  master_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  settings JSONB NOT NULL DEFAULT '{}',
  current_session INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign members table (players in a campaign)
CREATE TABLE public.campaign_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('master', 'player', 'spectator')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Create campaign invites table
CREATE TABLE public.campaign_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign messages for real-time chat
CREATE TABLE public.campaign_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'dice_roll', 'system', 'whisper', 'master_note')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign sessions table
CREATE TABLE public.campaign_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT,
  summary TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sessions ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view campaigns they are members of"
ON public.campaigns FOR SELECT
USING (
  auth.uid() = master_id OR
  EXISTS (SELECT 1 FROM public.campaign_members WHERE campaign_id = id AND user_id = auth.uid())
);

CREATE POLICY "Masters can create campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update their campaigns"
ON public.campaigns FOR UPDATE
USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete their campaigns"
ON public.campaigns FOR DELETE
USING (auth.uid() = master_id);

-- Campaign members policies
CREATE POLICY "Members can view campaign members"
ON public.campaign_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND (c.master_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.campaign_members cm WHERE cm.campaign_id = c.id AND cm.user_id = auth.uid()))
  )
);

CREATE POLICY "Masters can manage members"
ON public.campaign_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND master_id = auth.uid())
  OR (user_id = auth.uid())
);

CREATE POLICY "Masters can update members"
ON public.campaign_members FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND master_id = auth.uid())
);

CREATE POLICY "Masters can remove members or members can leave"
ON public.campaign_members FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND master_id = auth.uid())
);

-- Campaign invites policies
CREATE POLICY "Masters can manage invites"
ON public.campaign_invites FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND master_id = auth.uid())
);

CREATE POLICY "Anyone can view valid invite by code"
ON public.campaign_invites FOR SELECT
USING (true);

-- Campaign messages policies
CREATE POLICY "Members can view campaign messages"
ON public.campaign_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_id = campaign_messages.campaign_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_messages.campaign_id AND master_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.campaign_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_messages.campaign_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_messages.campaign_id AND master_id = auth.uid()
    )
  )
);

-- Campaign sessions policies
CREATE POLICY "Members can view sessions"
ON public.campaign_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_id = campaign_sessions.campaign_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_sessions.campaign_id AND master_id = auth.uid()
  )
);

CREATE POLICY "Masters can manage sessions"
ON public.campaign_sessions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND master_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add master as member when campaign is created
CREATE OR REPLACE FUNCTION public.add_master_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id, role)
  VALUES (NEW.id, NEW.master_id, 'master');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_campaign_created
AFTER INSERT ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.add_master_as_member();