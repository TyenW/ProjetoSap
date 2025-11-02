# Documentação de Arquivos (ProjetoSap)

Este documento lista e descreve todos os arquivos HTML, CSS e JS do projeto, além de dados e recursos. Inclui mapeamento de dependências e candidatos a limpeza segura.

Observação: Este inventário foi gerado a partir do estado atual do repositório. Caso novos arquivos sejam adicionados, atualize este documento.

---

## Páginas HTML

- `index.html`
  - Página principal do emulador SAP‑1.
  - Depende de CSS: `assets/css/base.css`, `assets/css/emular.css`, `assets/css/footer.css`.
  - Depende de JS: `assets/js/media-opt.js`, `assets/js/bg-anim.js`, `assets/js/audio-menu.js`, `assets/js/nav.js`, `assets/js/core/memory-store.js`, `assets/js/core/assembler-core.js`, `assets/js/core/emulator-core.js`, `assets/js/script.js`, `assets/js/oqesap.js`, `assets/js/carrosel.js`.
  - Usa Web Workers: `assets/js/workers/emulator.worker.js`, `assets/js/workers/assembler.worker.js`.

- `home.html`
  - Página de boas-vindas/landing.
  - Depende de CSS: `assets/css/base.css`, `assets/css/footer.css`, `assets/css/home.css`.
  - Depende de JS: `assets/js/media-opt.js`, `assets/js/bg-anim.js`, `assets/js/audio-menu.js`, `assets/js/nav.js`, `assets/js/oqesap.js`.

- `oqueesap.html`
  - Material didático SAP‑1 (figuras, simulações e vídeos).
  - Depende de CSS: `assets/css/base.css`, `assets/css/footer.css`, `assets/css/oqueesap.css`.
  - Depende de JS: `assets/js/media-opt.js`, `assets/js/bg-anim.js`, `assets/js/audio-menu.js`, `assets/js/fig-10-2.js`, `assets/js/fig-10-16.js`, `assets/js/nav.js`.

- `quiz.html`
  - Sistema de quiz e gamificação.
  - Depende de CSS: `assets/css/base.css`, `assets/css/footer.css`, `assets/css/quiz.css`.
  - Depende de JS: `assets/js/media-opt.js`, `assets/js/bg-anim.js`, `assets/js/audio-menu.js`, `assets/js/nav.js`, `assets/js/quiz.js`, `assets/js/oqesap.js`.

- `equipesap.html`
  - Sobre o projeto/autor e contatos.
  - Depende de CSS: `assets/css/base.css`, `assets/css/oqueesap.css`, `assets/css/equipe.css`, `assets/css/footer.css`.
  - Depende de JS: `assets/js/media-opt.js`, `assets/js/bg-anim.js`, `assets/js/audio-menu.js`, `assets/js/nav.js`.

- `demo-bitlab.html`, `privacy.html`, `terms.html`
  - Páginas auxiliares/estáticas.
  - CSS/JS padrão conforme cabeçalho de cada arquivo.

---

## CSS (assets/css)

- `base.css`
  - Reset/variáveis e estilos globais compartilhados (tema neon/glass).
- `footer.css`
  - Estilos do rodapé (grid de colunas, crédito e base).
- `home.css`
  - Estilos específicos da home/landing page.
- `oqueesap.css`
  - Estilos do material didático, incluindo:
  - Fig. 10‑2 (contador em anel), Fig. 10‑16 (controle microprogramado) e elementos de imagem/vídeo.
- `equipe.css`
  - Estilos da página de equipe/autor (cards, links sociais, avatar).
- `quiz.css`
  - Layout e estilos do quiz (status, perguntas, opções, conquistas, leaderboard).
- `emular.css`
  - Estilos do emulador SAP‑1 (componentes, painéis, animações do barramento W, responsividade).
- `style.css` — CANDIDATO A LIMPEZA
  - Não referenciado diretamente por nenhuma página no estado atual.

---

## JavaScript (assets/js)

- `media-opt.js`
  - Otimizações de mídia (adiamento de carregamento, preferências, muting inicial controlado por UI).
- `bg-anim.js`
  - Animação de fundo (partículas ciano/menta com conexões, sensível ao mouse; pausa com `prefers-reduced-motion` e ao ocultar a aba).
- `audio-menu.js`
  - Popover de áudio global (mudo/volume) e integração com elementos `<audio>`.
- `nav.js`
  - Menu responsivo (toggle, aria-expanded) e interação da navegação superior.
- `oqesap.js`
  - Utilidades compartilhadas para páginas de conteúdo (ancoras, mini menu, etc.).
- `script.js`
  - Lógica principal do emulador (UI + orquestração); instancia Web Workers; integra com `core/`.
- `carrosel.js`
  - Animações/efeitos visuais auxiliar(es) usados na `index.html`.
- `quiz.js`
  - Lógica do quiz (perguntas de JSON, status, conquistas, placar e export).
- `fig-10-2.js`
  - Simulação interativa do contador em anel (FF1..FF6) gerando T1..T6.
- `fig-10-16.js`
  - Simulação do controle microprogramado com log (ROM endereço → contador → ROM controle).
- `fig-10-10.js` — CANDIDATO A LIMPEZA
  - Interativo para Fig. 10‑10 (scrubber); atualmente não referenciado.
- `config.js` — CANDIDATO A LIMPEZA
  - Não referenciado no estado atual (quiz usa dados do JSON diretamente ou fallback interno).

### Núcleo e Workers

- `core/memory-store.js`
  - Armazenamento de estado/ memória do emulador.
- `core/assembler-core.js`
  - Montagem/tradução entre assembly ↔ bytes.
- `core/emulator-core.js`
  - Núcleo de simulação do SAP‑1 (execução, T‑states, operações, etc.).
- `workers/assembler.worker.js`
  - Worker para montagem (importa `core/assembler-core.js`).
- `workers/emulator.worker.js`
  - Worker do emulador (importa `core/emulator-core.js`).

---

## Dados (assets/data)

- `questions.json`
  - Banco de perguntas do quiz (usado por `quiz.js`).
- `achievements.json`
  - Definições de conquistas do quiz (usado por `quiz.js`).
- `leaderboard.json`
  - Opcional; pode ser usado como seed/local para pontuações (se ativado pelo frontend).

---

## Imagens e Áudio (assets/img, assets/audio)

- `assets/img/` — logos, ícones, diagramas, e subpastas:
  - `equipe/` — fotos/avatars da equipe.
  - `setas/` — ícones diversos.
  - `w/` — imagens de exemplo (sequências ilustrativas).
  - Diversos (ex.: `Ciclo-de-Instrução.png`, `SAP1_Arq-1.png`).
- `assets/audio/` — música de fundo e SFX do quiz.
- `kenney_*` — pacotes de ícones e sons com licenças (mantidos e referenciados nas páginas; não remover).

---

## Candidatos a Limpeza (não referenciados)

- CSS:
  - `assets/css/style.css`
- JS:
  - `assets/js/config.js`
  - `assets/js/fig-10-10.js`

Recomendação: mover para `rascunho/_unused/` (ou remover) após confirmação final. Ícones e mídias de fornecedores (pasta `kenney_*`) são utilizados por imagens do menu; manter.

---

## Notas de Manutenção

- Ao adicionar novos arquivos, inclua-os em suas páginas e atualize este `docs/FILES.md`.
- Use `defer` em `<script>` sempre que possível.
- Prefira classes BEM e variáveis CSS definidas em `base.css`.
- Para remover arquivos: procure por referências com uma busca global antes de excluir.

