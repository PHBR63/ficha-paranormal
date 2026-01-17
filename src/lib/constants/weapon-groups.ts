/**
 * Grupos de Armas para Sub-Escolhas de Poderes de Classe
 * Ordem Paranormal RPG v1.3 - Livro Base
 * 
 * Usado pelo poder "Especialista em Arma" do Combatente
 * e outros poderes que requerem escolha de grupo de armas.
 */

import { Sword, Target, Zap, Crosshair, HandMetal, Bomb, Shield, Pickaxe, Hammer, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Interface de um grupo de armas para seleção
 */
export interface WeaponGroup {
  id: string;
  name: string;
  description: string;
  examples: string[];
  icon: LucideIcon;
}

/**
 * Grupos de armas oficiais do sistema
 * Baseado nas categorias do Livro Base e armas disponíveis
 */
export const WEAPON_GROUPS: WeaponGroup[] = [
  {
    id: 'espadas',
    name: 'Espadas',
    description: 'Lâminas de corte e estocada',
    examples: ['Espada longa', 'Espada curta', 'Katana', 'Florete', 'Rapieira'],
    icon: Sword,
  },
  {
    id: 'machados',
    name: 'Machados',
    description: 'Armas de corte com cabeça pesada',
    examples: ['Machado', 'Machado de batalha', 'Machadinha'],
    icon: Pickaxe,
  },
  {
    id: 'armas-contundentes',
    name: 'Armas Contundentes',
    description: 'Armas que causam dano de impacto',
    examples: ['Martelo', 'Maça', 'Porrete', 'Taco de beisebol', 'Bastão'],
    icon: Hammer,
  },
  {
    id: 'armas-de-haste',
    name: 'Armas de Haste',
    description: 'Armas de alcance com cabo longo',
    examples: ['Lança', 'Alabarda', 'Tridente', 'Naginata', 'Bastão de combate'],
    icon: Target,
  },
  {
    id: 'armas-de-arremesso',
    name: 'Armas de Arremesso',
    description: 'Armas projetadas para lançar',
    examples: ['Facas de arremesso', 'Shuriken', 'Dardos', 'Boleadeiras'],
    icon: Target,
  },
  {
    id: 'arcos-bestas',
    name: 'Arcos e Bestas',
    description: 'Armas de disparo não-explosivas',
    examples: ['Arco longo', 'Arco curto', 'Besta', 'Besta de mão'],
    icon: Crosshair,
  },
  {
    id: 'pistolas',
    name: 'Pistolas',
    description: 'Armas de fogo de mão',
    examples: ['Pistola', 'Revólver', 'Pistola automática', 'Desert Eagle'],
    icon: Zap,
  },
  {
    id: 'submetralhadoras',
    name: 'Submetralhadoras',
    description: 'Armas de fogo automáticas compactas',
    examples: ['MP5', 'UZI', 'P90', 'Skorpion'],
    icon: Zap,
  },
  {
    id: 'rifles',
    name: 'Rifles',
    description: 'Armas de fogo longas',
    examples: ['Rifle de assalto', 'Rifle de precisão', 'Carabina', 'AK-47', 'M4'],
    icon: Target,
  },
  {
    id: 'espingardas',
    name: 'Espingardas',
    description: 'Armas de fogo com dispersão',
    examples: ['Espingarda', 'Shotgun de combate', 'Espingarda calibre 12'],
    icon: Target,
  },
  {
    id: 'armas-pesadas',
    name: 'Armas Pesadas',
    description: 'Armas de alto calibre e explosivas',
    examples: ['Metralhadora', 'Lança-foguetes', 'Lança-granadas', 'Bazuca'],
    icon: Bomb,
  },
  {
    id: 'desarmado',
    name: 'Combate Desarmado',
    description: 'Golpes com mãos e pés',
    examples: ['Socos', 'Chutes', 'Cotoveladas', 'Joelhadas', 'Cabeçadas'],
    icon: HandMetal,
  },
  {
    id: 'escudos',
    name: 'Escudos',
    description: 'Armas defensivas para golpear',
    examples: ['Escudo leve', 'Escudo pesado', 'Escudo tático'],
    icon: Shield,
  },
  {
    id: 'armas-improvisadas',
    name: 'Armas Improvisadas',
    description: 'Objetos usados como armas',
    examples: ['Cadeira', 'Garrafa', 'Extintor', 'Pedra', 'Corrente'],
    icon: Sparkles,
  },
];

/**
 * Retorna um grupo de armas pelo ID
 */
export function getWeaponGroupById(id: string): WeaponGroup | undefined {
  return WEAPON_GROUPS.find(g => g.id === id);
}

/**
 * Retorna o nome de um grupo de armas pelo ID
 */
export function getWeaponGroupName(id: string): string {
  return getWeaponGroupById(id)?.name || id;
}
