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
| `mock/` | Dados simulados (Diretorias Regionais de Sergipe, cursos, matriz de exemplo) |
| `services/` | Serviços assíncronos (listar, buscarPorId, salvar, atualizar, remover) que simulam o back-end |
| `telas/` | Escolas, Infraestrutura, Matrizes, Professor, Lotações e telas dos perfis da Secretaria |
| `app.js` | Núcleo: perfis e permissões, acessibilidade, navegação, formulários e cadastros genéricos |
| `pages.js`, `rede.js`, `professores.js`, `estoque.js`, `transporte.js` | Telas e módulos das versões anteriores |
| `migracoes.js`, `migracoes-v9.js` | Migrações dos dados salvos de uma versão para a outra |

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

## Pendências conhecidas

- A lista de municípios das DREs 1 a 10 está em `mock/sergipe.js` e precisa ser confirmada com a SEDUC. Só a DEA (Aracaju) está confirmada.
- Algumas telas antigas ainda leem os dados direto do armazenamento, sem passar pelos serviços.
- Os dados ficam só no navegador. Para que sejam compartilhados entre usuários, é preciso um back-end.
