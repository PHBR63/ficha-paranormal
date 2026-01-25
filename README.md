# 🔮 Ordem Paranormal RPG - Ficha Digital

<div align="center">

![Ordem Paranormal RPG](https://img.shields.io/badge/Ordem%20Paranormal-RPG%20v1.3-8B0000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDIyIDguNSAyMiAxNS41IDEyIDIyIDIgMTUuNSAyIDguNSIvPjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Lovable%20Cloud-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Offline-5A0FC8?style=for-the-badge&logo=pwa)

**Sistema completo de gerenciamento de fichas e campanhas para o RPG Ordem Paranormal**

[🎮 Acessar Aplicação](https://ficha-paranormal.lovable.app) · [📖 Documentação](docs/) · [🐛 Reportar Bug](../../issues)

</div>

---

## ✨ Visão Geral

Sistema digital completo para o RPG Ordem Paranormal, desenvolvido com React, TypeScript e Lovable Cloud. Oferece automação completa de regras oficiais do Livro Base v1.3, suporte a campanhas online em tempo real, e paridade total entre desktop e mobile.

### 🎯 Principais Diferenciais

- **Automação Completa de Regras**: Sistema Unificado de Efeitos (SUE) calcula automaticamente todos os bônus de origens, trilhas, poderes, rituais e condições
- **Paridade Mobile/Desktop**: Todas as funcionalidades disponíveis em ambas as plataformas
- **Campanhas em Tempo Real**: Sincronização instantânea entre mestre e jogadores via WebSocket
- **~366 Testes Automatizados**: Cobertura completa de mecânicas contra o Livro Base v1.3
- **PWA Offline**: Funciona sem conexão com cache inteligente

---

## 📋 Funcionalidades

### 🧙 Ficha de Personagem

| Recurso | Descrição |
|---------|-----------|
| **Criação Guiada** | Wizard step-by-step (NEX → Classe → Trilha → Origem → Atributos → Perícias → Poderes → Rituais) |
| **Atributos** | Agilidade, Força, Intelecto, Presença, Vigor com cálculo automático de modificadores |
| **Perícias** | 26 perícias oficiais com bônus automáticos de treinamento, origem e poderes |
| **Classes** | Combatente, Especialista, Ocultista com todas as 15 trilhas oficiais |
| **Poderes** | Poderes de classe, gerais e paranormais com validação de pré-requisitos |
| **Rituais** | 1º ao 4º círculo, 5 elementos, aprimoramentos, sustentação e conjuração |
| **Inventário** | Catálogo oficial de armas, armaduras, itens com sistema de carga e categorias |
| **Condições** | 28+ condições oficiais com timers automáticos e efeitos mecânicos |
| **Origens** | 26 origens do livro base + 17 de suplementos com poderes ativáveis |

### ⚔️ Sistema de Combate

| Recurso | Descrição |
|---------|-----------|
| **Rolagem de Dados** | Pool de d20 (maior/menor), animações, histórico persistente |
| **Ataques** | Cálculo automático de acerto (atributo + perícia + bônus) e dano (arma + modificadores) |
| **Críticos** | Margem de crítico, multiplicadores, dano máximo (Atirar para Matar) |
| **Buffs de Arma** | Rituais temporários com elemento e nível de aprimoramento |
| **Resistência** | Fortitude, Reflexos, Vontade com bônus automáticos de trilha |
| **Rituais** | Custo de PE, aprimoramentos, efeitos de dano/cura/condição |
| **Sustentação** | Rituais sustentados com controle de turnos e concentração |
| **Poderes Ativáveis** | Painel de ativação para poderes de classe, trilha e origem |

### 🗺️ Campanhas (Modo Mestre)

| Recurso | Descrição |
|---------|-----------|
| **Criação** | Wizard completo com nome, descrição, imagem de capa |
| **Sessões** | Agendamento, início, encerramento, resumos |
| **Convites** | Códigos de convite para jogadores entrarem |
| **Notas** | Notas públicas (compartilhadas) e privadas (só mestre) |
| **Feed de Rituais** | Visualização em tempo real dos rituais conjurados |
| **Condições** | Sincronização de condições aplicadas entre mestre e jogadores |
| **Controle de Turno** | Tracker de rodadas com reset de poderes e efeitos |

### 📱 Mobile First

- **Ficha Responsiva**: Layout otimizado com tabs e drawers para telas pequenas
- **Painel de Combate**: Armas equipadas com acesso rápido a ataques
- **Modais Adaptados**: Drawers nativos para rolagem, combate, rituais
- **Touch Optimized**: Gestos e áreas de toque ampliadas
- **Histórico de Rolagens**: Persistente e acessível em qualquer aba

### 🔧 Recursos Avançados

| Recurso | Descrição |
|---------|-----------|
| **Sistema Unificado de Efeitos (SUE)** | Motor central de cálculo de bônus ([📖 Documentação](docs/SISTEMA_UNIFICADO_EFEITOS.md)) |
| **Auditoria de Personagem** | Validação automática contra regras oficiais |
| **Testes Automatizados** | ~366 testes validando mecânicas ([📖 Cobertura](docs/SUE_TEST_COVERAGE.md)) |
| **PWA** | Instalável, offline, notificações push |
| **Temas Visuais** | Tema escuro paranormal com elementos de horror investigativo |
| **IDs Centralizados** | Fonte única de verdade para todos os IDs do sistema |

---

## 🎭 Origens com Poderes Ativáveis

O sistema implementa ativação manual para origens que requerem decisão do jogador:

| Origem | Poder | Custo | Efeito | Perícias |
|--------|-------|-------|--------|----------|
| **Acadêmico** | Saber é Poder | 2 PE | +5 no teste | Testes de INT |
| **Trabalhador Rural** | Desbravador | 2 PE | +5 no teste | Adestramento, Sobrevivência |
| **Atleta** | 110% | 2 PE | +5 no teste | FOR/AGI (exceto Luta/Pontaria) |
| **Executivo** | Processo Otimizado | 2 PE | +5 no teste | Testes estendidos |
| **T.I.** | Motor de Busca | 2 PE | Usar Tecnologia | Qualquer (com internet) |
| **Religioso** | Acalentar | Grátis | +10 para aliado | 1x/cena |
| **Trambiqueiro** | Impostor | 2 PE | Usar Enganação | 1x/cena |

---

## 🛠️ Tecnologias

### Frontend
- **React 19** - UI declarativa com hooks
- **TypeScript 5** - Type safety completo
- **Vite** - Build ultrarrápido com HMR
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Componentes acessíveis
- **Framer Motion** - Animações fluidas
- **TanStack Query** - Cache e sincronização de estado

### Backend (Lovable Cloud)
- **PostgreSQL** - Banco de dados relacional
- **Auth** - Autenticação email/senha
- **Edge Functions** - Lógica serverless (Deno)
- **Realtime** - WebSocket para sincronização
- **Storage** - Upload de imagens

### Qualidade
- **Vitest** - Testes unitários e integração
- **ESLint** - Linting de código
- **Prettier** - Formatação consistente

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── character/              # Ficha de personagem
│   │   ├── mobile/             # Componentes mobile
│   │   ├── combat/             # Combate e ataques
│   │   ├── rituals/            # Rituais e conjuração
│   │   └── inventory/          # Inventário
│   ├── campaign/               # Sistema de campanhas
│   ├── dice/                   # Rolagem de dados
│   └── ui/                     # Componentes base (shadcn)
├── contexts/                   # Auth, Theme, Campaign
├── hooks/                      # Hooks customizados
├── lib/
│   ├── constants/              # IDs centralizados (game-ids.ts)
│   ├── effects/                # Motor de efeitos (SUE)
│   ├── class-powers/           # Poderes de classe e trilha
│   ├── paranormal-powers/      # Poderes paranormais
│   ├── general-powers/         # Poderes gerais
│   ├── rituals/                # Sistema de rituais
│   ├── origins/                # Origens e suplementos
│   ├── conditions/             # Condições oficiais
│   ├── catalogs/               # Catálogos de itens
│   └── __tests__/              # Testes unitários
├── pages/                      # Rotas da aplicação
├── services/                   # Serviços externos
├── types/                      # Tipos TypeScript
└── integrations/               # Supabase client e types
```

---

## 📚 Documentação Técnica

| Documento | Descrição |
|-----------|-----------|
| [SISTEMA_UNIFICADO_EFEITOS.md](docs/SISTEMA_UNIFICADO_EFEITOS.md) | Arquitetura do SUE, adapters, stacking rules |
| [SUE_TEST_COVERAGE.md](docs/SUE_TEST_COVERAGE.md) | Cobertura de ~366 testes automatizados |
| [ARQUITETURA.md](docs/ARQUITETURA.md) | Visão geral da arquitetura do sistema |
| [ORIGENS_MECANICAS_COMPLETAS.md](docs/ORIGENS_MECANICAS_COMPLETAS.md) | Implementação detalhada de origens |
| [MOBILE_DRAWER.md](docs/MOBILE_DRAWER.md) | Padrões de UI mobile com drawers |

---

## 🎯 Sistema Centralizado de IDs

O arquivo `src/lib/constants/game-ids.ts` é a **fonte única de verdade** para todos os IDs do sistema:

### Constantes Disponíveis

| Constante | Descrição |
|-----------|-----------|
| `CLASS_IDS` | `COMBATENTE`, `ESPECIALISTA`, `OCULTISTA` |
| `COMBATENTE_TRACK_IDS` | 5 trilhas do Combatente |
| `ESPECIALISTA_TRACK_IDS` | 5 trilhas do Especialista |
| `OCULTISTA_TRACK_IDS` | 5 trilhas do Ocultista |
| `CORE_ORIGIN_IDS` | 26 origens do livro base |
| `SUPPLEMENT_ORIGIN_IDS` | 17 origens de suplementos |
| `SKILL_IDS` | 26 perícias oficiais |
| `ELEMENT_IDS` | Sangue, Morte, Conhecimento, Energia, Medo |
| `PATENT_IDS` | Recruta → Elite de Elite |
| `VALID_NEX_VALUES` | 5% a 99% |

### Funções de Validação

```typescript
import {
  isValidClassId,
  isValidTrackForClass,
  isValidOriginId,
  isValidPatentId,
  isValidNexValue,
  isValidSkillId,
  isValidElementId,
  getTracksForClass,
  getSkillAttribute,
} from '@/lib/constants/game-ids';
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ ou Bun
- Conta no [Lovable](https://lovable.dev)

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ficha-paranormal.git

# Navegue até o diretório
cd ficha-paranormal

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build de produção
npm run preview      # Preview do build

# Testes
npm run test         # Executa todos os testes
npm run test:watch   # Testes em modo watch
npm run test:sue     # Testes do SUE (~366 testes)
```

---

## 🧪 Testes

O projeto possui cobertura abrangente de testes:

```bash
# Todos os testes
npm run test

# Testes do Sistema Unificado de Efeitos
npm run test -- --grep "SUE|effects-adapter|BonusSummary"

# Testes de integridade de IDs
npm run test -- game-ids-integrity

# Testes de origens
npm run test -- origins

# Testes de trilhas
npm run test -- tracks
```

### Cobertura por Categoria

| Categoria | Testes | Descrição |
|-----------|--------|-----------|
| **Origens** | ~50 | Todas as 43 origens com efeitos mecânicos |
| **Trilhas** | ~45 | Todas as 15 trilhas de classe |
| **Condições** | ~40 | 28+ condições oficiais |
| **Rituais** | ~30 | Sustentação, buffs, cura, dano |
| **Poderes** | ~50 | Paranormais, gerais, classe |
| **Stacking** | ~25 | Regras de acumulação de bônus |
| **Cenários** | ~30 | Personagens completos |
| **IDs** | ~20 | Integridade do sistema de IDs |

---

## 📖 Regras Oficiais

Este projeto segue fielmente o **Ordem Paranormal RPG v1.3** e suplementos oficiais:

- ✅ Validação automática de pré-requisitos (NEX, atributos, trilha)
- ✅ Cálculos corretos de PE, PV e Sanidade por NEX
- ✅ Limites de rituais e poderes por círculo
- ✅ Progressão automática de trilhas
- ✅ Condições oficiais com efeitos mecânicos
- ✅ Regras de stacking de bônus (mesmo nome não acumula)
- ✅ Transcender com perda de Sanidade e custos de PE

---

## 🔐 Autenticação

- Login por email/senha
- Confirmação automática de email
- Proteção de rotas para usuários autenticados
- Controle de acesso para administradores
- Sessões persistentes com refresh token

---

## 📱 PWA

O aplicativo funciona como Progressive Web App:

- 📥 Instalável em dispositivos móveis e desktop
- 📴 Funciona offline (modo limitado com cache)
- 🔔 Notificações push para eventos de campanha
- ⚡ Cache inteligente com Service Worker

---

## 🎨 Design System

O projeto utiliza uma estética de **horror investigativo** inspirada no universo Ordem Paranormal:

- **Cores**: Preto profundo (#0D0A0B), vermelho sangue (#8B0000, #B22222), âmbar/dourado (#D4AF37)
- **Elementos**: Ícones de elementos paranormais, partículas de sangue, névoa vermelha
- **Tipografia**: Fontes que evocam documentos classificados
- **Animações**: Efeitos de glitch, scan lines, transições atmosféricas

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Siga os padrões de código (ESLint, Prettier)
4. Adicione testes para novas funcionalidades
5. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
6. Push para a branch (`git push origin feature/nova-feature`)
7. Abra um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto é um trabalho de fã não-oficial baseado no RPG Ordem Paranormal, criado por Cellbit. Todos os direitos do sistema de RPG pertencem aos seus respectivos criadores.

---

<div align="center">

Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)

**[🔮 Acessar Aplicação](https://ficha-paranormal.lovable.app)**

</div>
