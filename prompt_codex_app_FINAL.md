# PROMPT FINAL PARA O CODEX — REVIGGO

Você é um engenheiro de software sênior e designer de produto. Construa um PWA mobile-first funcional para usuários reais usando **exclusivamente** o conteúdo dos arquivos `receitas_300.json` e `plano_21_dias.json` deste pacote.

## Identidade do produto — NÃO ALTERAR

- **Nome do aplicativo:** Reviggo
- **Nome do protocolo:** Protocolo Corpo Revigorado
- **Subtítulo oficial:** **300 receitas para você que não aguenta mais conviver com dores e quer voltar a ter energia e liberdade.**

### Hierarquia de marca
Use **Reviggo** como marca principal do aplicativo.
Use **Protocolo Corpo Revigorado** como o nome do programa de 21 dias dentro do Reviggo.
O subtítulo oficial deve aparecer em pontos de apresentação do produto, como onboarding/tela de boas-vindas, sem ser repetido em excesso durante a navegação.

No `manifest.webmanifest`, metadata, título da aplicação e textos de autenticação, use **Reviggo**.
Não renomeie o aplicativo, o protocolo ou o subtítulo.

## Objetivo
O produto é uma biblioteca organizada de **300 receitas** + um caminho guiado de 21 dias. O foco de valor percebido são as receitas. Praticidade, organização, lista de compras, substituições, favoritos, família, SOS e progresso existem para fazer o usuário realmente usar as receitas.

Não transforme o produto em curso, e-book ou app clínico.

## Público
Brasileiros 40+, 50+ e 60+. Priorize leitura fácil, navegação óbvia, botões grandes, poucos níveis de menu e linguagem simples.

## Stack
- React + TypeScript
- PWA
- Supabase para autenticação e persistência
- mobile-first obrigatório
- componentes acessíveis e alto contraste

## Primeiro acesso
1. Login/cadastro por e-mail.
2. Onboarding curto explicando que o usuário terá 300 receitas e um plano opcional de 21 dias.
3. Perguntar apenas preferências operacionais úteis: quantidade de pessoas, tempo disponível e alimentos que evita. Não criar diagnóstico.
4. Levar para a tela **Hoje**.

## Navegação inferior
1. Hoje
2. Receitas
3. 21 Dias
4. Favoritos
5. Mais

## Hoje
- `Dia X de 21` + barra de progresso.
- CTA principal: **VER MINHAS RECEITAS DE HOJE**.
- Cards para café, almoço, lanche opcional e jantar vindos de `plano_21_dias.json`.
- Missão curta do dia.
- Cada card abre a ficha real daquela receita.
- A pessoa pode marcar como feita ou trocar por outra da mesma categoria.
- Não bloquear a biblioteca se o usuário não quiser seguir o plano.

## Receitas
Exibir as 300 receitas de `receitas_300.json`. Não reescrever, resumir ou inventar receitas.

Busca + filtros por:
- 7 áreas de interesse;
- categoria;
- tempo;
- econômica;
- família;
- freezer;
- marmita;
- sem fogão;
- uma panela só;
- favoritos.

### As 7 áreas
- Dores e incômodos físicos
- Energia e disposição
- Sono e rotina noturna
- Intestino e digestão
- Peso e saciedade
- Circulação
- Memória e concentração

**Regra importante:** essas áreas são filtros editoriais de navegação. Nunca escrever que uma receita trata, cura, previne ou resolve qualquer uma dessas condições.

## Ficha da receita
Mostrar:
- imagem/placeholder consistente;
- nome;
- áreas e tags práticas;
- tempo, dificuldade, custo e porções;
- ingredientes com checkbox;
- preparo numerado;
- bloco **Por que esta receita está aqui?** usando exatamente o texto do JSON;
- substituições;
- modo família;
- freezer;
- reaproveitamento;
- favoritar;
- marcar como feita;
- trocar por outra receita da mesma categoria.

O aviso educacional deve aparecer de forma discreta no fim da ficha ou em um painel informativo, sem poluir a experiência.

## 21 Dias
- Dia 0: onboarding.
- Dias 1–7: Facilitar.
- Dias 8–14: Adaptar.
- Dias 15–21: Sustentar.
- Persistir dia atual, receitas feitas e missões concluídas.
- Permitir voltar a dias anteriores.
- Permitir trocar qualquer sugestão sem perder progresso.
- O plano deve usar exatamente os IDs presentes em `plano_21_dias.json`.

## Favoritos
Lista de receitas salvas, com os mesmos filtros da biblioteca quando útil.

## Mais
- Lista de compras
- Troca Fácil
- Cozinha SOS
- Modo Família
- Freezer
- Progresso
- Perfil

## Lista de compras
Criar uma visualização simples baseada nas receitas do plano da semana. Permitir marcar itens como comprados. Não inventar quantidades clínicas ou cálculos nutricionais.

## Tracker opcional
Salvar apenas acompanhamento não clínico:
- adesão diária;
- energia percebida 1–5;
- sono percebido 1–5;
- conforto após refeições 1–5;
- fome/saciedade 1–5;
- nota livre.

Nunca chamar de diagnóstico, score de saúde, inflamação ou percentual médico.

## Supabase
Crie tabelas para:
- profiles;
- recipe_favorites;
- recipe_completions;
- daily_progress;
- tracker_entries;
- user_settings.

As receitas podem ser carregadas do JSON inicialmente. Não é necessário criar painel administrativo agora.

No `profiles`, deixar `subscription_status` preparado para uso futuro. Criar `/upgrade` apenas como placeholder. Não implementar pagamento.

## UX/UI

### Aplicação da marca
- Na tela de abertura/login, destacar **Reviggo** como nome principal.
- Abaixo, apresentar **Protocolo Corpo Revigorado**.
- Usar o subtítulo oficial: **300 receitas para você que não aguenta mais conviver com dores e quer voltar a ter energia e liberdade.**
- Depois do onboarding, reduzir a presença do subtítulo para não poluir a experiência.
- Em telas internas, usar apenas **Reviggo** no cabeçalho quando necessário e tratar **Protocolo Corpo Revigorado** como o programa guiado de 21 dias.
- Não apresentar o produto como e-book. O produto principal é o aplicativo Reviggo.

- visual moderno, acolhedor e clean;
- sem aparência hospitalar;
- fonte grande e confortável;
- cards fáceis de tocar;
- uma ação principal clara por tela;
- mobile como prioridade absoluta;
- no desktop, apenas ampliar e organizar melhor, sem mudar o fluxo;
- evitar menus profundos;
- manter a tela de receita extremamente simples de escanear enquanto a pessoa cozinha.

## Regras finais
- NÃO invente receitas.
- NÃO altere ingredientes ou modo de preparo.
- NÃO invente benefícios médicos.
- NÃO criar personalização complexa diferente para cada usuário; todos têm acesso às 300 receitas.
- Os filtros servem apenas para a pessoa encontrar rapidamente receitas relacionadas ao interesse dela.
- Preserve os 300 registros e todos os IDs.
- Implemente fluxo funcional completo, não apenas mockups.
- Antes de finalizar, teste: cadastro/login → Hoje → receita → marcar como feita → favoritos → filtros → troca de receita → progresso → recarregar página e confirmar persistência.
