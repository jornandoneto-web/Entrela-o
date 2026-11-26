# P20 — Respostas às dúvidas da mentoria de 19/11

| Campo | Valor |
| --- | --- |
| Data | 2026-11-19 |
| Versão | v23 |
| Commit | [`1c18b32`](https://github.com/jornandoneto-web/Entrela-o/commit/1c18b32272cea2fedd901ba77541970682e06c8c) |
| Release | [v23](https://github.com/jornandoneto-web/Entrela-o/releases/tag/v23) |
| Situação | Parcial |
| Como foi verificado | Teste automático em banco novo e atualizado da v21. |

## Prompt original

Texto como foi enviado, sem correções.

**2026-11-19 11:14** (mensagem)

```text
2 sim
3 sim 
4 as possiveis bastam
5 pode deixar assim
6 sim, deixe
```

**2026-11-19 11:20** (mensagem)

```text
publicou ?
```

**2026-11-19 11:22** (mensagem)

```text
ficou alguma duvida ?
```

## Resultado

Do CHANGELOG:

### v23 — Respostas da mentoria de 19/11/2026
- A escola de destino escolhe a turma do aluno transferido dentro da rede. Depois do deferimento, o aluno aparece em "Chegando por transferência", na tela Pedidos de transferência da escola de destino. Ela escolhe uma turma da mesma série e do mesmo ano letivo, com as vagas livres de cada uma, ou a fila de espera.
- Dados de exemplo: Renata Moura, André Siqueira e Patrícia Lemos passam a ter horas livres para lotar. Marina Costa e Juliana Freitas continuam sem saldo, para mostrar o aviso.
- Confirmadas e registradas no README as regras da integração, das situações de notas externas e da edição de Pessoas.
- Migração para a versão 14 dos dados.

## Observações e pendências

As respostas numeradas respondem às dúvidas listadas pela IA no fim da v22: (2) a escola de destino deve escolher a turma do aluno transferido? Sim. (3) Na transferência para escola da rede que usa outro sistema, o aluno sai como Transferido e a vaga é descontada no destino: está certo? Sim. (4) As situações das notas externas (Aprovado, Reprovado, Transferido) bastam? Sim. (5) O cadastro de Pessoas fica só com o Secretário? Pode deixar assim. (6) Dar horas livres a professores de exemplo para a demonstração? Sim. A dúvida 1 ficou sem resposta: a transferência fica Concluída ao emitir o histórico ou ao matricular no destino?

## Arquivos alterados

Diferença entre v22 e v23.

| Arquivo | Mudança |
| --- | --- |
| `CHANGELOG.md` | alterado |
| `README.md` | alterado |
| `index.html` | alterado |
| `migracoes-v14.js` | novo |
| `migracoes.js` | alterado |
| `services/transferenciaService.js` | alterado |
| `telas/transferencia.js` | alterado |
