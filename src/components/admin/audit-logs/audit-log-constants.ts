/**
 * Constantes e configurações visuais para Logs de Auditoria
 * 
 * Define ícones, cores e labels para cada tipo de ação.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import {
  UserPlus,
  UserCog,
  UserMinus,
  Shield,
  ShieldOff,
  Scroll,
  ScrollText,
  Trash2,
  Users,
  Settings,
  LogIn,
  LogOut,
  Play,
  Square,
  FileEdit,
  Activity
} from '@/components/icons/ordem-icons';
import type { ActionTypeConfig } from './audit-log-types';

/** Configuração visual por tipo de ação */
export const ACTION_TYPE_CONFIG: Record<string, ActionTypeConfig> = {
  // Ações de usuário
  user_created: {
    label: 'Usuário criado',
    icon: UserPlus,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  user_updated: {
    label: 'Usuário atualizado',
    icon: UserCog,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  user_deleted: {
    label: 'Usuário excluído',
    icon: UserMinus,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  
  // Ações de permissão
  role_assigned: {
    label: 'Cargo atribuído',
    icon: Shield,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  role_removed: {
    label: 'Cargo removido',
    icon: ShieldOff,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  
  // Ações de personagem
  character_created: {
    label: 'Personagem criado',
    icon: Scroll,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  character_updated: {
    label: 'Personagem atualizado',
    icon: ScrollText,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  character_deleted: {
    label: 'Personagem excluído',
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  
  // Ações de campanha
  campaign_created: {
    label: 'Campanha criada',
    icon: Users,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  campaign_updated: {
    label: 'Campanha atualizada',
    icon: FileEdit,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10'
  },
  campaign_deleted: {
    label: 'Campanha excluída',
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  
  // Ações de sessão
  session_started: {
    label: 'Sessão iniciada',
    icon: Play,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  session_ended: {
    label: 'Sessão encerrada',
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  },
  
  // Ações de autenticação
  login: {
    label: 'Login',
    icon: LogIn,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10'
  },
  logout: {
    label: 'Logout',
    icon: LogOut,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10'
  },
  
  // Ações de configuração
  settings_changed: {
    label: 'Configurações alteradas',
    icon: Settings,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  }
};

/** Configuração padrão para tipos não mapeados */
export const DEFAULT_ACTION_CONFIG: ActionTypeConfig = {
  label: 'Ação',
  icon: Activity,
  color: 'text-muted-foreground',
  bgColor: 'bg-muted/50'
};

/** Obter configuração de um tipo de ação */
export function getActionConfig(actionType: string): ActionTypeConfig {
  return ACTION_TYPE_CONFIG[actionType] || {
    ...DEFAULT_ACTION_CONFIG,
    label: actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
}

/** Lista de tipos de ação para filtro */
export const ACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'user_created', label: 'Usuário criado' },
  { value: 'user_updated', label: 'Usuário atualizado' },
  { value: 'user_deleted', label: 'Usuário excluído' },
  { value: 'role_assigned', label: 'Cargo atribuído' },
  { value: 'role_removed', label: 'Cargo removido' },
  { value: 'character_created', label: 'Personagem criado' },
  { value: 'character_updated', label: 'Personagem atualizado' },
  { value: 'character_deleted', label: 'Personagem excluído' },
  { value: 'campaign_created', label: 'Campanha criada' },
  { value: 'campaign_updated', label: 'Campanha atualizada' },
  { value: 'session_started', label: 'Sessão iniciada' },
  { value: 'session_ended', label: 'Sessão encerrada' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'settings_changed', label: 'Configurações' }
];
