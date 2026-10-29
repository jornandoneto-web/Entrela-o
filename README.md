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
| Secretaria de Educação | Secretário, DED, RH, DAE, Diretoria Regional |
| Transporte | Motorista |

## Organização do código

| Pasta ou arquivo | Conteúdo |
|---|---|
| `index.html` | Estilos (design system Entrelaço) e carregamento dos scripts |
| `models/` | Modelos de dados: Escola, DiretoriaRegional, Municipio, Curso, Matriz, Serie, ComponenteCurricular, InfraestruturaEscola, Pessoa, Professor, Dependente, Vinculo, Formacao, Lotacao |
| `mock/` | Dados simulados (Diretorias Regionais de Sergipe, cursos, matriz de exemplo, dados de exemplo da rede) |
| `services/` | Serviços assíncronos (listar, buscarPorId, salvar, atualizar, remover) que simulam o back-end. O `dadosService` carrega os dados de cada tela pelos serviços e envia de volta só o que mudou |
| `telas/` | Escolas, Infraestrutura, Matrizes, Professor, Lotações e telas dos perfis da Secretaria |
| `app.js` | Núcleo: perfis e permissões, acessibilidade, navegação, formulários e cadastros genéricos |
| `pages.js`, `rede.js`, `professores.js`, `estoque.js`, `transporte.js` | Telas e módulos das versões anteriores |
| `migracoes.js`, `migracoes-v9.js` | Migrações dos dados salvos de uma versão para a outra |

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
- **Unidades de carga horária:** a carga do vínculo do professor é semanal (padrão 25 h, integral 40 h). A carga dos componentes na matriz curricular é anual (ex.: Matemática, 80 h).
- **Lotações:** a soma das horas das lotações ativas de um vínculo não pode passar a carga horária desse vínculo. A data de fim da lotação é a data de saída: nesse dia as horas já ficam livres.

## Pendências conhecidas

- A lista de municípios das DREs 1 a 10 está em `mock/sergipe.js` e precisa ser confirmada com a SEDUC. Só a DEA (Aracaju) está confirmada.
- A definir: uma lotação pode durar além da data de fim do vínculo? Hoje o sistema só bloqueia a lotação que começa depois que o vínculo termina.
- Os dados ficam só no navegador. Para que sejam compartilhados entre usuários, é preciso um back-end.
