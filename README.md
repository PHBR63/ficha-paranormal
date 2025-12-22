# Ordem Paranormal RPG - Ficha Digital

Sistema completo de gerenciamento de fichas e campanhas para o RPG Ordem Paranormal, desenvolvido com React, TypeScript e Supabase.

![Ordem Paranormal RPG](https://img.shields.io/badge/Ordem%20Paranormal-RPG-purple)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-green)

## 📋 Funcionalidades

### Ficha de Personagem
- **Criação guiada** com wizard step-by-step (NEX, Classe, Trilha, Origem, Atributos, Perícias, Poderes, Rituais)
- **Sistema de atributos** completo (Agilidade, Força, Intelecto, Presença, Vigor)
- **Perícias** com cálculo automático de bônus e treinamentos
- **Classes oficiais**: Combatente, Especialista, Ocultista
- **Trilhas de classe** com poderes automáticos por NEX
- **Poderes gerais e paranormais** com pré-requisitos validados
- **Sistema de rituais** (1º ao 4º círculo) com aprimoramentos
- **Inventário** com armas, armaduras e itens do catálogo oficial
- **Condições e efeitos** com timers automáticos

### Sistema de Combate
- **Rolagem de dados** com animações e histórico
- **Ataques** com cálculo automático de acerto e dano
- **Buffs de arma** temporários por turno
- **Testes de resistência** (Fortitude, Reflexos, Vontade)
- **Conjuração de rituais** com custo de PE e aprimoramentos
- **Rituais sustentados** com controle de turnos

### Campanhas (Modo Mestre)
- **Criação de campanhas** com wizard completo
- **Gerenciamento de sessões** (agendamento, início, encerramento)
- **Convites por código** para jogadores
- **Notas de campanha** públicas e privadas
- **Feed de rituais** em tempo real
- **Sincronização de condições** entre mestre e jogadores

### Mobile
- **Ficha responsiva** otimizada para dispositivos móveis
- **Painel de combate** com armas equipadas
- **Modais adaptados** (rolagem, combate, rituais, resistência)
- **Histórico de rolagens** persistente

### Recursos Avançados
- **Auditoria de personagem** para validação de regras
- **Sistema de bônus unificado** (SUE) para efeitos automáticos
- **PWA** com suporte offline e notificações push
- **Temas visuais** personalizáveis
- **Importação/Exportação** de dados

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Animações**: Framer Motion
- **Estado**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **PWA**: Vite PWA Plugin

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue até o diretório
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── character/       # Componentes da ficha de personagem
│   │   └── mobile/      # Versões mobile dos componentes
│   ├── campaign/        # Componentes de campanha
│   ├── combat/          # Sistema de combate
│   ├── dice/            # Rolagem de dados
│   ├── inventory/       # Sistema de inventário
│   └── ui/              # Componentes base (shadcn/ui)
├── contexts/            # Contextos React (Auth, Theme)
├── hooks/               # Hooks customizados
├── lib/
│   ├── class-powers/    # Poderes de classe por trilha
│   ├── rituals/         # Sistema de rituais
│   └── effects/         # Motor de efeitos unificado
├── pages/               # Páginas da aplicação
└── integrations/        # Integração com Supabase
```

## 📖 Sistema de Regras

Este projeto segue fielmente as regras oficiais do **Ordem Paranormal RPG v1.3** e suplementos oficiais. O sistema inclui:

- Validação automática de pré-requisitos
- Cálculos de PE, PV e Sanidade por NEX
- Limites de rituais e poderes por círculo
- Progressão automática de trilhas
- Condições oficiais com efeitos mecânicos

## 🔐 Autenticação

O sistema utiliza autenticação via Supabase com:
- Login por email/senha
- Confirmação automática de email (desenvolvimento)
- Proteção de rotas para usuários autenticados
- Controle de acesso para administradores

## 📱 PWA

O aplicativo funciona como Progressive Web App:
- Instalável em dispositivos móveis
- Funciona offline (modo limitado)
- Notificações push para eventos de campanha

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é um trabalho de fã não-oficial baseado no RPG Ordem Paranormal, criado por Cellbit. Todos os direitos do sistema de RPG pertencem aos seus respectivos criadores.

---

Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)
