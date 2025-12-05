-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create characters table (Fichas de Personagem)
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  player_name TEXT,
  origin TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('Combatente', 'Especialista', 'Ocultista')),
  nex INTEGER NOT NULL DEFAULT 5 CHECK (nex >= 5 AND nex <= 99),
  patent TEXT NOT NULL DEFAULT 'Recruta' CHECK (patent IN ('Recruta', 'Operador', 'Agente Especial', 'Oficial de Operações', 'Agente de Elite')),
  
  -- Attributes (1-5 base)
  agility INTEGER NOT NULL DEFAULT 1 CHECK (agility >= 0 AND agility <= 10),
  strength INTEGER NOT NULL DEFAULT 1 CHECK (strength >= 0 AND strength <= 10),
  intellect INTEGER NOT NULL DEFAULT 1 CHECK (intellect >= 0 AND intellect <= 10),
  presence INTEGER NOT NULL DEFAULT 1 CHECK (presence >= 0 AND presence <= 10),
  vigor INTEGER NOT NULL DEFAULT 1 CHECK (vigor >= 0 AND vigor <= 10),
  
  -- Derived Stats (current/max)
  hp_current INTEGER NOT NULL DEFAULT 0,
  hp_max INTEGER NOT NULL DEFAULT 0,
  pe_current INTEGER NOT NULL DEFAULT 0,
  pe_max INTEGER NOT NULL DEFAULT 0,
  san_current INTEGER NOT NULL DEFAULT 0,
  san_max INTEGER NOT NULL DEFAULT 0,
  
  -- Defense
  defense INTEGER NOT NULL DEFAULT 10,
  
  -- Skills (JSON object with skill name -> training level)
  skills JSONB NOT NULL DEFAULT '{}',
  
  -- Powers/Abilities (array of power objects)
  powers JSONB NOT NULL DEFAULT '[]',
  
  -- Inventory (array of item objects)
  inventory JSONB NOT NULL DEFAULT '[]',
  
  -- Rituals (for Ocultistas)
  rituals JSONB NOT NULL DEFAULT '[]',
  
  -- Background/Notes
  background TEXT,
  notes TEXT,
  
  -- Photo URL
  photo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Characters policies
CREATE POLICY "Users can view their own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();