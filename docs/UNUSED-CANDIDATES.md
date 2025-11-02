# Candidatos a Limpeza (Não Referenciados)

Este documento lista arquivos que não foram encontrados em uso nas páginas HTML do projeto (busca por referências diretas). Revise antes de remover definitivamente.

## CSS
- `assets/css/style.css`
  - Não referenciado pelos HTMLs atuais.

## JavaScript
- `assets/js/config.js`
  - Não encontrado em `<script src="...">`.
- `assets/js/fig-10-10.js`
  - Era usado para a figura 10-10 interativa; atualmente a seção 4.4 usa imagem estática.

## Observações Importantes
- Pastas `kenney_*` contêm ícones/sons utilizados nos menus e efeitos — manter.
- Imagens em `assets/img/` são usadas em várias páginas; evite remover sem checar o HTML correspondente.
- Antes de excluir, use uma busca global para garantir que o arquivo não é carregado dinamicamente.

## Próximos Passos Sugeridos
1. Mover os arquivos acima para `rascunho/_unused/` por um período de observação.
2. Se não houver regressões após testes, remover definitivamente.
3. Atualizar `docs/FILES.md` e este arquivo após a limpeza.
