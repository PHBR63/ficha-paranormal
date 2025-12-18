/**
 * Hook para verificar se o usuário atual é administrador
 * Utiliza a função is_admin do banco de dados (SECURITY DEFINER)
 * para evitar problemas de recursão em políticas RLS
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Usar a função is_admin (SECURITY DEFINER) do banco de dados
        // Isso evita problemas de recursão em políticas RLS
        const { data, error } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (error) {
          console.error('Erro ao verificar status de admin:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Erro ao verificar admin:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
