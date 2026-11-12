# Entrelaço — portal da rede pública de ensino

Protótipo funcional de um portal escolar para a rede estadual. Ele atende a secretaria, a direção, os professores, os alunos, as famílias e os departamentos da Secretaria de Educação.

Versão publicada: https://portal-entrelaco.vercel.app

## Como rodar

Não precisa instalar nada. Abra o `index.html` no navegador.
Os dados de exemplo são criados no primeiro acesso e ficam salvos no próprio navegador (localStorage).
Para voltar ao início, use "Restaurar dados de exemplo" na tela de entrada.

Na tela de entrada você escolhe o perfil e a pessoa. No protótipo não há senha.

| Grupo | Perfis |
|---|---|
| Escola | Secretaria escolar, Diretor, Professor |
| Estudantes e famílias | Aluno, Responsável |
| Secretaria de Educação | Secretário (SEDUC), DED, RH, DAE, Calendário escolar, Diretoria Regional |
| Transporte | Motorista |

## Organização do código

| Pasta ou arquivo | Conteúdo |
|---|---|
| `index.html` | Estilos (design system Entrelaço) e carregamento dos scripts |
| `models/` | Modelos de dados: Escola, DiretoriaRegional, Municipio, Curso, Matriz, Serie, ComponenteCurricular, InfraestruturaEscola, Pessoa, Professor, Dependente, Vinculo, Formacao, Lotacao, AnoLetivo, Turma |
| `mock/` | Dados simulados (Diretorias Regionais de Sergipe, cursos, matriz de exemplo, dados de exemplo da rede) |
| `services/` | Serviços assíncronos (listar, buscarPorId, salvar, atualizar, remover) que simulam o back-end. O `dadosService` carrega os dados de cada tela pelos serviços e envia de volta só o que mudou |
| `telas/` | Escolas, Infraestrutura, Matrizes, Professor, Lotações, Turmas, Fechamento do ano e Rematrícula, e telas dos perfis da Secretaria |
| `app.js` | Núcleo: perfis e permissões, acessibilidade, navegação, formulários e cadastros genéricos |
| `pages.js`, `rede.js`, `professores.js`, `estoque.js`, `transporte.js` | Telas e módulos das versões anteriores |
| `migracoes.js`, `migracoes-v9.js`, `migracoes-v11.js`, `migracoes-v12.js` | Migrações dos dados salvos de uma versão para a outra |

### Como os dados circulam

1. `ARMAZEM` faz o papel do banco de dados do back-end simulado. Só os serviços (`services/`) e as migrações mexem nele.
2. Antes de cada tela abrir, o `dadosService.carregar()` pede os dados aos serviços e entrega uma cópia em `DADOS`.
3. A tela lê e altera só `DADOS`. Ao salvar, o `dadosService.gravar()` envia cada registro novo, alterado ou removido ao serviço da coleção, que valida e grava.

Para ligar a um back-end real, troque a implementação de `services/base.js` (e dos serviços específicos) por chamadas à API. As telas não precisam mudar.

## Acessibilidade

O portal oferece:
- leitura em voz alta
- alto contraste
- tamanho de texto ajustável
- fonte de alta legibilidade
- espaçamento ampliado
- guia de leitura e cursor grande
- comandos de voz
- navegação completa por teclado

## Regras de negócio confirmadas

- **Diretor da escola:** pode ser qualquer pessoa cadastrada no sistema, não precisa ter vínculo de servidor.
- **Grade e matriz:** aulas por semana = carga anual da matriz ÷ 40 semanas letivas (valor em configuração, a confirmar).
- **Unidades de carga horária:** a carga do vínculo do professor é semanal (padrão 25 h, integral 40 h). A carga dos componentes na matriz curricular é anual (ex.: Matemática, 80 h).
- **Secretaria de Educação × Secretaria escolar:** a Secretaria de Estado da Educação (SEDUC, perfil Secretário) reúne todas as escolas da rede e é a única que cadastra escolas. A Secretaria escolar é a secretaria de cada escola: cadastra turmas, horários e alunos da sua escola.
- **Ano letivo:** cada escola tem um único ano ativo. O ano escolhido no topo vale para turmas, alunos, horários, notas e diário. Num ano encerrado tudo fica só para consulta.
- **Turma:** o nome é a série da matriz mais o identificador ("1º ano" + "B" = "1º ano B"). Não pode haver duas turmas com a mesma série, identificador e ano letivo na mesma escola.
- **Notas:** de 0 a 10, com até uma casa decimal, salvas por bimestre. Média do componente = média aritmética dos bimestres lançados.
- **Atendimento especializado:** nas telas do professor aparece só um sinal neutro (estrela roxa). O diagnóstico fica no cadastro do aluno, visível só para a Secretaria escolar.
- **Fechamento:** a turma só é finalizada quando, em todos os componentes da série, as aulas salvas no diário chegam à carga anual da matriz (1 aula = 1 hora). Aprovado com média final de pelo menos 6,0 em cada componente e frequência de pelo menos 75% (os dois valores ficam em Configurações). O ano é encerrado quando todas as turmas estão finalizadas.
- **Rematrícula:** aprovado vai para a série seguinte do mesmo curso no ano seguinte; reprovado repete a série; aprovado na última série fica com o curso concluído. A turma de destino precisa ter vaga.
- **Lotações:** a soma das horas das lotações ativas de um vínculo não pode passar a carga horária desse vínculo. A data de fim da lotação é a data de saída: nesse dia as horas já ficam livres.

## Listas gerenciáveis

Toda opção de select ou caixa de marcar vem de um cadastro. As listas ficam em `mock/listas.js` como valores iniciais e são editadas em Cadastros auxiliares, no menu do perfil responsável.

Ficam fixos só os valores que são regra interna do sistema: dias da semana, UFs, Sim/Não, etapas de fluxo (situação de pedidos e candidatos), formas de publicar vagas e perfis de acesso.

## Pendências conhecidas

- Componente sem nenhuma nota não entra na média final do aluno no fechamento. Confirmar com a mentoria se deveria bloquear a finalização.
- O mapa do transporte não abre desde a v19: o atalho `L` das listas gerenciáveis (`app.js`) tem o mesmo nome da biblioteca de mapas (Leaflet).
- A associação de DR1 a DR10 com os municípios está em `mock/sergipe.js` e precisa ser conferida com o painel da SEDUC. Só a DEA (Aracaju) está confirmada.
- A sigla do departamento do calendário escolar precisa ser confirmada (nome provisório: Calendário escolar).
- A definir: uma lotação pode durar além da data de fim do vínculo? Hoje o sistema só bloqueia a lotação que começa depois que o vínculo termina.
- Os dados ficam só no navegador. Para que sejam compartilhados entre usuários, é preciso um back-end.
