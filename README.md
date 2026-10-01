# Let's Roll - VTT Ordem Paranormal

![Version](https://img.shields.io/badge/version-1.3.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?logo=pwa)

Uma mesa virtual (VTT) completa e otimizada para o sistema de RPG **Ordem Paranormal**, focada em automação, fidelidade às regras e experiência do usuário (Desktop e Mobile).

## 🚀 Proposta
O Let's Roll visa centralizar a experiência de jogo do sistema Ordem Paranormal, oferecendo automação complexa de bônus, um tabuleiro tático integrado e ferramentas de gestão de campanha para mestres e jogadores, eliminando a carga cognitiva de cálculos manuais.

## ✨ Recursos Implementados

### 📜 Ficha de Personagem (Ordem Paranormal v1.3)
- **Criação Guiada**: Stepper completo para criação de personagens (Atributos, Origem, Classe, NEX, Perícias, Rituais).
- **Motor de Regras (Rules Engine)**: Cálculos automáticos de PV, PE, SAN, Defesa e Resistências com detalhamento (breakdown) de origens.
- **Sistema Unificado de Efeitos (SUE)**: Automação de bônus vindos de itens, trilhas, rituais e condições, garantindo que regras de acumulo sejam respeitadas.
- **Gestão de Trilhas**: Suporte para todas as 15 trilhas oficiais (Combatente, Especialista, Ocultista) com painéis de habilidades específicos.
- **Versão Mobile**: Interface dedicada e otimizada para uso em celulares durante sessões presenciais.

### 🗺️ Mapa Tático (VTT)
- **Engine Konva**: Renderização de alta performance para mapas 2D.
- **Ferramentas**: Grid (Quadrado/Hex), tokens arrastáveis, régua de medição, Fog of War (Mestre), desenhos e pings.
- **Integração**: Tokens vinculados às fichas de personagens com sincronização de status em tempo real.

### 🏰 Gestão de Campanha
- **Painel do Mestre**: Controle de NPCs, distribuição de itens, gerenciamento de handouts e trilha sonora.
- **Diário de Sessão**: Registro de eventos, notas compartilhadas e exportação de resumos.
- **Combate Integrado**: Tracker de iniciativa com automação de turnos e aplicação de danos/condições em lote.

### 🛠️ Administração e Integridade
- **Dashboard Admin**: Métricas de uso, distribuição de classes/NEX e logs de auditoria.
- **Validação de Dados**: Ferramentas para verificar a integridade das fichas e compatibilidade com as regras do sistema.

## 🏗️ Arquitetura Técnica
O projeto segue uma estrutura modular baseada em responsabilidades:

- **`src/lib/`**: Núcleo de lógica (Motor de Regras, SUE, Catálogos).
- **`src/hooks/`**: Camada de lógica de estado e integração (Hooks de Combate, Personagem, Validação).
- **`src/components/`**: Componentes UI organizados por domínio (Shadcn/UI como base).
- **`src/services/`**: Abstração de chamadas externas e integrações.

## 💻 Tecnologias & Dependências
- **Frontend**: React 19, TypeScript, Vite.
- **Estilização**: Tailwind CSS, Framer Motion (animações), Lucide & Phosphor Icons.
- **Estado & Dados**: TanStack Query (v5), React Context, Zod (validação de esquemas).
- **Backend/Realtime**: Supabase (Auth, DB, Realtime, Storage).
- **Gráficos/Canvas**: Konva, React-Konva.
- **PWA**: Vite PWA Plugin para suporte offline e instalação.

## 🚀 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js (v18+)
- Bun ou NPM

### Passo a Passo
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   bun install
   # ou
   npm install
   ```
3. Configure as variáveis de ambiente (`.env`) com suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=seu_url
   VITE_SUPABASE_ANON_KEY=sua_chave
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   bun dev
   ```

## 🧪 Testes e Qualidade
O projeto possui uma suíte robusta de testes focada na integridade das regras:
- **Framework**: Vitest + React Testing Library.
- **Cobertura**: ~560 testes unitários e de integração.
- **Foco**: Validação de cálculos do SUE, derivação de atributos e snapshots de UI.
- **Comando**: `bun test` ou `npm test`.

## 🔒 Segurança
- **Validação de URLs**: Proteção contra tracking e exfiltração de dados em imagens externas no mapa.
- **Roteamento Protegido**: Middleware para controle de acesso (User vs Admin).
- **Logs de Auditoria**: Rastreamento de ações críticas em campanhas e fichas.

## 📱 PWA (Progressive Web App)
- Suporte total a **Offline First** para consulta de fichas.
- Notificações de atualização automática.
- Banner de instalação nativo.
