-- Add conditions column to characters table
ALTER TABLE public.characters 
ADD COLUMN conditions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add COMMENT for documentation
COMMENT ON COLUMN public.characters.conditions IS 'Array of active conditions: sangrando, vulneravel, atordoado, agarrado, caido, cego, surdo, exausto, apavorado, fascinado, inconsciente, morrendo, envenenado, paralisado, debilitado, fragilizado, lento, imobilizado, indefeso, confuso';