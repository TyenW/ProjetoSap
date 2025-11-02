 # 🎮 SapMan - Emulador SAP-1 Interativo

<div align="center">
  <img src="/assets/img/logo.png" alt="SapMan Logo" width="200"/>
  
  [![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)](https://github.com/user/sapman)
  [![Versão](https://img.shields.io/badge/Versão-1.1.0-blue)](https://github.com/user/sapman)
  [![Licença](https://img.shields.io/badge/Licença-MIT-yellow)](LICENSE)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
  [![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
  [![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)

  <h3>🏆 Projeto educacional interativo para aprendizado da arquitetura SAP-1 com estética retro Pac-Man</h3>
</div>

---

## 💻 Acesse
[Vídeo Explicativo do Youtube](https://youtu.be/EplJ32BYQ0o)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Características](#-características)
- [Novidades v1.1.0](#-novidades-v110)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Quiz Interativo](#-quiz-interativo)
- [Como Usar](#-como-usar)
- [Páginas do Sistema](#-páginas-do-sistema)
- [Arquitetura SAP-1](#-arquitetura-sap-1)
- [Conjunto de Instruções](#-conjunto-de-instruções)
- [Exemplos de Programas](#-exemplos-de-programas)
- [Configuração e Instalação](#-configuração-e-instalação)
- [Como Contribuir](#-como-contribuir)
- [Licença](#-licença)
- [Créditos](#-créditos)

---

## 🎯 Sobre o Projeto

**SapMan** é um emulador web interativo do processador **SAP-1** (Simple As Possible - 1), desenvolvido como ferramenta educacional para ensino de arquitetura de computadores. O projeto combina funcionalidade educativa com uma interface visual inspirada no clássico jogo Pac-Man, tornando o aprendizado mais envolvente e divertido.

### 🎓 Objetivo Educacional

O SAP-1 é um processador didático de 8 bits criado por **Albert Paul Malvino** para demonstrar os princípios fundamentais de arquitetura de computadores de forma simplificada. Este emulador permite:

- **Visualização em tempo real** da execução de instruções
- **Animações interativas** mostrando o fluxo de dados
- **Interface intuitiva** para programação em linguagem de máquina
- **Feedback visual** das operações internas do processador
- **Sistema gamificado de aprendizado** com quiz e conquistas

---

## ✨ Características

### 🎨 Interface Visual
- **Tema Pac-Man**: Interface retro com cores vibrantes e fonte pixelizada
- **Animações fluidas**: Visualização do fluxo de dados entre componentes
- **Design responsivo**: Totalmente adaptável para desktop, tablet e mobile
- **Controles intuitivos**: Botões de estilo arcade para navegação
- **Layout moderno e limpo**: Cards com sombras e bordas refinadas

### 🧠 Funcionalidades Educacionais
- **Emulador completo** do processador SAP-1
- **Execução passo a passo** para análise detalhada
- **Modo automático** com velocidade ajustável
- **Quiz interativo gamificado** com modo infinito e sistema de vidas
- **Sistema de conquistas** com progresso em tempo real
- **Placar de líderes Top 10** persistente (localStorage + cookies)
- **Material didático** completo sobre arquitetura

### 🔧 Recursos Técnicos
- **Importação de programas** via arquivos CSV/TXT
- **Editor de memória** integrado
- **Conversão automática** de hexadecimal para assembly
- **Sistema de logging** para depuração
- **Estatísticas detalhadas** com gráficos (Chart.js)
- **Export de resultados** em múltiplos formatos (TXT, JSON, CSV)
- **Persistência de dados** via cookies e localStorage

---

## 🆕 Novidades v1.1.0

### 🎯 Quiz Gamificado
- **Modo Infinito**: Responda perguntas aleatórias até perder 3 vidas
- **Sistema de Vidas**: Animação de corações com feedback visual
- **Perguntas Externas**: Carregadas de JSON configurável com fallback interno
- **Dificuldades Variadas**: Fácil, médio e difícil com indicação visual

### 🏆 Sistema de Conquistas
- **Conquistas Desbloqueáveis**: 6 conquistas com ícones e descrições
- **Progresso em Tempo Real**: Barra de progresso durante a sessão
- **Objetivos Claros**: Metas de streak, precisão, pontuação e perguntas respondidas
- **Visualização Grid Responsiva**: 3 colunas (desktop) → 2 → 1 (mobile)
- **Estado Locked/Unlocked**: Filtro visual para conquistas não desbloqueadas
- **Persistência**: Salvamento em localStorage + cookies (30 dias)

### 📊 Placar de Líderes
- **Top 10 Global (via API opcional)**: Classificação por pontuação e data; usa API remota quando disponível (ex.: Vercel KV)
- **Medalhas**: 🥇🥈🥉 para os 3 primeiros lugares
- **Modal de Salvamento**: Interface moderna para inserir nome
- **Toast de Confirmação**: Feedback visual ao salvar
- **Atualização Instantânea**: Sem necessidade de reload
- **Placeholders**: Linhas fictícias até completar 10 posições
- **Sem Seed Estático**: Não há jogadores de exemplo — a lista fica vazia até salvar/receber dados da API

### 📦 Export de Dados
- **Formato TXT**: Estatísticas legíveis em texto plano
- **Formato JSON**: Dados estruturados para processamento
- **Formato CSV**: Compatível com Excel e planilhas
- **Download Automático**: Via Blob API sem servidor

### 🎓 Tutorial Interativo
- **Overlay Explicativo**: Instruções passo a passo
- **Guia Rápido**: Como jogar, sistema de vidas e export

### 📱 Melhorias de Responsividade
- **Layout Flex/Grid**: Container principal adaptável
- **Suporte Touch**: Feedback tátil em botões
- **Breakpoints Otimizados**: Mobile-first design
- **Overflow Controlado**: Sem barras de rolagem horizontal
- **Text Wrapping**: Textos longos quebram corretamente
- **Sticky Panels**: Painéis fixos no scroll (desktop)

### 🎨 Design Refinado
- **Bordas Mais Leves**: De 3-4px para 1-2px
- **Sombras Modernas**: Box-shadow suaves e profundas
- **Gradientes Atualizados**: Tons mais escuros e elegantes
- **Estados de Botão**: Hover, pressed, correct, wrong com transições
- **Modal Estilizado**: Backdrop blur e animações
- **Toast Notifications**: Conquistas e salvamentos com fade

---

## 🛠 Tecnologias Utilizadas

### Frontend
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) **HTML5**: Estrutura semântica das páginas
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) **CSS3**: Estilização avançada com Grid e Flexbox
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) **JavaScript ES6+**: Lógica do emulador e interações

### Bibliotecas e APIs
- **Chart.js**: Gráficos estatísticos do quiz
- **Google Fonts**: Fonte "Press Start 2P" para estética retro
- **Web Audio API**: Controle de áudio de fundo

### Ferramentas de Desenvolvimento
- **VS Code**: Editor principal
- **Git**: Controle de versão
- **Chrome DevTools**: Depuração e otimização

---

## 📁 Estrutura do Projeto

```
ProjetoSap/
├── 📄 index.html              # Página principal do emulador
├── 📄 home.html               # Página de boas-vindas
├── 📄 oqueesap.html          # Material didático sobre SAP-1
├── 📄 quiz.html              # Sistema de quiz interativo gamificado
├── 📄 equipesap.html         # Informações da equipe
├── 📄 README.md              # Documentação do projeto
│
├── 📁 assets/                # Recursos estáticos
│   ├── 📁 css/              # Folhas de estilo
│   │   ├── base.css         # Variáveis e estilos globais
│   │   ├── emular.css       # Estilos do emulador
│   │   ├── home.css         # Estilos da home
│   │   ├── oqueesap.css     # Estilos do material didático
│   │   ├── equipe.css       # Estilos da página da equipe/autor
│   │   ├── quiz.css         # Estilos do quiz
│   │   └── footer.css       # Estilos do rodapé
│   │
│   ├── 📁 js/               # Scripts JavaScript
│   │   ├── audio-menu.js    # Controle global de áudio
│   │   ├── bg-anim.js       # Fundo animado (partículas)
│   │   ├── media-opt.js     # Otimizações de mídia/carregamento
│   │   ├── nav.js           # Navegação e acessibilidade
│   │   ├── oqesap.js        # Utilidades para páginas didáticas
│   │   ├── script.js        # Lógica principal do emulador
│   │   ├── carrosel.js      # Efeitos/Animações auxiliares
│   │   ├── quiz.js          # Quiz (perguntas, conquistas, placar)
│   │   ├── fig-10-2.js      # Fig. 10-2: contador em anel
│   │   └── fig-10-16.js     # Fig. 10-16: controle microprogramado
│   │
│   ├── 📁 data/             # Dados externos do quiz
│   │   ├── achievements.json # Definição de conquistas
│   │   ├── leaderboard.json  # (Opcional) seed/local do placar
│   │   └── questions.json    # Banco de perguntas do quiz
│   │
│   ├── 📁 img/              # Imagens e recursos visuais
│   │   ├── logo.png         # Logo principal
│   │   ├── logo-page.png    # Favicon
│   │   ├── pacman.png       # Textura de fundo
│   │   ├── moeda.png        # Ícone decorativo
│   │   ├── equipe/          # Fotos da equipe
│   │   ├── setas/           # Ícones de setas
│   │   └── w/               # Animações do barramento
│   │
│   ├── 📁 audio/            # Recursos de áudio
│   │   └── pacman.mp3       # Música de fundo
│   │
│   └── 📁 docs/             # Documentação técnica
│       ├── Artigo_SAP1_Malvino.pdf
│       └── FILES.md         # Documentação detalhada de cada arquivo
│
└── 📁 rascunho/             # Exemplos de programas
    ├── entrada.csv          # Exemplo de programa em CSV
    └── entrada.txt          # Exemplo com comentários
```

---

## 🚀 Funcionalidades

### 1. 🖥️ Emulador SAP-1

#### Componentes Visualizados
- **PC (Program Counter)**: Contador de programa
- **MAR (Memory Address Register)**: Registrador de endereço de memória
- **RAM**: Memória de 16 posições (4 bits de endereço)
- **IR (Instruction Register)**: Registrador de instrução
- **Controller**: Unidade de controle e sequenciamento
- **ACC (Accumulator)**: Acumulador
- **ALU**: Unidade lógica e aritmética
- **Register B**: Registrador auxiliar
- **Output**: Display de saída
- **W-Bus**: Barramento de dados com animação visual

#### Controles de Execução
- **▶️ Executar Passo**: Executa uma instrução por vez
- **⏩ Executar Tudo**: Execução automática completa
- **⏪ Passo Atrás**: Volta uma instrução (histórico)
- **🔄 Resetar**: Reinicia o estado do processador
- **📁 Carregar CSV**: Importa programa de arquivo
- **🎚️ Controle de Velocidade**: Ajusta velocidade da animação (100-2000ms)
- **🔊 Toggle Áudio**: Liga/desliga música de fundo

#### Indicador de Estados T (T1–T6) — novo
- Visualização explícita dos microestados do ciclo de instrução (T1 → T6)
- Barra de passos com realce do estado atual e acessibilidade (aria-valuenow)
- Sincronizado com a velocidade: T1–T3 durante a busca (fetch), T4–T6 durante a execução
- Integração com animações já existentes (PC, RAM, RI, Controlador, ACC, ALU)

#### Destaque do Preview 4×4 da RAM — novo
- Em modo Assembly, o preview 4×4 destaca a célula acessada:
  - Durante fetch: endereço do PC
  - Durante execução de LDA/ADD/SUB/MUL: endereço do operando
- O destaque pulsa brevemente, acompanhando a animação visual do ciclo

### 2. 🧮 Editor de Memória

#### Características
- **Interface visual**: 16 campos hexadecimais editáveis
- **Conversão automática**: Hex → Assembly em tempo real
- **Validação de entrada**: Apenas valores hexadecimais válidos (00-FF)
- **Destaque visual**: Posição atual em execução
- **Botões auxiliares**: Limpar, carregar exemplos pré-definidos

#### 2.1 ✍️ Editor Assembly (novo)
- Alternância de modo: “Editar RAM” ↔ “Editar Assembly” comutável na UI
- Montagem automática ao digitar (sem botão), com mensagens de erro amigáveis
- Sintaxe aceita no editor:
  - Mnemônicos: LDA, ADD, SUB, MUL, INC, DEC, JMP, OUT, HLT
  - Operandos: 0–F (hex), 0–15 (decimal) ou 0xN (ex.: 0xA)
  - Bytes hex diretos (2 dígitos): 0A, 1B, 2C, 30, 40, 5D, 6F, E0, F0
  - Diretivas de dados (endereçamento explícito):
    - Formatos suportados: "A 05", "A=05", "A:05", "A, 05" (hex ou decimal)
    - Endereço: 0–F (hex) ou 0–15 (decimal)
    - Valor: 00–FF (hex) ou 0–255 (decimal)
- Estratégia de montagem:
  - Primeiro aplica diretivas nos endereços solicitados
  - Depois aloca instruções sequencialmente nas posições livres
- Visualização alternável na mesma área: em modo RAM mostra “Assembly em tempo real”; em modo ASM mostra “Memória RAM 4×4” em tempo real

Exemplo de teste (cobre todos os opcodes; propósito didático):

```
0A
1B
SUB C
50
INC
DEC
60
E0
F0
A 05
B 03
C 01
```

Observação: o `60` (JMP 0) salta para o endereço 0 e pode formar laço ao executar tudo; use como teste de aceitação das instruções. Ajuste o destino se quiser evitar loop.

### 3. 📝 Sistema de Quiz Gamificado

#### Funcionalidades Principais
- **Modo Infinito**: Perguntas aleatórias até perder 3 vidas
- **Sistema de Vidas Visual**: 3 corações (❤️) com animação de perda
- **Pontuação Progressiva**: +1 ponto por acerto, contador de streak
- **Feedback Imediato**: Botões ficam verdes (✓) ou vermelhos (✗)
- **Perguntas Externas**: Carregadas de `questions.json` (100+ questões)
- **Fallback Automático**: 5 perguntas internas caso JSON falhe

#### Sistema de Conquistas 🏆
- **6 Conquistas Desbloqueáveis**:
  - 🔥 **3 Acertos Seguidos**: Streak de 3 respostas corretas
  - 🎯 **Acertou >= 80%**: Precisão de 80% ou mais em uma sessão
  - 🌟 **Pontuação Perfeita**: 100% de acerto sem erros
  - ✅ **Aquecendo**: Responda 10 perguntas
  - 🏃 **Maratonista**: Responda 50 perguntas
  - ⚡ **Pontuador**: Alcance 20 pontos em uma sessão
- **Progresso em Tempo Real**: Barra de progresso durante a sessão
- **Estado Visual**: Locked (cinza) / Unlocked (verde com brilho)
- **Persistência**: localStorage + cookies (30 dias)
- **Grid Responsivo**: 3 colunas → 2 → 1 (mobile)

#### Placar de Líderes 🥇
- **Top 10 Global (API)**: Usa um endpoint remoto opcional para persistir e compartilhar placar entre máquinas (ex.: Vercel)
- **Medalhas**: 🥇 (1º), 🥈 (2º), 🥉 (3º)
- **Modal de Salvamento**: Interface moderna para inserir nome do jogador
- **Toast de Confirmação**: "✅ [Nome] adicionado ao placar!"
- **Atualização Instantânea**: Sem necessidade de recarregar a página
- **Placeholders**: Linhas fictícias (---) até completar 10 posições
- **Sem Seed Estático**: Lista inicia vazia; preenchida pela API ou por salvamentos do usuário
- **Persistência**: Global via API quando disponível; fallback local se offline

#### Export de Resultados 📦
- **TXT**: Estatísticas legíveis em texto plano
  - Pontuação total, perguntas respondidas
  - Desempenho por dificuldade (fácil/médio/difícil)
- **JSON**: Dados estruturados para análise
  - Array completo de perguntas com respostas
  - Metadados (data, score, difficulty breakdown)
- **CSV**: Compatível com Excel/Google Sheets
  - Colunas: pergunta, dificuldade, acertou (true/false)

#### Tutorial Interativo 📘
- **Overlay Explicativo**: Instruções passo a passo
- **Como Jogar**: Leia a pergunta, escolha uma opção
- **Sistema de Vidas**: 3 vidas, perde uma ao errar
- **Salvamento**: Como salvar no Top 10
- **Export**: Como baixar estatísticas

#### Tipos de Questão
- **Conceitos Básicos**: Definições, siglas e componentes
- **Funcionamento**: Ciclos de execução, registradores e sinais de controle
- **Instruções**: Conjunto de comandos e operações (LDA, ADD, SUB, OUT, STA, LDI, JMP, JC, JZ, HLT)
- **Arquitetura**: Estrutura interna e barramentos

### 4. 📚 Material Didático

#### Seções Disponíveis
- **Introdução**: História e objetivos do SAP-1
- **Arquitetura**: Diagrama e explicação dos componentes
- **Instruções**: Detalhamento do conjunto de comandos
- **Programação**: Como escrever programas para SAP-1
- **Ciclos**: Fetch-Decode-Execute explicado
- **Microprogramação**: Sequenciamento interno
- **Recursos Visuais**: Diagramas e ilustrações

---

## 🎮 Como Usar

### 1. Acessando o Emulador

1. Abra o arquivo `index.html` em um navegador web moderno
2. A interface principal do emulador será carregada
3. Use os controles de navegação no cabeçalho para explorar

### 2. Programando o SAP-1

#### Método 1: Editor Manual
```
1. Clique nos campos da memória RAM
2. Digite valores hexadecimais (00-FF)
3. Observe a conversão automática para assembly
4. Use os botões de controle para executar
```

#### Método 2: Importação de Arquivo
```
1. Prepare um arquivo CSV ou TXT com os valores (ver rascunho/ para exemplos)
2. Clique em "📁 Carregar CSV"
3. Selecione seu arquivo
4. O programa será carregado automaticamente
```

### 3. Jogando o Quiz (⭐ Novo v1.1.0)

#### Iniciando
```
1. Clique em "Quiz" no menu superior
2. Leia as instruções no tutorial (primeira vez)
3. Clique em "Iniciar Quiz" para começar
```

#### Gameplay
```
1. Leia a pergunta exibida
2. Clique em uma das 4 opções
3. Feedback imediato: Verde (✓) = Correto | Vermelho (✗) = Errado
4. Continue até perder todas as 3 vidas ❤️
5. Ao final, salve sua pontuação no Top 10
```

#### Salvando no Placar
```
1. Clique em "💾 Salvar no Placar"
2. Digite seu nome no modal (3-20 caracteres)
3. Clique em "Salvar" ou pressione Enter
4. Receba toast de confirmação "✅ [Seu Nome] adicionado ao placar!"
5. Veja sua posição no Top 10 instantaneamente
```

#### Exportando Resultados
```
1. Após finalizar a sessão, role até "📦 Exportar Dados"
2. Escolha formato:
   - TXT: Estatísticas legíveis
   - JSON: Dados estruturados
   - CSV: Compatível com planilhas
3. Arquivo baixa automaticamente
```

#### Desbloqueando Conquistas
```
- Jogue normalmente e acompanhe progresso em tempo real
- Conquistas desbloqueadas ficam verdes com efeito brilhante
- Progresso persiste entre sessões (cookies + localStorage)
```

### 4. Executando Programas no Emulador

#### Execução Passo a Passo
```
1. Clique em "⏯️ Executar Passo"
2. Observe as animações dos componentes
3. Acompanhe o status no painel lateral
4. Continue clicando para próximas instruções
```

#### Execução Automática
```
1. Ajuste a velocidade com o controle deslizante (100-2000ms)
2. Clique em "⏩ Executar Tudo"
3. Observe a execução completa com animações
4. Use "⏸️ Pausar" se necessário
5. Acompanhe barramento W-Bus com efeito visual
```

#### Voltando Passos
```
1. Use "⏪ Passo Atrás" para desfazer última instrução
2. Histórico permite voltar múltiplos passos
3. Estado completo é restaurado (RAM, registradores, flags)
```

### 5. Interpretando Resultados

- **Painel de Status**: Mostra valores atuais dos registradores
- **Display de Saída**: Exibe resultados das instruções OUT
- **Console**: Log detalhado das operações
- **Animações**: Fluxo visual de dados entre componentes

---

## 📱 Páginas do Sistema

### 🏠 Home (`home.html`)
Página de boas-vindas com:
- Introdução ao projeto
- Links para funcionalidades principais
- Apresentação da equipe
- Guia de início rápido

### 🧠 O que é SAP (`oqueesap.html`)
Material didático completo:
- História e contexto do SAP-1
- Explicação da arquitetura
- Conjunto de instruções detalhado (10 comandos + HLT)
- Exemplos de programação com comentários
- Ciclos de execução (Fetch-Decode-Execute)
- Recursos visuais e diagramas interativos

### 🎯 Quiz (`quiz.html`) ⭐ **ATUALIZADO v1.1.0**
Sistema gamificado de avaliação:
- **Modo Infinito**: Perguntas aleatórias até perder 3 vidas
- **100+ Questões**: Banco carregado de `questions.json`
- **Sistema de Conquistas**: 6 achievements com progresso em tempo real
- **Placar Top 10**: Classificação global com medalhas e persistência
- **Export Múltiplo**: TXT, JSON, CSV para análise
- **Tutorial Integrado**: Overlay com instruções passo a passo
- **Interface Responsiva**: Totalmente adaptada para mobile e touch
- **Design Moderno**: Gradientes escuros, bordas leves, sombras e animações

#### Estrutura Visual
```
┌─────────────────────────────────────────┐
│        Quiz (Conteúdo Principal)        │
│  ┌─────────────────────────────────┐   │
│  │ Status: ❤️❤️❤️ | Respondidas: X │   │
│  │ Pergunta aleatória do JSON       │   │
│  │ [ Opção A ] [ Opção B ]          │   │
│  │ [ Opção C ] [ Opção D ]          │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│     Painéis Laterais (2 colunas)        │
│  ┌───────────────┬────────────────────┐ │
│  │ 🥇 Top 10      │ 🏆 Conquistas (6) │ │
│  │ Medalhas       │ Grid 3 colunas    │ │
│  │ Modal de Save  │ Barras de progr.  │ │
│  └───────────────┴────────────────────┘ │
└─────────────────────────────────────────┘
```

### 👥 Equipe (`equipesap.html`)
Informações sobre os desenvolvedores:
- Apresentação da equipe
- Contatos e redes sociais
- Detalhes do projeto acadêmico
- Agradecimentos e créditos

### 🖥️ Emulador (`index.html`)
Interface principal do emulador:
- Editor de memória interativo (16 posições hex)
- Visualização da arquitetura SAP-1 completa
- Controles de execução (passo, automático, reset)
- Animações em tempo real do barramento
- Painel de status e logs detalhados
- Importação de programas via CSV/TXT

---

## 🏗️ Arquitetura SAP-1

### Visão Geral

O SAP-1 é um processador de 8 bits com arquitetura Von Neumann simplificada, projetado para fins educacionais. Possui apenas os componentes essenciais para demonstrar o funcionamento básico de um computador.

### Componentes Principais

#### 1. **Program Counter (PC)** - 4 bits
- **Função**: Armazena o endereço da próxima instrução
- **Operação**: Incrementa automaticamente após cada ciclo
- **Capacidade**: Endereços 0000 a 1111 (0-15 decimal)

#### 2. **Memory Address Register (MAR)** - 4 bits
- **Função**: Armazena o endereço de memória para acesso
- **Operação**: Recebe dados do PC ou de instruções
- **Interface**: Conecta ao barramento de endereços da RAM

#### 3. **Random Access Memory (RAM)** - 16 × 8 bits
- **Capacidade**: 16 posições de 8 bits cada
- **Endereçamento**: 4 bits (0-15)
- **Conteúdo**: Instruções e dados do programa
- **Acesso**: Controlado pelo MAR

#### 4. **Instruction Register (IR)** - 8 bits
- **Função**: Armazena a instrução atual sendo executada
- **Formato**: 4 bits opcode + 4 bits operando
- **Decodificação**: Envia sinais para a unidade de controle

#### 5. **Controller/Sequencer**
- **Função**: Controla o sequenciamento das operações
- **Estados**: T1, T2, T3, T4, T5, T6 (6 estados máximos)
- **Saídas**: Sinais de controle para todos os componentes
- **Clock**: Sincroniza todas as operações

#### 6. **Accumulator (ACC)** - 8 bits
- **Função**: Registrador principal para operações aritméticas
- **Operações**: Destino de LDA, ADD, SUB, INC, DEC, MUL
- **Saída**: Conecta à ALU e ao display de saída

#### 7. **Arithmetic Logic Unit (ALU)**
- **Função**: Executa operações aritméticas e lógicas
- **Operações**: Adição, subtração, incremento, decremento, multiplicação
- **Entradas**: Accumulator e Register B
- **Saída**: Resultado volta para o Accumulator

#### 8. **Register B** - 8 bits
- **Função**: Registrador auxiliar para operações da ALU
- **Operação**: Recebe operandos da memória
- **Interface**: Segunda entrada da ALU

#### 9. **Output Register** - 8 bits
- **Função**: Armazena dados para exibição
- **Comando**: Ativado pela instrução OUT
- **Display**: Mostra valores em decimal e hexadecimal

#### 10. **W-Bus (Data Bus)** - 8 bits
- **Função**: Barramento principal de dados
- **Conexões**: Liga todos os componentes
- **Controle**: Apenas um componente pode enviar dados por vez

### Diagrama da Arquitetura

```
    ┌─────┐    ┌─────┐    ┌─────┐         ┌─────┐
    │ PC  │    │ MAR │    │ RAM │         │ ACC │
    │(4b) │    │(4b) │    │16×8b│         │(8b) │
    └──┬──┘    └──┬──┘    └──┬──┘         └──┬──┘
       │          │          │               │
       └──────────┼──────────┼───────────────┼──── W-BUS (8 bits)
                  │          │               │
       ┌──────────┼──────────┼───────────────┼────┐
       │          │          │               │    │
    ┌──▼──┐    ┌──▼──┐    ┌──▼──┐         ┌──▼──┐ │
    │ IR  │    │CTRL │    │REG B│         │ ALU │ │
    │(8b) │    │/SEQ │    │(8b) │         │     │ │
    └─────┘    └─────┘    └─────┘         └──┬──┘ │
                                             │    │
                                          ┌──▼──┐ │
                                          │ OUT │ │
                                          │(8b) │ │
                                          └─────┘ │
                                                  │
       ┌──────────────────────────────────────────┘
       │
    ┌──▼──┐
    │DISP │
    │     │
    └─────┘
```

---

## 📋 Conjunto de Instruções

### Formato das Instruções

Cada instrução do SAP-1 possui 8 bits:
- **4 bits superiores**: Código da operação (opcode)
- **4 bits inferiores**: Operando (endereço ou dado)

```
Formato: OOOO AAAA
         │    │
         │    └─ Operando (0-F)
         └────── Opcode (0-F)
```

### Instruções Disponíveis

| Opcode | Mnemônico | Operando | Descrição | Exemplo |
|--------|-----------|----------|-----------|---------|
| 0000 | **LDA** | Endereço | Carrega ACC com valor da memória | `0A` = LDA A |
| 0001 | **ADD** | Endereço | Adiciona valor da memória ao ACC | `1B` = ADD B |
| 0010 | **SUB** | Endereço | Subtrai valor da memória do ACC | `2C` = SUB C |
| 0011 | **INC** | - | Incrementa ACC em 1 | `30` = INC |
| 0100 | **DEC** | - | Decrementa ACC em 1 | `40` = DEC |
| 0101 | **MUL** | Endereço | Multiplica ACC pelo valor da memória | `5D` = MUL D |
| 0110 | **JMP** | Endereço | Salta para endereço especificado | `65` = JMP 5 |
| 1110 | **OUT** | - | Exibe conteúdo do ACC no display | `E0` = OUT |
| 1111 | **HLT** | - | Para a execução do programa | `F0` = HLT |

### Detalhamento das Instruções

#### **LDA (Load Accumulator)** - `0XXX`
```assembly
LDA A    ; Carrega ACC com conteúdo do endereço A
```
- **Operação**: ACC ← RAM[A]
- **Flags**: Nenhuma
- **Ciclos**: 3 (T1-T3)
- **Exemplo**: `0A` carrega no ACC o valor armazenado no endereço A (decimal 10)

#### **ADD (Addition)** - `1XXX`
```assembly
ADD B    ; Adiciona ao ACC o conteúdo do endereço B
```
- **Operação**: ACC ← ACC + RAM[B]
- **Flags**: Overflow (ignorado)
- **Ciclos**: 3 (T1-T3)
- **Exemplo**: `1B` adiciona ao ACC o valor do endereço B

#### **SUB (Subtraction)** - `2XXX`
```assembly
SUB C    ; Subtrai do ACC o conteúdo do endereço C
```
- **Operação**: ACC ← ACC - RAM[C]
- **Flags**: Underflow (ignorado)
- **Ciclos**: 3 (T1-T3)
- **Exemplo**: `2C` subtrai do ACC o valor do endereço C

#### **INC (Increment)** - `3000`
```assembly
INC      ; Incrementa ACC em 1
```
- **Operação**: ACC ← ACC + 1
- **Flags**: Overflow (ignorado)
- **Ciclos**: 2 (T1-T2)
- **Exemplo**: `30` incrementa o ACC

#### **DEC (Decrement)** - `4000`
```assembly
DEC      ; Decrementa ACC em 1
```
- **Operação**: ACC ← ACC - 1
- **Flags**: Underflow (ignorado)
- **Ciclos**: 2 (T1-T2)
- **Exemplo**: `40` decrementa o ACC

#### **MUL (Multiplication)** - `5XXX`
```assembly
MUL D    ; Multiplica ACC pelo conteúdo do endereço D
```
- **Operação**: ACC ← ACC × RAM[D]
- **Flags**: Overflow (ignorado)
- **Ciclos**: 4 (T1-T4)
- **Exemplo**: `5D` multiplica ACC pelo valor do endereço D

#### **JMP (Jump)** - `6XXX`
```assembly
JMP 5    ; Salta para o endereço 5
```
- **Operação**: PC ← endereço
- **Flags**: Nenhuma
- **Ciclos**: 2 (T1-T2)
- **Exemplo**: `65` salta para o endereço 5

#### **OUT (Output)** - `E000`
```assembly
OUT      ; Exibe ACC no display
```
- **Operação**: Display ← ACC
- **Flags**: Nenhuma
- **Ciclos**: 2 (T1-T2)
- **Exemplo**: `E0` mostra o valor do ACC no display

#### **HLT (Halt)** - `F000`
```assembly
HLT      ; Para a execução
```
- **Operação**: Para o clock
- **Flags**: Halt
- **Ciclos**: 1 (T1)
- **Exemplo**: `F0` encerra o programa

---

## 💡 Exemplos de Programas

### 1. Programa Básico - Soma Simples

```assembly
; Programa: Soma dois números
; Endereços A e B contêm os valores a somar

Endereço | Hex | Assembly | Comentário
---------|-----|----------|------------
   00    | 0A  | LDA A    | Carrega primeiro número
   01    | 1B  | ADD B    | Adiciona segundo número
   02    | E0  | OUT      | Mostra resultado
   03    | F0  | HLT      | Para execução
   04    | 00  | ---      | Espaço não usado
   05    | 00  | ---      | Espaço não usado
   06    | 00  | ---      | Espaço não usado
   07    | 00  | ---      | Espaço não usado
   08    | 00  | ---      | Espaço não usado
   09    | 00  | ---      | Espaço não usado
   0A    | 05  | ---      | Primeiro número (5)
   0B    | 03  | ---      | Segundo número (3)
   0C    | 00  | ---      | Espaço não usado
   0D    | 00  | ---      | Espaço não usado
   0E    | 00  | ---      | Espaço não usado
   0F    | 00  | ---      | Espaço não usado
```

**Resultado**: Display mostra 8 (5 + 3)

### 2. Programa Intermediário - Contador

```assembly
; Programa: Contador de 0 a 5
; Usa incremento e loop

Endereço | Hex | Assembly | Comentário
---------|-----|----------|------------
   00    | 0A  | LDA A    | Carrega valor inicial (0)
   01    | E0  | OUT      | Mostra valor atual
   02    | 30  | INC      | Incrementa contador
   03    | 1B  | ADD B    | Adiciona 0 (para delay)
   04    | 65  | JMP 5    | Salta para endereço 5
   05    | E0  | OUT      | Mostra novo valor
   06    | F0  | HLT      | Para quando chegar a 5
   07    | 00  | ---      | Espaço não usado
   08    | 00  | ---      | Espaço não usado
   09    | 00  | ---      | Espaço não usado
   0A    | 00  | ---      | Valor inicial (0)
   0B    | 00  | ---      | Valor para delay (0)
   0C    | 00  | ---      | Espaço não usado
   0D    | 00  | ---      | Espaço não usado
   0E    | 00  | ---      | Espaço não usado
   0F    | 00  | ---      | Espaço não usado
```

### 3. Programa Avançado - Multiplicação por Adição

```assembly
; Programa: Multiplica 3 × 4 usando adições sucessivas
; Simula multiplicação com loop

Endereço | Hex | Assembly | Comentário
---------|-----|----------|------------
   00    | 0A  | LDA A    | Carrega multiplicando (3)
   01    | 1B  | ADD B    | Adiciona multiplicador (4)
   02    | 1B  | ADD B    | Adiciona novamente (4)
   03    | 1B  | ADD B    | Terceira adição (4)
   04    | E0  | OUT      | Mostra resultado
   05    | F0  | HLT      | Para execução
   06    | 00  | ---      | Espaço não usado
   07    | 00  | ---      | Espaço não usado
   08    | 00  | ---      | Espaço não usado
   09    | 00  | ---      | Espaço não usado
   0A    | 00  | ---      | Multiplicando inicial (0)
   0B    | 04  | ---      | Multiplicador (4)
   0C    | 00  | ---      | Espaço não usado
   0D    | 00  | ---      | Espaço não usado
   0E    | 00  | ---      | Espaço não usado
   0F    | 00  | ---      | Espaço não usado
```

**Resultado**: Display mostra 12 (3 × 4)

### 4. Programa com Arquivo CSV

**Arquivo**: `exemplo.csv`
```csv
0A
1B
E0
F0
00
00
00
00
00
00
05
03
00
00
00
00
```

Este arquivo representa o programa de soma básica e pode ser carregado diretamente no emulador.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

#### Navegador Web Moderno
- **Chrome**: Versão 90+ (recomendado)
- **Firefox**: Versão 88+
- **Safari**: Versão 14+
- **Edge**: Versão 90+

#### Recursos Necessários
- **JavaScript**: Deve estar habilitado
- **Cookies**: Para salvar leaderboard e conquistas (v1.1.0)
- **LocalStorage**: Para persistência de dados do quiz
- **Áudio**: Para música de fundo (opcional)

### Instalação Local

#### 1. Download do Projeto
```bash
# Opção 1: Clone do repositório
git clone https://github.com/usuario/ProjetoSap.git
cd ProjetoSap

# Opção 2: Download direto
# Baixe o arquivo ZIP e extraia em uma pasta
```

#### 2. Estrutura de Arquivos
```
Certifique-se de que a estrutura esteja íntegra:
├── index.html
├── home.html
├── oqueesap.html
├── quiz.html
├── equipesap.html
└── assets/
    ├── css/
    ├── js/
    ├── data/           ⭐ NOVO: Dados externos configuráveis
    │   ├── questions.json
    │   └── achievements.json
    ├── img/
    ├── audio/
    └── docs/
```

#### 3. Execução
```bash
# Opção 1: Servidor local simples (recomendado para v1.1.0)
python -m http.server 8000
# Acesse: http://localhost:8000
# IMPORTANTE: Necessário para carregar JSON externo (CORS)

# Opção 2: Live Server (VS Code)
# Instale a extensão Live Server
# Clique direito em index.html > "Open with Live Server"

# Opção 3: Abrir diretamente (limitado)
# Funciona, mas JSON externo pode não carregar (fallback interno usado)
```

### Configuração do Quiz (v1.1.0)

#### Editando Banco de Perguntas
```json
// assets/data/questions.json
{
  "meta": {
    "version": "1.0",
    "totalQuestions": 100,
    "categories": ["basics", "architecture", "instructions", "programming"]
  },
  "questions": [
    {
      "id": 1,
      "question": "O que significa SAP?",
      "options": [
        "Simple As Possible",
        "System Analysis Program",
        "Sequential Access Processor",
        "Standard Automatic Protocol"
      ],
      "correctAnswer": 0,
      "difficulty": "easy",
      "category": "basics"
    }
    // ... adicione mais perguntas
  ]
}
```

#### Customizando Conquistas
```json
// assets/data/achievements.json
{
  "version": "1.0",
  "achievements": [
    {
      "id": "streak_3",
      "title": "🔥 3 Acertos Seguidos",
      "description": "Acerte 3 perguntas consecutivas",
      "icon": "🔥",
      "goal": {
        "type": "streak",
        "target": 3
      }
    }
    // ... personalize conquistas
  ]
}
```

### Configuração de Desenvolvimento

#### Ambiente Recomendado
```json
{
  "editor": "Visual Studio Code",
  "extensions": [
    "ms-vscode.live-server",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag"
  ],
  "settings": {
    "liveServer.settings.port": 5500,
    "emmet.includeLanguages": {
      "javascript": "javascriptreact"
    }
  }
}
```

#### Estrutura para Contribuição
```bash
# 1. Fork do repositório
# 2. Clone local
git clone https://github.com/seu-usuario/ProjetoSap.git

# 3. Crie branch para feature
git checkout -b feature/nova-funcionalidade

# 4. Faça as alterações
# 5. Commit e push
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade

# 6. Abra Pull Request
```

### Personalização

#### Modificando Cores do Tema
```css
/* Em assets/css/style.css */
:root {
  --azul-pacman: #0001a3;        /* Azul principal */
  --azul-escuro-pacman: #282863; /* Azul escuro */
  --amarelo-pacman: #ffd700;     /* Amarelo destaque */
  --preto-pacman: #0000;         /* Preto */
  --branco-pacman: #ffffff;      /* Branco */
}
```

#### Adicionando Novas Instruções
```javascript
// Em assets/js/script.js
const hexParaAssembly = {
    '0': 'LDA',
    '1': 'ADD', 
    '2': 'SUB',
    '3': 'INC',
    '4': 'DEC',
    '5': 'MUL',
    '6': 'JMP',
    // Adicione novas instruções aqui
    '7': 'NOP',  // Exemplo: No Operation
    'E': 'OUT',
    'F': 'HLT'
};
```

#### Modificando Velocidade de Animação
```javascript
// Em assets/js/script.js
let animationSpeed = 1500; // ms entre animações
// Valores menores = mais rápido
// Valores maiores = mais lento
```

---

## 🤝 Como Contribuir

### Tipos de Contribuição

#### 🐛 Reportar Bugs
1. Verifique se o bug já foi reportado
2. Abra uma [Issue](https://github.com/usuario/ProjetoSap/issues)
3. Descreva detalhadamente:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots se aplicável
   - Informações do navegador e versão

#### ✨ Sugerir Melhorias
1. Abra uma [Issue](https://github.com/usuario/ProjetoSap/issues)
2. Use o template "Feature Request"
3. Explique o benefício educacional
4. Forneça mockups se possível

#### 🔧 Contribuir com Código
1. Fork do repositório
2. Crie branch descritiva (`feat/`, `fix/`, `docs/`)
3. Siga os padrões de código
4. Teste thoroughly (emulador, quiz, responsividade)
5. Abra Pull Request com descrição detalhada

### Padrões de Código

#### JavaScript
```javascript
// Use camelCase para variáveis e funções
const minhaVariavel = 'valor';
function minhaFuncao() {
    // Código aqui
}

// Use comentários descritivos
// Atualiza o estado do processador SAP-1
function atualizarEstadoSAP1() {
    // Implementação
}

// Use const/let, evite var
const constante = 'valor';
let variavel = 'valor';

// Funções modulares e reutilizáveis (v1.1.0)
function computeStats() {
    const stats = { /* ... */ };
    return stats;
}
```

#### CSS
```css
/* Use classes descritivas */
.sap1-component {
    display: flex;
    justify-content: center;
}

/* Mantenha especificidade baixa */
.button-primary {
    background-color: var(--amarelo-pacman);
}

/* Use variáveis CSS */
:root {
    --cor-primaria: #ffd700;
    --border-light: 2px solid rgba(255, 215, 0, 0.6); /* v1.1.0 */
}

/* Box-sizing e responsividade (v1.1.0) */
*, *::before, *::after {
    box-sizing: border-box;
}

@media (max-width: 520px) {
    /* Mobile styles */
}
```

#### HTML
```html
<!-- Use estrutura semântica -->
<section class="emulator-section">
    <h2>Emulador SAP-1</h2>
    <div class="controls">
        <!-- Controles aqui -->
    </div>
</section>

<!-- Use atributos descritivos e acessíveis -->
<button 
    id="executeStep" 
    class="btn-primary" 
    title="Executa uma instrução"
    aria-label="Executar Passo">
    Executar Passo
</button>

<!-- Modals e overlays (v1.1.0) -->
<div class="modal-overlay" id="nameModal" aria-hidden="true">
    <div class="modal-card" role="dialog" aria-labelledby="modalTitle">
        <!-- Conteúdo do modal -->
    </div>
</div>
```

### Áreas de Contribuição

#### 1. 🎓 Conteúdo Educacional
- Novos exemplos de programas SAP-1
- Perguntas para o banco do quiz (questions.json)
- Exercícios práticos e desafios
- Material didático adicional
- Traduções para outros idiomas

#### 2. 🎨 Interface e Design
- Melhorias na usabilidade
- Responsividade mobile (continuar aprimorando v1.1.0)
- Novas animações e transições
- Temas alternativos (dark/light mode)
- Acessibilidade (WCAG 2.1)

#### 3. 🔧 Funcionalidades Técnicas
- Otimizações de performance
- Novos formatos de importação/exportação
- Sistema de save/load de sessões
- Modo debug avançado
- Novas conquistas para o quiz
- Melhorias no sistema de leaderboard

#### 4. 🏆 Quiz e Gamificação (⭐ Novo v1.1.0)
- Adicionar novas conquistas criativas
- Criar sistema de badges e níveis
- Implementar desafios diários/semanais
- Analytics avançados de desempenho
- Integração com redes sociais (compartilhar scores)

#### 4. 🧪 Testes e Qualidade
- Testes automatizados
- Validação de entrada
- Tratamento de erros
- Documentação de API

### Processo de Review

#### Critérios de Avaliação
1. **Funcionalidade**: O código funciona corretamente?
2. **Qualidade**: Segue os padrões estabelecidos?
3. **Educacional**: Melhora a experiência de aprendizado?
4. **Performance**: Não degrada a performance?
5. **Documentação**: Está adequadamente documentado?

#### Timeline Esperado
- **Issues**: Resposta em 48h
- **Pull Requests**: Review em 1 semana
- **Releases**: Mensais ou por necessidade

---

## 📄 Licença

### MIT License

```
MIT License

Copyright (c) 2024 Equipe SapMan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Uso Educacional

Este projeto é especificamente voltado para **uso educacional** e pode ser:
- ✅ Usado em salas de aula
- ✅ Modificado para necessidades específicas
- ✅ Distribuído para estudantes
- ✅ Integrado em currículo acadêmico
- ✅ Usado como base para outros projetos educacionais

### Atribuição

Ao usar este projeto, pedimos que mantenha:
- Créditos à equipe original
- Link para o repositório
- Referência ao artigo de Malvino sobre SAP-1

---

## 🏆 Créditos

### 👨‍💻 Equipe de Desenvolvimento

#### **Eduardo Aniceto**
- **Função**: Pesquisador e Documentação
- **Contribuições**: modificações do projeto SAP e prototipagem no Logisim
- **GitHub**: [@eduhatcs](https://github.com/eduhatcs)

#### **Any Gabriela**
- **Função**: Pesquisador e Documentação
- **Contribuições**: modificações do projeto SAP e prototipagem no Logisim
- **GitHub**: [@anygabriella](https://github.com/anygabriella)

#### **Iara Publio**
- **Função**: Pesquisador e Documentação
- **Contribuições**: modificações do projeto SAP e prototipagem no Logisim
- **GitHub**: [@iarapublio](https://github.com/iarapublio)

#### **Izabel Chaves**
- **Função**: Design e UX/UI
- **Contribuições**: Material didático, quiz
- **LinkedIn**: [@rainbowcrack](https://github.com/rainbowcrack)

#### **Pedro Guimarães**
- **Função**: Coordenação e Front-end
- **Contribuições**: QA, validação educacional
- **GitHub**: [@TyenW](https://github.com/TyenW)

### 📚 Referências Acadêmicas

#### **Albert Paul Malvino**
- **Contribuição**: Criador original do SAP-1
- **Obra**: "Digital Computer Electronics" (1993)
- **Importância**: Base teórica fundamental do projeto

#### **Instituição Acadêmica**
- **Universidade**: Pontifícia Universidade Católica de Minas Gerais - Puc Minas
- **Curso**: Ciência da Computação
- **Disciplina**: Arquitetura de Computadores I
- **Professor Orientador**: Cláudio

### 🎨 Recursos Visuais

#### **Fonte Tipográfica**
- **Press Start 2P**: Google Fonts
- **Licença**: Open Font License
- **Uso**: Interface retro estilo arcade

#### **Áudio**
- **Música de Fundo**: Estilo Pac-Man (livre de direitos)
- **Efeitos Sonoros**: Criação própria
- **Formato**: MP3 (compatibilidade)

#### **Ícones e Imagens**
- **Logo**: Criação original da equipe
- **Ícones**: FontAwesome + criações próprias
- **Diagramas**: Baseados no livro de Malvino
- **Screenshots**: Capturas do emulador

### 🛠️ Ferramentas e Tecnologias

#### **Desenvolvimento**
- **Visual Studio Code**: Editor principal
- **Git**: Controle de versão
- **GitHub**: Hospedagem do código
- **Chrome DevTools**: Debug e otimização

#### **Design**
- **Figma**: Prototipação e design
- **Canva:** 
#### **Bibliotecas**
- **Chart.js**: Gráficos do quiz
- **Google Fonts**: Tipografia
- **Normalize.css**: Reset CSS
- **Modern Browsers**: APIs nativas

### 🌟 Agradecimentos Especiais

#### **Comunidade Educacional**
- Professores que testaram o projeto
- Estudantes que forneceram feedback
- Desenvolvedores de software educacional
- Comunidade open-source

#### **Inspirações**
- **Pac-Man**: Namco (tema visual)
- **Malvino**: Base acadêmica sólida
- **Ben Eater**: Vídeos educacionais sobre computadores
- **Nand2Tetris**: Projeto educacional similar

#### **Apoio Técnico**
- **MDN Web Docs**: Documentação técnica
- **Stack Overflow**: Resolução de problemas
- **GitHub Community**: Boas práticas
- **W3C**: Padrões web

### 📖 Bibliografia

1. **Malvino, A. P.** (1993). *Digital Computer Electronics*. McGraw-Hill.
2. **Patterson, D. A., & Hennessy, J. L.** (2020). *Computer Organization and Design*. Morgan Kaufmann.
3. **Tanenbaum, A. S.** (2013). *Structured Computer Organization*. Pearson.
4. **Stallings, W.** (2018). *Computer Organization and Architecture*. Pearson.
5. **Null, L., & Lobur, J.** (2014). *The Essentials of Computer Organization and Architecture*. Jones & Bartlett.

---

## 📞 Contato e Suporte

### 🆘 Suporte Técnico

#### **Issues no GitHub**
- **URL**: https://github.com/usuario/sapman/issues
- **Tempo de Resposta**: 24-48 horas
- **Tipos**: Bugs, dúvidas, sugestões

#### **Documentação**
- **Wiki**: https://github.com/usuario/sapman/wiki
- **FAQ**: Perguntas frequentes
- **Tutoriais**: Guias passo a passo

### 📧 Contato Direto

#### **Redes Sociais**
- **GitHub**: [github.com/usuario/ProjetoSap](https://github.com/usuario/ProjetoSap)
- **Twitter**: [@ProjetoSap](https://twitter.com/projetosap)
- **YouTube**: [Canal Projeto SAP](https://youtube.com/projetosap)

### 🎓 Uso Educacional

#### **Para Professores**
- **Kit Didático**: Materiais complementares para sala de aula
- **Planos de Aula**: Sugestões de uso com emulador e quiz
- **Avaliações**: Exercícios baseados no quiz gamificado (v1.1.0)
- **Suporte**: Treinamento e consultoria

#### **Para Estudantes**
- **Tutoriais**: Guias de aprendizado passo a passo
- **Quiz Interativo**: Sistema gamificado com conquistas (v1.1.0)
- **Exercícios**: Práticas com programas SAP-1
- **Desafios**: Desbloqueie todas as conquistas e entre no Top 10!

---

## 🔄 Histórico de Versões

### 📅 Roadmap

#### **v1.2.0** - *Próxima Release*
- [ ] Modo dark/light theme global
- [ ] Sistema de níveis e badges avançados
- [ ] Desafios diários/semanais no quiz
- [ ] Analytics avançados de desempenho
- [ ] PWA (Progressive Web App) para instalação offline

#### **v1.3.0** - *Planejado*
- [ ] Debugger avançado com breakpoints
- [ ] Simulação de múltiplos processadores
- [ ] Editor de código assembly visual com syntax highlight
- [ ] Integração com GitHub Classroom
- [ ] API para extensões e plugins

#### **v2.0.0** - *Futuro*
- [ ] SAP-2 e SAP-3 completos
- [ ] Modo colaborativo em tempo real
- [ ] IA para ajuda contextual e sugestões
- [ ] Realidade virtual/aumentada
- [ ] Plataforma LMS integrada

### 📋 Changelog

#### **v1.1.0** - *Quiz Gamificado* (2024-12-XX) ⭐
##### ✨ Novas Funcionalidades
- ✅ **Quiz em Modo Infinito**: Perguntas aleatórias até perder 3 vidas
- ✅ **Banco de Perguntas Externo**: JSON configurável com 100+ questões
- ✅ **Sistema de Conquistas**: 6 achievements com progresso em tempo real
- ✅ **Placar de Líderes Top 10**: Classificação global com medalhas e modal de save
- ✅ **Export Múltiplo**: TXT, JSON, CSV para análise de resultados
- ✅ **Tutorial Interativo**: Overlay com instruções passo a passo
- ✅ **Responsividade Completa**: Layout adaptado para mobile e touch
- ✅ **Seed de Leaderboard**: 6 jogadores iniciais pré-carregados

##### 🎨 Melhorias de Design
- ✅ **Gradientes Modernos**: Botões e painéis com degradê escuro (180deg)
- ✅ **Bordas Leves**: 2px com transparência (rgba) para visual clean
- ✅ **Sombras e Profundidade**: box-shadow em modals, cards e botões
- ✅ **Modal Estilizado**: Backdrop blur com efeito glassmorphism
- ✅ **Toast Notifications**: Feedback visual de ações (save, export)
- ✅ **Estados de Botão**: Feedback hover, active, correto/errado

##### 🏗️ Arquitetura
- ✅ **Dados Externos**: questions.json e achievements.json em assets/data/
- ✅ **Fallback Automático**: Perguntas e conquistas padrão caso JSON falhe
- ✅ **Persistência Dupla**: localStorage + cookies (30 dias)
- ✅ **Layout Vertical**: Quiz acima, painéis abaixo em grid responsivo
- ✅ **Box-Sizing Global**: border-box para todos os elementos
- ✅ **Overflow Control**: overflow-x: hidden para evitar scroll horizontal

##### 🐛 Correções
- ✅ **Responsividade**: Elementos não escapam mais do container
- ✅ **Grid de Conquistas**: Reduzido de 4 para 3 colunas (desktop)
- ✅ **Atualização de Placar**: Instantânea após save (sem reload)
- ✅ **Renderização de Opções**: Sempre exibe 4 opções corretamente
- ✅ **Progresso de Conquistas**: Cálculo correto de streak, precisão, etc.

#### **v1.0.0** - *Lançamento Inicial* (2024-12-29)
##### ✨ Funcionalidades
- ✅ Emulador SAP-1 completo e funcional
- ✅ Interface visual com tema Pac-Man
- ✅ Sistema de quiz básico com 13+ perguntas
- ✅ Material didático abrangente
- ✅ Importação de programas CSV/TXT
- ✅ Animações em tempo real do barramento
- ✅ Controles de execução (passo/automático)
- ✅ Editor de memória interativo
- ✅ Página da equipe e informações

##### 🏗️ Arquitetura
- ✅ HTML5 semântico e acessível
- ✅ CSS3 com Grid e Flexbox
- ✅ JavaScript ES6+ vanilla
- ✅ Chart.js para gráficos de desempenho
- ✅ Google Fonts: "Press Start 2P"

##### 📚 Documentação
- ✅ README completo com exemplos
- ✅ Comentários no código
- ✅ Exemplos de programas SAP-1

---

## 🏆 Créditos

### 👨‍💻 Equipe de Desenvolvimento

Desenvolvido com ❤️ por estudantes e entusiastas de arquitetura de computadores.

Visite a página [Equipe SAP](equipesap.html) para conhecer os desenvolvedores!

### 📖 Referências Acadêmicas

Este projeto é baseado no trabalho de **Albert Paul Malvino**, especialmente seu livro:
- **Malvino, A. P.** (1993). *Digital Computer Electronics*. McGraw-Hill.

### 🌟 Agradecimentos Especiais

#### **Comunidade Educacional**
- Professores que testaram o projeto
- Estudantes que forneceram feedback valioso
- Desenvolvedores de software educacional
- Comunidade open-source

#### **Inspirações Técnicas**
- **Pac-Man**: Namco (tema visual retro)
- **Malvino**: Base acadêmica sólida para SAP-1
- **Ben Eater**: Vídeos educacionais sobre computadores de 8 bits
- **Nand2Tetris**: Projeto educacional inspirador

#### **Apoio Técnico**
- **MDN Web Docs**: Documentação técnica completa
- **Chart.js**: Biblioteca de gráficos
- **Google Fonts**: Fonte "Press Start 2P"
- **Stack Overflow**: Resolução de problemas
- **GitHub Community**: Boas práticas de desenvolvimento
- **W3C**: Padrões web modernos

### 📖 Bibliografia Adicional

1. **Malvino, A. P.** (1993). *Digital Computer Electronics*. McGraw-Hill.
2. **Patterson, D. A., & Hennessy, J. L.** (2020). *Computer Organization and Design*. Morgan Kaufmann.
3. **Tanenbaum, A. S.** (2013). *Structured Computer Organization*. Pearson.
4. **Stallings, W.** (2018). *Computer Organization and Architecture*. Pearson.
5. **Null, L., & Lobur, J.** (2014). *The Essentials of Computer Organization and Architecture*. Jones & Bartlett.

---

## 📞 Contato e Suporte

### 🆘 Suporte Técnico

#### **Issues no GitHub**
- **URL**: https://github.com/usuario/ProjetoSap/issues
- **Tempo de Resposta**: 24-48 horas
- **Tipos**: Bugs, dúvidas, sugestões, melhorias

#### **Documentação**
- **README**: Documentação principal (este arquivo)
- **Wiki**: https://github.com/usuario/ProjetoSap/wiki
- **FAQ**: Perguntas frequentes e troubleshooting
- **Tutoriais**: Guias passo a passo para usar o emulador e quiz

---

## 📜 Licença

Este projeto é licenciado sob a [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 Projeto SAP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🎯 Resumo Executivo

**Projeto SAP** é uma plataforma educacional interativa para aprendizado de arquitetura de computadores através do emulador SAP-1 (Simple As Possible). Combinando simulação visual, material didático e sistema de quiz gamificado (**v1.1.0**), o projeto oferece uma experiência completa e envolvente para estudantes e entusiastas.

### ✨ Destaques v1.1.0
- 🎮 **Quiz Infinito**: Modo gamificado com vidas e pontuação
- 🏆 **6 Conquistas**: Sistema de achievements com progresso em tempo real
- 🥇 **Top 10 Global**: Placar de líderes com medalhas e persistência
- 📦 **Export TXT/JSON/CSV**: Análise completa de resultados
- 📱 **100% Responsivo**: Interface adaptada para mobile e touch
- 🎨 **Design Moderno**: Gradientes escuros, sombras e animações

### 🚀 Como Começar
1. Clone o repositório: `git clone https://github.com/usuario/ProjetoSap.git`
2. Inicie servidor local: `python -m http.server 8000`
3. Acesse: `http://localhost:8000`
4. Explore o emulador SAP-1 e desafie-se no quiz!

### 🎓 Público-Alvo
- Estudantes de Ciência da Computação e Engenharia
- Professores de Arquitetura de Computadores
- Entusiastas de hardware e retrocomputação
- Autodidatas em busca de aprendizado prático

---

<div align="center">

**[⬆ Voltar ao Topo](#-projeto-sap---emulador-educacional-do-processador-sap-1)**

Feito com 💛 e muito ☕ | © 2024 Projeto SAP

[![Stars](https://img.shields.io/github/stars/usuario/ProjetoSap?style=social)](https://github.com/usuario/ProjetoSap)
[![Forks](https://img.shields.io/github/forks/usuario/ProjetoSap?style=social)](https://github.com/usuario/ProjetoSap/fork)
[![Issues](https://img.shields.io/github/issues/usuario/ProjetoSap)](https://github.com/usuario/ProjetoSap/issues)

</div>

---

## 🔧 Build e Minificação (Produção)

Para publicar a versão final com arquivos CSS e JS minificados, este projeto inclui um processo simples baseado em Node.js que gera a pasta `dist/` com a mesma estrutura do site, porém com `.css` e `.js` minificados.

Requisitos:
- Node.js 18+ (inclui `node` e `npm`)

Passos no Windows (PowerShell):

1) Instalar dependências (primeira vez)

```powershell
npm install --save-dev postcss cssnano terser
```

2) Rodar o build (gera `dist/`)

```powershell
npm run build
```

O script `build.mjs`:
- Copia todos os arquivos do projeto (HTML, imagens, áudio, dados) para `dist/` sem alterações.
- Minifica automaticamente apenas `.css` (cssnano) e `.js` (terser).
- Mantém os mesmos nomes de arquivos — você não precisa alterar referências nos HTMLs.

Uso no VS Code:
- Abra a paleta (Ctrl+Shift+P) → “Run Task” → “Build (minify to dist/)”

Publicação:
- Suba o conteúdo de `dist/` para o servidor de produção ou para a branch/pasta de sua hospedagem estática (ex.: GitHub Pages).

- ✅ Design responsivo
- ✅ Performance otimizada

---

## 🌐 Hospedar só a API (Vercel) e o site em outro lugar

Você pode manter o site estático (HTML/CSS/JS) em qualquer hospedagem (GitHub Pages, Netlify, servidor próprio) e hospedar apenas a API do placar na Vercel.

### 1) Subir apenas a API na Vercel (serverless + KV)

- A pasta `api/` já contém `api/leaderboard.mjs` pronto para rodar como Function.
- No painel da Vercel:
  1. Crie um novo projeto apontando para este repositório (ou copie só a pasta `api/`).
  2. Em “Storage”, crie um banco **Vercel KV** e vincule ao projeto.
  3. Faça o deploy. O endpoint ficará assim: `https://SEU-PROJETO.vercel.app/api/leaderboard`.

Observações:
- O handler já responde com CORS liberado (GET/POST/OPTIONS), então pode ser chamado de qualquer origem.
- Para testes locais, você pode usar o servidor Express (`server.mjs`) com `http://localhost:8000/api/leaderboard`.

Se você estiver fazendo um deploy SOMENTE da API, pode adicionar um `vercel.json` com um redirect opcional da raiz `/` para `/api/leaderboard` (para evitar “Cannot GET /”).

Se você pretende hospedar o site completo (frontend + API) na Vercel, NÃO utilize esse redirect — deixe sem `redirects` para que a Vercel sirva seu `index.html` na raiz normalmente.

### Dica importante (deploy do site completo na Vercel)

Se o projeto contém um arquivo `server.mjs` na raiz (útil para desenvolvimento local), a Vercel pode tentar tratá-lo como entrada de servidor e não servir os arquivos estáticos como esperado. Para evitar isso ao hospedar o site completo:

1. Crie um arquivo `.vercelignore` na raiz do repositório.
2. Adicione a linha abaixo dentro dele:

```
server.mjs
```

Isso instrui a Vercel a ignorar `server.mjs` no deploy, garantindo que a URL raiz (`/`) sirva seu `index.html`. A API continuará disponível normalmente em `/api/leaderboard` (pasta `api/`).

Além disso, inclua um `vercel.json` simples para a Vercel construir e servir a pasta estática `dist/` (as funções em `api/` são detectadas automaticamente):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Isso elimina o erro “No entrypoint found” e garante que `/` sirva o conteúdo de `dist/` após o build. A API permanece disponível em `/api/*` (pasta `api/`).

Se sua conta/projeto na Vercel ainda mostrar o erro “No entrypoint found in output directory: dist”, use a configuração alternativa com builds e routes explícitos:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    { "src": "api/**/*.mjs", "use": "@vercel/node" },
    { "src": "dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/dist/$1" }
  ]
}
```

Essa configuração direciona a Vercel para servir explicitamente os arquivos estáticos de `dist/` e manter as funções em `/api/*`.

### 2) Hospedar o site estático (HTML/CSS/JS)

- Gere a pasta `dist/` (opcional, minificada) e publique em:
  - GitHub Pages (branch `gh-pages` ou `docs/`),
  - Netlify,
  - Qualquer servidor estático.

### 3) Apontar o frontend para a API remota

O frontend agora aceita configurar o endpoint do placar de forma flexível. Escolha uma das opções a seguir (na ordem de prioridade):

1. Parâmetro de URL (mais rápido, sem editar código):
  - Acesse o quiz com: `https://SEU-SITE/quiz.html?lbApi=https://SEU-PROJETO.vercel.app/api/leaderboard`
  - A URL será lembrada em `localStorage` para as próximas visitas.

2. Variável global antes de `assets/js/quiz.js`:
  ```html
  <script>
    window.LEADERBOARD_API = 'https://SEU-PROJETO.vercel.app/api/leaderboard';
  </script>
  <script src="assets/js/quiz.js"></script>
  ```

3. Meta tag no `<head>`:
  ```html
  <meta name="leaderboard-api" content="https://SEU-PROJETO.vercel.app/api/leaderboard" />
  ```

4. Fallbacks automáticos (caso nada seja configurado):
  - Tenta `same-origin` → `/api/leaderboard`.
  - Tenta `http://localhost:8000/api/leaderboard` (modo desenvolvimento).

### 4) CORS

- A API serverless (Vercel) já inclui cabeçalhos CORS: `Access-Control-Allow-Origin: *`, `Allow-Methods: GET,POST,OPTIONS`, `Allow-Headers: Content-Type`.
- O servidor Express local também habilita CORS por padrão (`cors()`).

Pronto! Assim você mantém o site onde quiser e usa um placar global compartilhado via Vercel KV.

##### 📚 Documentação
- ✅ README.md completo e detalhado
- ✅ Comentários no código
- ✅ Estrutura de projeto organizada
- ✅ Exemplos de uso

##### 🎯 Objetivos Alcançados
- ✅ Ferramenta educacional funcional
- ✅ Interface atrativa e intuitiva
- ✅ Base sólida para expansões futuras
- ✅ Código limpo e manutenível

---

<div align="center">

## 🎮 Vamos Aprender Arquitetura de Computadores!

**[🚀 Começar Agora](index.html)** | **[📚 Material Didático](oqueesap.html)** | **[🎯 Fazer Quiz](quiz.html)** | **[👥 Conhecer a Equipe](equipesap.html)**

---

*Desenvolvido com ❤️ pela Equipe SapMan*  
*Projeto Educacional - Arquitetura de Computadores*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuario/sapman)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge)](https://usuario.github.io/sapman)
[![Docs](https://img.shields.io/badge/Docs-Wiki-blue?style=for-the-badge)](https://github.com/usuario/sapman/wiki)

</div>
