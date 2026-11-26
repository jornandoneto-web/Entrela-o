# P15 — Listas no lugar de texto digitado

| Campo | Valor |
| --- | --- |
| Data | 2026-10-29 |
| Versão | v18 |
| Commit | [`daec05e`](https://github.com/jornandoneto-web/Entrela-o/commit/daec05eaf54faca6774bc618ec24ee7f96fedfbb) |
| Release | [v18](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v18) |
| Situação | Atendido |
| Como foi verificado | Teste automático das telas. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-10-29 22:51** (mensagem)

```text
Tudo que puder colocar em lista ao inves da pessoa digitar, altere
Ex: Cidade, Estado
```

**2026-10-29 22:55** (mensagem)

```text
publicou ?
```

## Resultado

Do CHANGELOG:

### v18 — Listas no lugar de texto digitado
- Estado e cidade em lista: ao escolher o estado, a cidade mostra só os municípios dele. Sergipe vem completo (75 municípios); os outros estados vêm da API do IBGE e, se ela não responder, o campo volta a aceitar texto.
- Cadastro de professor: naturalidade e endereço com estado e cidade em lista; cargo e órgão de origem (cedidos) em lista.
- Novo padrão "lista com Outro…": quando a resposta não está na lista, abre um campo para digitar.
- Também viraram lista: "Para quem" do evento, "Assinado por" do comunicado, restrição alimentar do aluno, sala da turma, motorista da rota, processo seletivo do banco de talentos, componente curricular da matriz, motivo da transferência e motivo da ausência no transporte.
- Tipos de laboratório da infraestrutura em caixas de marcar.
- Novo `services/municipioService.js`.

## Observações e pendências

Este pedido criou o atalho L, que quebrou o mapa do transporte (ver P16 e o relatório de prompts, caso 4).

## Arquivos alterados

Diferença entre v17 e v18.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `app.js` | alterado |
| `index.html` | alterado |
| `pages.js` | alterado |
| `professores.js` | alterado |
| `rede.js` | alterado |
| `services/municipioService.js` | novo |
| `telas/infraestrutura.js` | alterado |
| `telas/matrizes.js` | alterado |
| `telas/professor.js` | alterado |
| `transporte.js` | alterado |
