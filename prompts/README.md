# Repositório de prompts

Esta pasta registra como o Entrelaço foi desenvolvido. A equipe conduziu o projeto: definiu o produto, trouxe os requisitos das mentorias, tomou as decisões de regra de negócio e revisou cada entrega. A IA (Claude Code) atuou como assistente de desenvolvimento: escreveu o código a partir das instruções da equipe, testou e publicou.

Cada prompt fica ligado à versão que o atendeu, ao commit, aos arquivos alterados e a como o resultado foi verificado.

## Papéis

| Quem | O que fez | Onde aparece |
| --- | --- | --- |
| Equipe | Design system no Figma (cores, tipografia, componentes), usado como base desde o primeiro prompt | P01, P04, P12 |
| Equipe | Requisitos e prioridades de cada versão, a partir das mentorias | P13, P16, P18, P19, P21 |
| Equipe | Decisões de regra de negócio quando havia dúvida (diretor, carga horária, transferência, notas externas) | P13, P20 |
| Equipe | Revisão das entregas e pedidos de correção, com prints e testes nas telas | P03, P06, P07, P17 |
| Equipe | Preferências de produto: sem badges, modo claro, sem financeiro, listas no lugar de texto, linguagem "deficiente visual" | P02, P04, P15 |
| Equipe | Publicação, repositório no GitHub e integração do trabalho de outra integrante (mudança de cores) | P14, P18 |
| IA (Claude Code) | Escrita do código, das migrações de dados e dos testes automáticos | Todos os prompts de implementação |
| IA (Claude Code) | Levantamento de dúvidas de regra de negócio para a equipe decidir | P19, P21 |
| IA (Claude Code) | Execução técnica da publicação (Vercel, GitHub, releases) | P14 em diante |

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
- Datas e horários estão no horário de Brasília (UTC-3). O histórico original grava em UTC.
- Nos prompts P01 a P12, a versão foi deduzida pela ordem do CHANGELOG e vem marcada com * na matriz. O campo "Como foi verificado" diz só o que o histórico registra: execuções no navegador sem janela, ou "Não registrado".

## Como registrar um prompt novo

1. Crie `Pnn-assunto.md` com o próximo número e copie as seções de um arquivo existente.
2. Cole o prompt exatamente como foi enviado, sem corrigir.
3. Depois do commit, preencha a versão, o commit, a release e os arquivos alterados (`git diff --name-status <versão anterior> <versão nova>`).
4. Acrescente uma linha na matriz de rastreabilidade e, se houver, as pendências.
