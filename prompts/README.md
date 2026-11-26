# Repositório de prompts

Esta pasta guarda os prompts enviados à IA (Claude Code) no desenvolvimento do Entrelaço. Cada prompt fica ligado à versão que o atendeu, ao commit, aos arquivos alterados e a como o resultado foi verificado.

Comece pela [matriz de rastreabilidade](RASTREABILIDADE.md): ela lista todos os prompts numa tabela e as pendências em aberto.

## Como cada arquivo está organizado

Um arquivo por prompt, com o nome `Pnn-assunto.md`:

| Seção | O que contém |
| --- | --- |
| Cabeçalho | Data, versão, commit e release no GitHub, situação e como foi verificado |
| Prompt original | O texto exato que foi enviado, com data e hora, inclusive as mensagens de acompanhamento ("publicou?", respostas às dúvidas) |
| Resultado | O que mudou, copiado do CHANGELOG da versão |
| Observações e pendências | Decisões de regra de negócio, respostas do mentor e o que ficou em aberto |
| Arquivos alterados | Cada arquivo novo, alterado ou removido na versão, tirado do Git |

## Situações

| Situação | Significado |
| --- | --- |
| Atendido | Tudo o que o prompt pediu foi feito e verificado |
| Parcial | Parte foi feita; o que falta está em "Observações e pendências" |
| Substituído | Um prompt posterior mudou o que este pediu |
| Em andamento | Ainda em execução |

## Limites do registro

- As versões v1 a v15 vêm de antes do uso do Git. Elas têm o prompt e o resultado, mas não têm commit nem a lista de arquivos.
- O texto do prompt da mentoria de 12/11/2026 (v21) foi trabalhado fora da sessão registrada aqui e precisa ser anexado ao P18.
- Mensagens enviadas enquanto a IA trabalhava aparecem marcadas como "enviada durante a tarefa".

## Como registrar um prompt novo

1. Crie `Pnn-assunto.md` com o próximo número e copie as seções de um arquivo existente.
2. Cole o prompt exatamente como foi enviado, sem corrigir.
3. Depois do commit, preencha a versão, o commit, a release e os arquivos alterados (`git diff --name-status <versão anterior> <versão nova>`).
4. Acrescente uma linha na matriz de rastreabilidade e, se houver, as pendências.
