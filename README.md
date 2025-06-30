# 🎮 SapMan - Emulador SAP-1 Interativo

<div align="center">
  <img src="assets/img/logo.png" alt="SapMan Logo" width="200"/>
  
  [![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)](https://github.com/user/sapman)
  [![Versão](https://img.shields.io/badge/Versão-1.0.0-blue)](https://github.com/user/sapman)
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
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
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

---

## ✨ Características

### 🎨 Interface Visual
- **Tema Pac-Man**: Interface retro com cores vibrantes e fonte pixelizada
- **Animações fluidas**: Visualização do fluxo de dados entre componentes
- **Design responsivo**: Compatível com diferentes tamanhos de tela
- **Controles intuitivos**: Botões de estilo arcade para navegação

### 🧠 Funcionalidades Educacionais
- **Emulador completo** do processador SAP-1
- **Execução passo a passo** para análise detalhada
- **Modo automático** com velocidade ajustável
- **Quiz interativo** com sistema de dificuldade adaptativa
- **Material didático** completo sobre arquitetura

### 🔧 Recursos Técnicos
- **Importação de programas** via arquivos CSV/TXT
- **Editor de memória** integrado
- **Conversão automática** de hexadecimal para assembly
- **Sistema de logging** para depuração
- **Estatísticas detalhadas** do quiz

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
├── 📄 quiz.html              # Sistema de quiz interativo
├── 📄 equipesap.html         # Informações da equipe
├── 📄 README.md              # Documentação do projeto
│
├── 📁 assets/                # Recursos estáticos
│   ├── 📁 css/              # Folhas de estilo
│   │   ├── emular.css       # Estilos do emulador
│   │   ├── style.css        # Estilos gerais
│   │   ├── quiz.css         # Estilos do quiz
│   │   ├── oqueesap.css     # Estilos do material didático
│   │   └── footer.css       # Estilos do rodapé
│   │
│   ├── 📁 js/               # Scripts JavaScript
│   │   ├── script.js        # Lógica principal do emulador
│   │   ├── quiz.js          # Sistema de quiz
│   │   ├── oqesap.js        # Navegação e interações
│   │   └── carrosel.js      # Animação do barramento
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
│       └── Artigo_SAP1_Malvino.pdf
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
- **W-Bus**: Barramento de dados

#### Controles de Execução
- **▶️ Executar Passo**: Executa uma instrução por vez
- **⏩ Executar Tudo**: Execução automática completa
- **⏪ Passo Atrás**: Volta uma instrução (histórico)
- **🔄 Resetar**: Reinicia o estado do processador
- **📁 Carregar CSV**: Importa programa de arquivo
- **🎚️ Controle de Velocidade**: Ajusta velocidade da animação

### 2. 🧮 Editor de Memória

#### Características
- **Interface visual**: 16 campos hexadecimais editáveis
- **Conversão automática**: Hex → Assembly em tempo real
- **Validação de entrada**: Apenas valores hexadecimais válidos
- **Destaque visual**: Posição atual em execução
- **Botões auxiliares**: Limpar, carregar exemplos

### 3. 📝 Sistema de Quiz

#### Funcionalidades
- **Dificuldade adaptativa**: Fácil → Médio → Difícil
- **Sistema de vidas**: 3 chances (corações ❤️)
- **Pontuação progressiva**: Score baseado em acertos
- **Estatísticas visuais**: Gráficos de desempenho
- **Questões variadas**: 13+ perguntas sobre SAP-1

#### Tipos de Questão
- **Conceitos básicos**: Definições e componentes
- **Funcionamento**: Ciclos de execução e registradores
- **Instruções**: Conjunto de comandos e operações
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
1. Prepare um arquivo CSV ou TXT com os valores
2. Clique em "📁 Carregar CSV"
3. Selecione seu arquivo
4. O programa será carregado automaticamente
```

### 3. Executando Programas

#### Execução Passo a Passo
```
1. Clique em "⏯️ Executar Passo"
2. Observe as animações dos componentes
3. Acompanhe o status no painel lateral
4. Continue clicando para próximas instruções
```

#### Execução Automática
```
1. Ajuste a velocidade com o controle deslizante
2. Clique em "⏩ Executar Tudo"
3. Observe a execução completa
4. Use "⏸️ Pausar" se necessário
```

### 4. Interpretando Resultados

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
- Conjunto de instruções detalhado
- Exemplos de programação
- Ciclos de execução
- Recursos visuais e diagramas

### 🎯 Quiz (`quiz.html`)
Sistema de avaliação interativo:
- 13+ questões sobre SAP-1
- Dificuldade adaptativa
- Sistema de pontuação e vidas
- Estatísticas detalhadas
- Gráficos de desempenho

### 👥 Equipe (`equipesap.html`)
Informações sobre os desenvolvedores:
- Apresentação da equipe
- Contatos e redes sociais
- Detalhes do projeto acadêmico
- Agradecimentos e créditos

### 🖥️ Emulador (`index.html`)
Interface principal do emulador:
- Editor de memória interativo
- Visualização da arquitetura SAP-1
- Controles de execução
- Animações em tempo real
- Painel de status e logs

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
- **Cookies**: Para salvar configurações (opcional)
- **Áudio**: Para música de fundo (opcional)

### Instalação Local

#### 1. Download do Projeto
```bash
# Opção 1: Clone do repositório
git clone https://github.com/usuario/sapman.git
cd sapman

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
    ├── img/
    ├── audio/
    └── docs/
```

#### 3. Execução
```bash
# Opção 1: Servidor local simples
python -m http.server 8000
# Acesse: http://localhost:8000

# Opção 2: Live Server (VS Code)
# Instale a extensão Live Server
# Clique direito em index.html > "Open with Live Server"

# Opção 3: Abrir diretamente
# Simplesmente abra index.html no navegador
```

### Configuração de Desenvolvimento

#### Ambiente Recomendado
```json
{
  "editor": "Visual Studio Code",
  "extensions": [
    "ms-vscode.live-server",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
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
git clone https://github.com/seu-usuario/sapman.git

# 3. Crie branch para feature
git checkout -b feature/nova-funcionalidade

# 4. Faça as alterações
# 5. Commit e push
git add .
git commit -m "Adiciona nova funcionalidade"
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
2. Abra uma [Issue](https://github.com/usuario/sapman/issues)
3. Descreva detalhadamente:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots se aplicável
   - Informações do navegador

#### ✨ Sugerir Melhorias
1. Abra uma [Issue](https://github.com/usuario/sapman/issues)
2. Use o template "Feature Request"
3. Explique o benefício educacional
4. Forneça mockups se possível

#### 🔧 Contribuir com Código
1. Fork do repositório
2. Crie branch descritiva
3. Siga os padrões de código
4. Teste thoroughly
5. Abra Pull Request

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

<!-- Use atributos descritivos -->
<button 
    id="executeStep" 
    class="btn-primary" 
    title="Executa uma instrução">
    Executar Passo
</button>
```

### Áreas de Contribuição

#### 1. 🎓 Conteúdo Educacional
- Novos exemplos de programas
- Exercícios práticos
- Material didático adicional
- Traduções para outros idiomas

#### 2. 🎨 Interface e Design
- Melhorias na usabilidade
- Responsividade mobile
- Novas animações
- Acessibilidade

#### 3. 🔧 Funcionalidades Técnicas
- Otimizações de performance
- Novos formatos de importação
- Sistema de save/load
- Modo debug avançado

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
- **Twitter**: [@SapManProject](https://twitter.com/sapmanproject)
- **YouTube**: [Canal SapMan](https://youtube.com/sapman)
- **LinkedIn**: [Página do Projeto](https://linkedin.com/company/sapman)

### 🎓 Uso Educacional

#### **Para Professores**
- **Kit Didático**: Materiais complementares
- **Planos de Aula**: Sugestões de uso
- **Avaliações**: Exercícios e rubricas
- **Suporte**: Treinamento e consultoria

#### **Para Estudantes**
- **Tutoriais**: Guias de aprendizado
- **Exercícios**: Práticas adicionais
- **Fórum**: Discussões e dúvidas
- **Certificados**: Completar desafios

---

## 🔄 Histórico de Versões

### 📅 Roadmap

#### **v1.1.0** - *Próxima Release*
- [ ] Modo dark/light theme
- [ ] Export de programas em múltiplos formatos
- [ ] Sistema de achievements no quiz
- [ ] Tutorial interativo integrado
- [ ] Suporte a touch/mobile melhorado

#### **v1.2.0** - *Planejado*
- [ ] Debugger avançado com breakpoints
- [ ] Simulação de múltiplos processadores
- [ ] Editor de código assembly visual
- [ ] Integração com GitHub Classroom
- [ ] API para extensões

#### **v2.0.0** - *Futuro*
- [ ] SAP-2 e SAP-3 completos
- [ ] Modo colaborativo em tempo real
- [ ] IA para ajuda contextual
- [ ] Realidade virtual/aumentada
- [ ] Plataforma LMS integrada

### 📋 Changelog

#### **v1.0.0** - *Lançamento Inicial* (2024-12-29)
##### ✨ Funcionalidades
- ✅ Emulador SAP-1 completo e funcional
- ✅ Interface visual com tema Pac-Man
- ✅ Sistema de quiz adaptativo
- ✅ Material didático abrangente
- ✅ Importação de programas CSV/TXT
- ✅ Animações em tempo real
- ✅ Controles de execução (passo/automático)
- ✅ Editor de memória interativo
- ✅ Página da equipe e informações

##### 🏗️ Arquitetura
- ✅ HTML5 semântico e acessível
- ✅ CSS3 com Grid e Flexbox
- ✅ JavaScript ES6+ vanilla
- ✅ Design responsivo
- ✅ Performance otimizada

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
