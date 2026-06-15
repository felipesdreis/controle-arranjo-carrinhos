# Migração para Supabase — User Stories

**Projeto**: Controle de Arranjo de Carrinhos
**Data de criação**: 2026-06-12
**Contexto**: Migração de SQLite (sql.js + OPFS) para Supabase PostgreSQL com autenticação, RLS e multi-tenancy.

---

## Épicos

| ID | Título | Descrição |
|---|---|---|
| EP-01 | Infraestrutura Supabase | Setup do client Supabase, variáveis de ambiente, tipagem TypeScript |
| EP-02 | Autenticação | Sign-up, sign-in, sign-out, proteção de rotas, sessão persistente |
| EP-03 | Schema PostgreSQL no Supabase | DDL PostgreSQL, tabela user_settings, isolamento por user_id |
| EP-04 | Camada de API | CRUD functions por entidade usando Supabase client |
| EP-05 | Migração do Store (Zustand) | Atualizar useAppStore para operações async com tratamento de erros |
| EP-06 | Migração de Pages/Componentes | Adaptar interface para loading states, error handling, async/await |
| EP-07 | Backup e Importação de Dados | Exportar/importar JSON, migração de dados históricos |
| EP-08 | Remoção de sql.js e OPFS | Limpeza de dependências obsoletas e código morto |
| EP-09 | Controle de Acesso (Aprovação e Roles) | Aprovação manual de usuários, roles (admin/user), autorização por role, RLS policies baseadas em roles |

---

# EP-01 — Infraestrutura Supabase

## US-01 — Criar cliente Supabase centralizado

**Épico**: EP-01 — Infraestrutura Supabase
**Como** desenvolvedor, **quero** um cliente Supabase único e reutilizável, **para que** toda a aplicação acesse Supabase de forma consistente.

**Critérios de Aceite**:
```gherkin
Feature: Cliente Supabase centralizado

  Scenario: Cliente é inicializado com credenciais de variáveis de ambiente
    Given que as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas
    When o módulo src/api/client.js é importado
    Then uma instância de SupabaseClient é exportada com auth, storage e métodos de query

  Scenario: Cliente está disponível globalmente para todas as funções de API
    Given que o cliente existe em src/api/client.js
    When qualquer função de API em src/api/* é importada
    Then ela possui acesso ao cliente via import centralizado
```

**Notas técnicas**:
- Arquivo a criar: `src/api/client.js` — export único, sem singleton pattern (import sempre cria nova referência com mesmo config)
- Usar `createClient(url, anonKey)` do pacote `@supabase/supabase-js`
- Variáveis de ambiente: `VITE_SUPABASE_URL` (string), `VITE_SUPABASE_ANON_KEY` (string)
- Criar arquivo `.env.example` com placeholders
- Sem autenticação ativa neste estágio (será adicionada em EP-02)

**Depende de**: Nenhuma

---

## US-02 — Adicionar tipagem TypeScript para Supabase

**Épico**: EP-01 — Infraestrutura Supabase
**Como** desenvolvedor TypeScript, **quero** tipos gerados automaticamente do schema Supabase, **para que** tenha autocomplete e type safety.

**Critérios de Aceite**:
```gherkin
Feature: Tipagem TypeScript sincronizada com Supabase

  Scenario: Tipos são gerados a partir do schema do Supabase
    Given que o projeto tem @supabase/supabase-js instalado
    When rodo npx supabase gen types typescript > src/types/supabase.ts
    Then arquivo src/types/supabase.ts é criado com types de todas as tabelas

  Scenario: Componentes e funções de API usam tipos Supabase
    Given que os tipos estão em src/types/supabase.ts
    When importo tipos em src/api/* e components/*
    Then TypeScript resolve automaticamente campos de tipos Database, Tables, etc.
```

**Notas técnicas**:
- Instalar CLI Supabase: `npm install -D supabase`
- Arquivo: `src/types/supabase.ts` — gerado automaticamente, commitado no git
- No cliente, usar: `SupabaseClient<Database>` para tipagem completa
- Arquivo: `src/api/client.ts` (renomear de .js para .ts) com tipagem genérica
- Atualizar `tsconfig.json` se necessário para resolver paths de tipos

**Depende de**: US-01

---

## US-03 — Validar configuração de ambiente e conectividade Supabase

**Épico**: EP-01 — Infraestrutura Supabase
**Como** desenvolvedor, **quero** um health check na inicialização da aplicação, **para que** detecte erros de configuração antes de tentar operações.

**Critérios de Aceite**:
```gherkin
Feature: Validação de conectividade Supabase

  Scenario: Erro de variáveis de ambiente é detectado na inicialização
    Given que VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas
    When a aplicação inicia (App.jsx monta)
    Then exibe mensagem de erro clara: "Variáveis de ambiente Supabase não configuradas"
    And a aplicação não tenta conectar ao banco

  Scenario: Aplicação valida conexão com Supabase no startup
    Given que as variáveis estão definidas corretamente
    When App.jsx monta e efetua um fetch simples (ex: SELECT 1)
    Then se falhar, exibe erro na console e notifica usuário
    And se suceder, continua inicialização normal
```

**Notas técnicas**:
- Criar função `validateSupabaseConfig()` em `src/api/client.js`
- Usar `supabase.from('brothers').select('count', { count: 'exact' }).limit(0)` como health check (query leve)
- Não bloquear renderização, apenas avisar no console e localStorage (flag de erro)
- Lugar para chamar: dentro de useEffect no componente raiz `<App>` ou em `main.jsx` antes de ReactDOM.render

**Depende de**: US-01, US-02

---

# EP-02 — Autenticação

## US-04 — Implementar Sign-Up com email e senha

**Épico**: EP-02 — Autenticação
**Como** usuário novo, **quero** me registrar com email e senha, **para que** crie uma conta e acesse a aplicação.

**Critérios de Aceite**:
```gherkin
Feature: Registro de novo usuário

  Scenario: Usuário preenche e submete formulário de Sign-Up
    Given que estou na página de autenticação
    When preencho email, senha e confirmação de senha
    And clico em "Criar Conta"
    Then supabase.auth.signUp é chamado com { email, password }
    And se sucesso, usuário é redirecionado para /dashboard
    And sessão é criada automaticamente

  Scenario: Validação de email inválido é rejeitada
    Given que estou no formulário de Sign-Up
    When digito email inválido (ex: "notanemail")
    And clico em "Criar Conta"
    Then mensagem de erro é exibida: "Email inválido"
    And não há chamada HTTP para Supabase

  Scenario: Senhas não correspondentes são rejeitadas
    Given que preenchí email e duas senhas diferentes
    When clico em "Criar Conta"
    Then mensagem de erro é exibida: "Senhas não correspondem"
    And não há chamada HTTP para Supabase

  Scenario: Email já registrado exibe mensagem amigável
    Given que o email já existe no Supabase
    When submeto o formulário
    Then mensagem de erro é exibida: "Este email já está registrado"
    And sugestão para fazer login é oferecida
```

**Notas técnicas**:
- Arquivo a criar: `src/pages/Auth/SignUp.jsx` (componente novo)
- Usar `supabase.auth.signUp({ email, password })` do cliente
- Após sucesso, armazenar session em contexto/Zustand ou usar `supabase.auth.getSession()`
- Validação frontend: regex para email, comprimento mínimo de senha (8 caracteres)
- Redirect: usar React Router `navigate('/dashboard')` após autenticação bem-sucedida
- Tratamento de erro: `auth.signUp()` lança exceção com `error.message`

**Depende de**: US-01, US-02, US-05 (proteção de rotas)

---

## US-05 — Implementar Sign-In com email e senha

**Épico**: EP-02 — Autenticação
**Como** usuário registrado, **quero** fazer login com email e senha, **para que** acesse minha conta e dados.

**Critérios de Aceite**:
```gherkin
Feature: Login de usuário

  Scenario: Usuário faz login com credenciais válidas
    Given que estou na página de login
    When preencho email e senha corretos
    And clico em "Entrar"
    Then supabase.auth.signInWithPassword é chamado
    And sessão é criada
    And sou redirecionado para /dashboard

  Scenario: Email ou senha incorretos são rejeitados
    Given que insiro credenciais inválidas
    When clico em "Entrar"
    Then mensagem de erro é exibida: "Email ou senha incorretos"
    And permaneço na página de login

  Scenario: Email não registrado exibe mensagem clara
    Given que preencho um email que não existe
    When clico em "Entrar"
    Then mensagem de erro é exibida: "Email ou senha incorretos"
    And nenhuma informação que o email não existe é revelada (segurança)
```

**Notas técnicas**:
- Arquivo a criar: `src/pages/Auth/SignIn.jsx` (componente novo)
- Usar `supabase.auth.signInWithPassword({ email, password })`
- Lógica similar a US-04, mas sem validação de confirmação de senha
- Após login bem-sucedido, session é armazenada automaticamente (pode ser recuperada com `getSession()`)
- Tratamento de erro: `auth.signInWithPassword()` lança `AuthError` com `error.message`

**Depende de**: US-01, US-02

---

## US-06 — Implementar Sign-Out (logout)

**Épico**: EP-02 — Autenticação
**Como** usuário autenticado, **quero** fazer logout, **para que** saio da minha conta e retorno à tela de login.

**Critérios de Aceite**:
```gherkin
Feature: Logout de usuário

  Scenario: Usuário clica em "Sair" no menu
    Given que estou autenticado e no /dashboard
    When clico em "Sair" no header/sidebar
    Then supabase.auth.signOut é chamado
    And sessão local é limpa
    And sou redirecionado para /auth (ou página de login)

  Scenario: Logout é bem-sucedido mesmo se houver erro de rede
    Given que clico em "Sair"
    When há erro na chamada signOut (ex: network timeout)
    Then sessão local é limpa mesmo assim (logout optimista)
    And usuário é redirecionado para /auth
    And nenhuma chamada HTTP adicional é feita
```

**Notas técnicas**:
- Função a adicionar: `handleSignOut()` no Header.jsx ou Layout.jsx
- Usar `supabase.auth.signOut()`
- Limpar qualquer estado Zustand/contexto local após logout
- Redirect: `navigate('/auth')` após sucesso
- Considerar logout optimista: limpar local + redirect imediatamente, ignorar erro de rede

**Depende de**: US-05

---

## US-07 — Restaurar sessão ao recarregar a página

**Épico**: EP-02 — Autenticação
**Como** usuário autenticado, **quero** que minha sessão seja mantida ao recarregar a página, **para que** não seja desconectado involuntariamente.

**Critérios de Aceite**:
```gherkin
Feature: Persistência de sessão

  Scenario: Sessão é restaurada ao carregar a aplicação
    Given que estou autenticado e logado
    When recarrego a página (F5 ou refresh)
    Then supabase.auth.getSession() é chamado automaticamente na inicialização
    And sessão é restaurada
    And usuário permanece no /dashboard sem ser redirecionado para /auth

  Scenario: Sessão expirada é detectada ao tentar operação
    Given que minha sessão expirou no backend
    When tento executar uma operação (ex: fetch de brothers)
    Then supabase detecta erro 401
    And usuário é redirecionado para /auth
    And mensagem clara é exibida: "Sessão expirada. Faça login novamente."

  Scenario: Token é atualizado automaticamente (refresh token)
    Given que tenho um refresh token válido
    When a sessão está próxima de expirar
    Then supabase atualiza o token automaticamente em background
    And operações continuam funcionando sem interrupção do usuário
```

**Notas técnicas**:
- Local para implementar: `App.jsx` ou componente raiz (useEffect)
- Usar `supabase.auth.onAuthStateChange((event, session) => {...})` para listener global
- Armazenar session em Zustand/contexto acessível globalmente
- Supabase cuida automaticamente de refresh token; não é necessário código manual
- Se 401 é retornado, redirecionar para /auth e chamar `signOut()` para limpar

**Depende de**: US-05, US-06

---

## US-08 — Proteger rotas privadas com autenticação

**Épico**: EP-02 — Autenticação
**Como** desenvolvedor, **quero** bloquear acesso a rotas privadas (ex: /dashboard, /brothers) para usuários não autenticados, **para que** dados sensíveis sejam protegidos.

**Critérios de Aceite**:
```gherkin
Feature: Proteção de rotas por autenticação

  Scenario: Usuário não autenticado tenta acessar /dashboard
    Given que não estou logado
    When navego para /dashboard
    Then sou redirecionado para /auth
    And nenhum dado é carregado

  Scenario: Usuário autenticado acessa /dashboard normalmente
    Given que estou logado
    When navego para /dashboard
    Then página /dashboard carrega normalmente
    And dados do usuário são carregados

  Scenario: Rota /auth não é acessível para usuário autenticado
    Given que estou logado
    When navego para /auth
    Then sou redirecionado para /dashboard
    And não vejo tela de login
```

**Notas técnicas**:
- Criar componente ProtectedRoute.jsx ou hook useAuthProtection()
- Local: `src/components/ProtectedRoute.jsx`
- Verificar `session` do contexto/Zustand antes de renderizar
- Usar React Router `<Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />`
- Se sem session, renderizar `<Navigate to="/auth" />`
- Validação deve ser síncrona (session já foi restaurada em US-07)

**Depende de**: US-07

---

## US-09 — Exibir informações do usuário autenticado

**Épico**: EP-02 — Autenticação
**Como** usuário autenticado, **quero** ver meu email na interface, **para que** confirme qual conta estou usando.

**Critérios de Aceite**:
```gherkin
Feature: Exibir email do usuário

  Scenario: Email é exibido no header/sidebar
    Given que estou autenticado
    When a aplicação está no /dashboard
    Then meu email é visível no header ou dropdown do menu
    And mostra exatamente o email registrado no Supabase

  Scenario: Email é atualizado quando a sessão muda
    Given que outro usuário faz login
    When a sessão muda (logout + login com outro email)
    Then email exibido é atualizado para o novo email
```

**Notas técnicas**:
- Recuperar email de: `session?.user?.email` (vem automaticamente no `auth.getSession()`)
- Local para exibir: `src/components/Layout/Header.jsx` ou `src/components/Layout/Sidebar.jsx`
- Usar state global (Zustand): armazenar `currentUser` com email
- Atualizar em `onAuthStateChange()` listener

**Depende de**: US-07

---

# EP-03 — Schema PostgreSQL no Supabase

## US-10 — Criar schema PostgreSQL no Supabase (tabela auth.users)

**Épico**: EP-03 — Schema PostgreSQL no Supabase
**Como** administrador do banco, **quero** que Supabase Auth crie a tabela `auth.users` automaticamente, **para que** usuários sejam registrados.

**Critérios de Aceite**:
```gherkin
Feature: Schema de autenticação Supabase

  Scenario: Tabela auth.users existe automaticamente
    Given que criei um projeto Supabase
    When acesso o SQL editor do dashboard
    Then tabela auth.users existe com colunas: id (UUID), email, password_hash, etc.
    And sem necessidade de DDL manual

  Scenario: Foreign keys em tabelas públicas referenciam auth.users
    Given que faço migration no SQL editor
    When defino user_id UUID (FK para auth.users.id) em tabelas (brothers, carts, etc.)
    Then relação é criada corretamente
```

**Notas técnicas**:
- Nenhum DDL necessário; Supabase Auth provisiona automaticamente
- Validar no SQL editor do Supabase Dashboard
- Próximos passos: US-11 (tabelas públicas com coluna user_id)

**Depende de**: Nenhuma (setup inicial Supabase)

---

## US-11 — Criar tabelas públicas com coluna user_id

**Épico**: EP-03 — Schema PostgreSQL no Supabase
**Como** administrador do banco, **quero** criar tabelas como `brothers`, `carts`, `locations`, etc. com coluna `user_id`, **para que** dados fiquem organizados por usuário.

**Critérios de Aceite**:
```gherkin
Feature: Tabelas com isolamento por user_id

  Scenario: Tabela brothers é criada com user_id
    Given que acesso SQL editor do Supabase
    When executo migration para criar tabela brothers
    Then tabela contém:
      - id (UUID, PRIMARY KEY)
      - user_id (UUID, FK para auth.users.id, NOT NULL)
      - name (TEXT, NOT NULL)
      - created_at (TIMESTAMP, default CURRENT_TIMESTAMP)

  Scenario: Outras tabelas seguem estrutura similar
    Given que tenho estrutura de brothers
    When crio carts, locations, groups, slots, schedule_weeks, assignments
    Then todas contêm user_id (FK para auth.users.id) e created_at
```

**Notas técnicas**:
- Arquivo a criar: `supabase/migrations/YYYYMMDDHHMMSS_create_base_tables.sql`
- Tabelas: brothers, carts, locations, groups, slots, schedule_weeks, assignments, user_settings
- Cada tabela deve ter:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Nota: Isolamento por `user_id` e controle de acesso será gerenciado via RBAC em EP-09, não via RLS
- Executar via CLI: `supabase db push` ou via SQL editor do dashboard

**Depende de**: US-10

---

## US-12 — Criar tabela user_settings

**Épico**: EP-03 — Schema PostgreSQL no Supabase
**Como** usuário, **quero** armazenar meu nome de congregação e outras preferências, **para que** a aplicação seja personalizada.

**Critérios de Aceite**:
```gherkin
Feature: Tabela de preferências do usuário

  Scenario: Tabela user_settings é criada
    Given que executo migration
    Then tabela user_settings contém:
      - id (UUID, PRIMARY KEY)
      - user_id (UUID, FK para auth.users.id, UNIQUE, NOT NULL)
      - congregation_name (TEXT, nullable)
      - created_at (TIMESTAMP, default CURRENT_TIMESTAMP)
      - updated_at (TIMESTAMP, default CURRENT_TIMESTAMP)

  Scenario: Um registro por usuário é garantido
    Given que user_id é UNIQUE em user_settings
    When faço INSERT com user_id já existente
    Then erro UNIQUE violation é lançado (impede duplicatas)
```

**Notas técnicas**:
- Arquivo: `supabase/migrations/YYYYMMDDHHMMSS_create_user_settings.sql`
- UNIQUE constraint em user_id para garantir 1:1
- Esta tabela substitui `localStorage` para `congregationName` (atualmente em localStorage)
- Será criado registro automaticamente no signup (US-13)

**Depende de**: US-11

---

## US-13 — Criar trigger para inicializar user_settings no signup

**Épico**: EP-03 — Schema PostgreSQL no Supabase
**Como** usuário novo, **quero** que um registro em user_settings seja criado automaticamente ao me registrar, **para que** possa atualizar meu nome de congregação logo após signup.

**Critérios de Aceite**:
```gherkin
Feature: Inicialização automática de preferências

  Scenario: Trigger cria registro em user_settings ao novo signup
    Given que executo um supabase.auth.signUp()
    When novo usuário é criado em auth.users
    Then trigger é disparado automaticamente
    And novo registro é criado em user_settings com:
      - user_id = novo auth.users.id
      - congregation_name = NULL
      - created_at = CURRENT_TIMESTAMP

  Scenario: Trigger garante que sempre há um registro por usuário
    Given que tentei fazer INSERT manual em user_settings
    When bypass de aplicação ocorre
    Then ainda há garantia de 1:1 via UNIQUE constraint
```

**Notas técnicas**:
- Arquivo: `supabase/migrations/YYYYMMDDHHMMSS_create_user_settings_trigger.sql`
- SQL:
  ```sql
  CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.user_settings (user_id, congregation_name)
    VALUES (NEW.id, NULL);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  ```
- Função é `SECURITY DEFINER` para executar com privilégios de schema owner
- Executar via `supabase db push`

**Depende de**: US-12

---

# EP-04 — Camada de API

## US-15 — Criar API CRUD para Brothers

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções assíncronas para CRUD de brothers, **para que** componentes fiquem simples e reutilizáveis.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Brothers

  Scenario: Função getBrothers() retorna lista de brothers do usuário
    Given que estou autenticado
    When chamo getBrothers()
    Then Promise resolve com array de brothers
    And cada brother contém: id, user_id, name, created_at
    And lista é filtrada por auth.uid() (RLS automático)

  Scenario: Função createBrother(name) cria novo brother
    Given que tenho name = "João Silva"
    When chamo createBrother("João Silva")
    Then novo brother é criado no banco
    And resposta contém id do novo brother
    And user_id é preenchido automaticamente com auth.uid()

  Scenario: Função updateBrother(id, name) atualiza brother
    Given que tenho um brother com id específico
    When chamo updateBrother(id, "Novo Nome")
    Then brother é atualizado no banco
    And updated_at é atualizado automaticamente

  Scenario: Função deleteBrother(id) deleta brother
    Given que tenho um brother com id específico
    When chamo deleteBrother(id)
    Then brother é deletado do banco
    And função retorna sucesso sem erro
```

**Notas técnicas**:
- Arquivo a criar: `src/api/brothers.js`
- Template de função:
  ```javascript
  import { supabase } from './client';
  
  export async function getBrothers() {
    const { data, error } = await supabase
      .from('brothers')
      .select('*');
    if (error) throw error;
    return data;
  }
  
  export async function createBrother(name) {
    const { data, error } = await supabase
      .from('brothers')
      .insert([{ name }])
      .select();
    if (error) throw error;
    return data[0];
  }
  // ... updateBrother, deleteBrother
  ```
- Usar `.select()` após INSERT/UPDATE para retornar dados inseridos
- Erro é automaticamente rejeitado se RLS bloqueia
- Sem tratamento de erro aqui (deixar para store/componentes em EP-05/06)

**Depende de**: US-01, US-02, US-11

---

## US-16 — Criar API CRUD para Carts

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para carts, **para que** componentes de Carros sejam simples.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Carts

  Scenario: Função getCarts() retorna lista de carrinhos
    Given que estou autenticado
    When chamo getCarts()
    Then Promise resolve com array de carts
    And cada cart contém: id, user_id, name, created_at

  Scenario: Função createCart(name) cria novo carrinho
    Given que tenho name = "Carrinho A"
    When chamo createCart("Carrinho A")
    Then novo cart é criado
    And resposta contém id do novo cart

  Scenario: Função updateCart(id, name) atualiza carrinho
    Given que tenho um cart com id específico
    When chamo updateCart(id, "Novo Nome")
    Then cart é atualizado

  Scenario: Função deleteCart(id) deleta carrinho
    Given que tenho um cart com id específico
    When chamo deleteCart(id)
    Then cart é deletado
```

**Notas técnicas**:
- Arquivo a criar: `src/api/carts.js`
- Estrutura idêntica a brothers.js
- Testes não incluem validação de foreign key (será coberto por entidades que referenciam carts, ex: assignments)

**Depende de**: US-01, US-02, US-11

---

## US-17 — Criar API CRUD para Locations

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para locations, **para que** gerencie locais de testemunho.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Locations

  Scenario: Função getLocations() retorna lista de locais
    Given que estou autenticado
    When chamo getLocations()
    Then Promise resolve com array de locations
    And cada location contém: id, user_id, name, created_at

  Scenario: CRUD completo: create, read, update, delete
    Given que tenho funções createLocation, updateLocation, deleteLocation
    When executo cada função com dados válidos
    Then todas funcionam como esperado (sem detalhes repetitivos)
```

**Notas técnicas**:
- Arquivo a criar: `src/api/locations.js`
- Estrutura idêntica a brothers.js e carts.js

**Depende de**: US-01, US-02, US-11

---

## US-18 — Criar API CRUD para Groups

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para groups, **para que** crie grupos de brothers.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Groups

  Scenario: CRUD completo para groups
    Given que tenho funções getGroups, createGroup, updateGroup, deleteGroup
    When executo operações CRUD
    Then todas funcionam conforme esperado
```

**Notas técnicas**:
- Arquivo a criar: `src/api/groups.js`
- Estrutura idêntica a anteriores

**Depende de**: US-01, US-02, US-11

---

## US-19 — Criar API CRUD para Slots

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para slots, **para que** gerencie horários de testemunho.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Slots

  Scenario: CRUD completo para slots
    Given que tenho funções getSlots, createSlot, updateSlot, deleteSlot
    When executo operações CRUD
    Then todas funcionam conforme esperado
```

**Notas técnicas**:
- Arquivo a criar: `src/api/slots.js`
- Estrutura idêntica

**Depende de**: US-01, US-02, US-11

---

## US-20 — Criar API CRUD para Schedule Weeks

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para schedule_weeks, **para que** gerencie semanas de agendamento.

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Schedule Weeks

  Scenario: CRUD completo para schedule_weeks
    Given que tenho funções getScheduleWeeks, createScheduleWeek, updateScheduleWeek, deleteScheduleWeek
    When executo operações CRUD
    Then todas funcionam conforme esperado
    And week_start é tratado como YYYY-MM-DD (segunda-feira)
```

**Notas técnicas**:
- Arquivo a criar: `src/api/scheduleWeeks.js`
- Campo `week_start` é string `YYYY-MM-DD`
- Validar que week_start sempre é segunda-feira (lógica em componentes, não aqui)

**Depende de**: US-01, US-02, US-11

---

## US-21 — Criar API CRUD para Assignments

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** funções CRUD para assignments com upsert, **para que** implemente a lógica de "mesmo slot pode ter múltiplas posições".

**Critérios de Aceite**:
```gherkin
Feature: API CRUD de Assignments

  Scenario: Função getAssignments() retorna todas as designações
    Given que estou autenticado
    When chamo getAssignments()
    Then Promise resolve com array de assignments
    And cada assignment contém: week_id, slot_id, position, brother_id

  Scenario: Função upsertAssignment(weekId, slotId, position, brotherId) cria ou atualiza
    Given que tenho valores válidos
    When chamo upsertAssignment(...)
    Then se (week_id, slot_id, position) já existe, é atualizado
    And se não existe, é criado novo registro
    And não há duplicata

  Scenario: Função deleteAssignment(weekId, slotId, position) deleta
    Given que tenho um assignment específico
    When chamo deleteAssignment(...)
    Then assignment é deletado
```

**Notas técnicas**:
- Arquivo a criar: `src/api/assignments.js`
- Upsert usa SQL: `INSERT ... ON CONFLICT (week_id, slot_id, position) DO UPDATE SET ...`
- Supabase suporta via `.upsert()`:
  ```javascript
  export async function upsertAssignment(weekId, slotId, position, brotherId) {
    const { data, error } = await supabase
      .from('assignments')
      .upsert([{ week_id: weekId, slot_id: slotId, position, brother_id: brotherId }])
      .select();
    if (error) throw error;
    return data[0];
  }
  ```
- Sem validação de FK aqui (banco garante com ON DELETE CASCADE)

**Depende de**: US-01, US-02, US-11

---

## US-22 — Criar API para atualizar user_settings

**Épico**: EP-04 — Camada de API
**Como** desenvolvedor, **quero** função para atualizar congregation_name do usuário, **para que** preferences sejam persistidas no banco.

**Critérios de Aceite**:
```gherkin
Feature: API de Preferências do Usuário

  Scenario: Função updateCongregationName(name) atualiza congregação
    Given que estou autenticado
    When chamo updateCongregationName("Minha Congregação")
    Then record em user_settings é atualizado
    And resposta contém o novo congregation_name

  Scenario: Função getCongregationName() retorna nome da congregação
    Given que estou autenticado
    When chamo getCongregationName()
    Then Promise resolve com congregation_name do usuário
    And retorna NULL se nunca foi definido
```

**Notas técnicas**:
- Arquivo a criar: `src/api/userSettings.js`
- Usar `.eq('user_id', supabase.auth.user().id)` para garantir isolamento mesmo sem RLS (defesa em profundidade)
- Exemplo:
  ```javascript
  export async function updateCongregationName(name) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('user_settings')
      .update({ congregation_name: name })
      .eq('user_id', user.id)
      .select();
    if (error) throw error;
    return data[0];
  }
  ```

**Depende de**: US-01, US-02, US-12

---

# EP-05 — Migração do Store (Zustand)

## US-23 — Refatorar useAppStore para operações async

**Épico**: EP-05 — Migração do Store (Zustand)
**Como** desenvolvedor, **quero** que actions do Zustand chamem funções de API e gerenciem estado loading/error, **para que** componentes tenham acesso a dados e status de operação.

**Critérios de Aceite**:
```gherkin
Feature: Store Zustand com async actions

  Scenario: Action fetchBrothers() carrega dados do Supabase
    Given que estou autenticado
    When chamo store.fetchBrothers()
    Then store.loading = true (during fetch)
    And após sucesso, store.brothers = [...]
    And store.loading = false
    And store.error = null

  Scenario: Erro em operação é armazenado no store
    Given que há erro na API (ex: network timeout)
    When chamo store.fetchBrothers()
    Then store.error = "Erro ao carregar brothers"
    And store.loading = false
    And store.brothers = [] (mantém último estado válido ou vazio)

  Scenario: Action para criar, atualizar, deletar
    Given que tenho actions createBrother, updateBrother, deleteBrother
    When chamo cada action com dados válidos
    Then estado é atualizado corretamente
    And store.loading/error refletem operação
```

**Notas técnicas**:
- Arquivo a modificar: `src/store/useAppStore.js`
- Nova estrutura de state:
  ```javascript
  const useAppStore = create((set) => ({
    // State
    brothers: [],
    carts: [],
    locations: [],
    // ... outras entidades
    loading: false,
    error: null,
    currentUser: null,
    
    // Actions
    fetchBrothers: async () => {
      set({ loading: true, error: null });
      try {
        const data = await getBrothers();
        set({ brothers: data });
      } catch (err) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },
    // ... outros fetchs + creates/updates/deletes
  }));
  ```
- Actions retornam Promise (await-able nos componentes)
- Cada action segue padrão: set loading → try/catch → atualizar state ou error → finally limpar loading

**Depende de**: US-15 até US-22 (todas as APIs)

---

## US-24 — Armazenar sessão do usuário no store

**Épico**: EP-05 — Migração do Store (Zustand)
**Como** componente, **quero** acessar dados da sessão atual do usuário via store, **para que** possa exibir email e determinar permissões sem chamar Supabase novamente.

**Critérios de Aceite**:
```gherkin
Feature: Sessão do usuário no Zustand

  Scenario: Store armazena currentUser após login
    Given que fiz login
    When store.setCurrentUser({ id, email })
    Then store.currentUser.email está acessível
    And componentes podem ler sem chamar Supabase

  Scenario: Store limpa currentUser após logout
    Given que estou autenticado
    When faço logout
    Then store.setCurrentUser(null)
    And store.currentUser = null
```

**Notas técnicas**:
- Adicionar ao state: `currentUser: null`
- Adicionar action: `setCurrentUser(user)`
- Chamar `store.setCurrentUser()` em `onAuthStateChange()` listener (US-07)
- currentUser contém: `{ id: UUID, email: string }`

**Depende de**: US-23

---

## US-25 — Inicializar store com dados do usuário ao login

**Épico**: EP-05 — Migração do Store (Zustand)
**Como** aplicação, **quero** que ao fazer login, todos os dados do usuário sejam carregados de uma vez, **para que** dashboard esteja pronto sem delays iniciais.

**Critérios de Aceite**:
```gherkin
Feature: Carregamento inicial de dados

  Scenario: Após login bem-sucedido, todos os dados são carregados
    Given que fiz login
    When redirecionado para /dashboard
    Then store.loading = true
    And store.fetchBrothers(), store.fetchCarts(), etc. são chamados em paralelo
    And após todos completarem, store.loading = false
    And dashboard renderiza com dados preenchidos

  Scenario: Se um fetch falha, os outros continuam
    Given que fetchBrothers() falha
    When outros fetchs continuam em paralelo
    Then store.carts, store.locations, etc. são preenchidos normalmente
    And store.error é preenchido apenas com erro de brothers
```

**Notas técnicas**:
- Chamar em componente (ex: Dashboard.jsx ou useEffect da raiz) ou em listener
- Usar Promise.allSettled() para rodar todos em paralelo:
  ```javascript
  async function initializeStoreData() {
    await Promise.allSettled([
      store.fetchBrothers(),
      store.fetchCarts(),
      store.fetchLocations(),
      // ...
    ]);
  }
  ```
- Chamar após session é restaurada (não em signup imediato, esperar redirecionamento)

**Depende de**: US-23, US-24

---

# EP-06 — Migração de Pages/Componentes

## US-26 — Refatorar Dashboard para usar store async

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** que o Dashboard carregue dados via Supabase e exiba loading state, **para que** veja os dados assim que disponíveis.

**Critérios de Aceite**:
```gherkin
Feature: Dashboard com async data loading

  Scenario: Dashboard exibe loading spinner enquanto carrega
    Given que entrei em /dashboard
    When dados estão sendo carregados (store.loading = true)
    Then spinner ou esqueleto de loading é exibido

  Scenario: Dados são exibidos após carregar
    Given que store.loading = false
    When dados estão em store.brothers, store.carts, etc.
    Then sumário do dashboard é renderizado com dados
    And números de brothers, carros, agendamentos são exibidos

  Scenario: Erro é exibido se falhar
    Given que store.error != null
    When há erro no carregamento
    Then mensagem de erro é exibida
    And botão "Tentar novamente" recarrega dados
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Dashboard.jsx`
- Usar hooks: `const store = useAppStore()`
- Render condicional: `store.loading ? <Spinner /> : <Content />`
- Usar `useEffect` para chamar `store.fetchBrothers()`, etc. se não foi chamado em inicialização
- Ou confiar que US-25 chamou tudo ao login

**Depende de**: US-23, US-25

---

## US-27 — Refatorar página Brothers para CRUD async

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** criar, editar e deletar brothers via interface, **para que** gerencie a lista de irmãos sem perder dados.

**Critérios de Aceite**:
```gherkin
Feature: CRUD de Brothers na interface

  Scenario: Lista de brothers é exibida ao carregar a página
    Given que estou na página /brothers
    When página carrega
    Then lista de todos os brothers é exibida
    And cada linha mostra: name, data de criação, botões de editar/deletar

  Scenario: Criar novo brother via modal
    Given que clico em "Adicionar Brother"
    When preencho o nome e clico "Salvar"
    Then store.createBrother() é chamado
    And modal é fechado
    And novo brother aparece na lista imediatamente

  Scenario: Editar brother existente
    Given que clico em "Editar" de um brother
    When preencho novo nome e clico "Salvar"
    Then store.updateBrother() é chamado
    And brother na lista é atualizado

  Scenario: Deletar brother
    Given que clico em "Deletar" de um brother
    When confirmo deleção
    Then store.deleteBrother() é chamado
    And brother é removido da lista
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Brothers.jsx`
- Usar modal existente ou criar novo Modal.jsx se não existir
- Chamar `store.fetchBrothers()` em useEffect se lista vazia
- Após criar/editar/deletar, atualizar store automaticamente (actions já fazem isso)
- Validação de input: nome não pode ser vazio

**Depende de**: US-23, US-26

---

## US-28 — Refatorar página Carts para CRUD async

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** gerenciar carrinhos via interface, **para que** crie, edite e delete carros.

**Critérios de Aceite**:
```gherkin
Feature: CRUD de Carts na interface

  Scenario: CRUD completo (create, read, update, delete)
    Given que estou na página /carts
    When executo operações de CRUD
    Then todas funcionam corretamente
    And lista é atualizada em tempo real (sem refresh)
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Carts.jsx`
- Estrutura idêntica a US-27 (Brothers)
- Reutilizar componentes de modal e validação

**Depende de**: US-23, US-26

---

## US-29 — Refatorar página Locations para CRUD async

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** gerenciar locais de testemunho, **para que** crie e edite locais.

**Critérios de Aceite**:
```gherkin
Feature: CRUD de Locations na interface

  Scenario: CRUD completo para locations
    Given que estou na página /locations
    When executo operações de CRUD
    Then todas funcionam conforme esperado
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Locations.jsx`
- Estrutura idêntica a anteriores

**Depende de**: US-23, US-26

---

## US-30 — Refatorar página Schedule para CRUD async de assignments

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** designar brothers a slots de agendamento, **para que** monte o cronograma semanal de testemunho.

**Critérios de Aceite**:
```gherkin
Feature: CRUD de Assignments na interface

  Scenario: Schedule exibe semanas e slots
    Given que estou na página /schedule
    When página carrega
    Then tabela mostra weeks, slots, e positions
    And cada célula pode ser clicada para atribuir um brother

  Scenario: Atribuir brother a um slot
    Given que clico em uma célula vazia (week, slot, position)
    When seleciono um brother do dropdown
    Then store.upsertAssignment() é chamado
    And célula é preenchida com nome do brother

  Scenario: Remover atribuição
    Given que uma célula tem um brother atribuído
    When clico em "Remover" ou no botão de deletar
    Then store.deleteAssignment() é chamado
    And célula volta a estar vazia
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Schedule.jsx`
- Usar `store.fetchScheduleWeeks()`, `store.fetchSlots()`, `store.fetchAssignments()` para popular
- Lógica de renderização: loop sobre weeks, slots, positions (até 4 positions por slot)
- Validação: não permitir atribuir mesmo brother 2x no mesmo slot

**Depende de**: US-23, US-26, US-21

---

## US-31 — Refatorar página Settings para atualizar congregationName

**Épico**: EP-06 — Migração de Pages/Componentes
**Como** usuário, **quero** atualizar meu nome de congregação nas settings, **para que** seja personalizado e persistido.

**Critérios de Aceite**:
```gherkin
Feature: Atualização de Preferências

  Scenario: Campo de congregation_name é exibido nas settings
    Given que estou na página /settings
    When página carrega
    Then campo "Nome da Congregação" mostra valor atual

  Scenario: Salvar novo nome de congregação
    Given que preencho novo nome
    When clico em "Salvar"
    Then store.updateCongregationName() é chamado
    And campo mostra mensagem de sucesso
    And valor é persistido no Supabase (user_settings)

  Scenario: Valor é carregado ao entrar nas settings
    Given que já salvei um nome anteriormente
    When navego para /settings
    Then campo mostra nome salvo
    And sem necessidade de recarga
```

**Notas técnicas**:
- Arquivo a modificar: `src/pages/Settings.jsx`
- Chamar `store.fetchCongregationName()` em useEffect
- Ou armazenar em store.currentUser.congregationName (atualizado em US-25)
- Remover lógica de localStorage (estava em App.jsx ou Settings.jsx)

**Depende de**: US-22, US-23

---

# EP-07 — Backup e Importação de Dados

## US-32 — Implementar exportação de dados em JSON

**Épico**: EP-07 — Backup e Importação de Dados
**Como** usuário, **quero** exportar todos os meus dados em JSON, **para que** tenha backup local e possa migrar para outro sistema.

**Critérios de Aceite**:
```gherkin
Feature: Exportação de dados

  Scenario: Usuário clica em "Exportar Dados" nas settings
    Given que estou em /settings
    When clico em "Exportar Dados"
    Then arquivo JSON é gerado com:
      - brothers: [...]
      - carts: [...]
      - locations: [...]
      - groups: [...]
      - slots: [...]
      - schedule_weeks: [...]
      - assignments: [...]
      - user_settings: { congregation_name, ... }
    And arquivo é baixado automaticamente (download.json)

  Scenario: JSON contém timestamps e IDs para reimportação
    Given que exporto dados
    When abro arquivo em editor de texto
    Then vejo estrutura JSON válida
    And todos os campos (id, user_id, created_at, etc.) estão presentes
    And dados são completos e sem corrupção
```

**Notas técnicas**:
- Arquivo a criar ou modificar: `src/api/export.js`
- Função `exportAllData()` que retorna objeto JSON:
  ```javascript
  export async function exportAllData() {
    const data = {
      brothers: await getBrothers(),
      carts: await getCarts(),
      locations: await getLocations(),
      groups: await getGroups(),
      slots: await getSlots(),
      schedule_weeks: await getScheduleWeeks(),
      assignments: await getAssignments(),
      user_settings: await getCongregationName(),
    };
    return data;
  }
  ```
- Usar `JSON.stringify()` para serializar
- Gerar download via `<a href="data:application/json,...">` ou bibliotecas como `file-saver`

**Depende de**: US-15 até US-22

---

## US-33 — Implementar importação de dados em JSON

**Épico**: EP-07 — Backup e Importação de Dados
**Como** usuário, **quero** importar dados de JSON (backup ou migração), **para que** restaure ou migre dados para nova conta.

**Critérios de Aceite**:
```gherkin
Feature: Importação de dados

  Scenario: Usuário clica em "Importar Dados" nas settings
    Given que estou em /settings
    When clico em "Importar Dados"
    Then file picker é aberto para selecionar arquivo JSON

  Scenario: JSON é validado antes de importar
    Given que seleciono arquivo JSON
    When importer valida estrutura (brothers, carts, etc.)
    Then se inválido, exibe erro: "Formato de arquivo inválido"
    And se válido, continua com importação

  Scenario: Dados são inseridos no Supabase com novo user_id
    Given que arquivo JSON é válido
    When clico em "Confirmar Importação"
    Then cada entidade é inserida no banco:
      - brothers com novo user_id
      - carts com novo user_id
      - ... (todas as tabelas)
    And IDs originais são ignorados (novos UUIDs são gerados)
    And importação mostra mensagem de sucesso

  Scenario: Duplicatas são evitadas
    Given que já importei esses dados antes
    When importo novamente
    Then dados não são duplicados
    And mensagem de aviso: "Alguns dados já existem. Sobrescrever?"
```

**Notas técnicas**:
- Arquivo a criar: `src/api/import.js`
- Função `importDataFromJSON(jsonData)` que:
  1. Valida estrutura JSON
  2. Para cada entidade, chama create function (já faz INSERT com novo ID automático)
  3. Retorna resumo: "Importados 5 brothers, 2 carts, ..."
- Validação básica: verifica se chaves (brothers, carts, etc.) existem
- Ignorar campo `user_id` no JSON (gerado novo automaticamente)
- Considerar transação (atomic insert) se Supabase suporta (avançado)

**Depende de**: US-15 até US-22, US-32

---

# EP-08 — Remoção de sql.js e OPFS

## US-34 — Remover sql.js e código de inicialização OPFS

**Épico**: EP-08 — Remoção de sql.js e OPFS
**Como** desenvolvedor, **quero** remover dependências obsoletas (sql.js), **para que** projeto fique limpo e bundle menor.

**Critérios de Aceite**:
```gherkin
Feature: Limpeza de dependências

  Scenario: Pacote sql.js é removido
    Given que executei npm uninstall sql.js
    When arquivo package.json é verificado
    Then sql.js não está em dependencies nem devDependencies

  Scenario: Arquivo src/db/init.js é removido
    Given que src/db/init.js existia para inicializar sql.js
    When verifico src/db/ directory
    Then arquivo não existe mais
    And nenhum import de init.js existe em project

  Scenario: Vite config é simplificado
    Given que vite.config.js tinha optimizeDeps.exclude: ['sql.js']
    When verifico o arquivo
    Then exclusão de sql.js é removida
    And build não tenta processar sql.js

  Scenario: Build é bem-sucedido
    Given que removi sql.js
    When executo npm run build
    Then build completa sem erro
    And bundle size diminui (~200KB)
```

**Notas técnicas**:
- Arquivos a deletar:
  - `src/db/init.js`
  - `src/db/schema.sql` (não é mais necessário; schema está no Supabase)
  - `src/db/queries/` (diretório inteiro com funções de query)
- Arquivos a deletar ou modificar:
  - `public/schema.sql` (não é mais servido; remove)
  - `vite.config.js` — remover `optimizeDeps.exclude`
- Verificar imports em `src/main.jsx`, `src/App.jsx` — remover `import { ... } from src/db/init`
- Remover `package-lock.json` ou `yarn.lock` e reinstalar dependências

**Depende de**: EP-04 (todas as APIs já estão em src/api/)

---

## US-35 — Remover referências a localStorage para congregationName

**Épico**: EP-08 — Remoção de sql.js e OPFS
**Como** desenvolvedor, **quero** remover lógica de localStorage (foi substituída por user_settings no banco), **para que** código fique consistente.

**Critérios de Aceite**:
```gherkin
Feature: Migração de localStorage para Supabase

  Scenario: localStorage.getItem('congregationName') é removido
    Given que código usava localStorage
    When verifico src/pages/Settings.jsx e src/App.jsx
    Then nenhuma referência a localStorage para congregationName existe
    And calls são feitos para store.getCongregationName() (Supabase) em seu lugar

  Scenario: Nova lógica usa user_settings via API
    Given que renovei referências
    When carregar settings ou App
    Then usa store.congregationName (carregado de Supabase em US-25)
    And atualiza via store.updateCongregationName() (Supabase)
```

**Notas técnicas**:
- Grep por `localStorage` em `src/pages/` e `src/` (buscar todas as ocorrências)
- Arquivos prováveis:
  - `src/pages/Settings.jsx` — localStorage.setItem('congregationName', ...)
  - `src/App.jsx` ou `src/pages/Dashboard.jsx` — localStorage.getItem('congregationName')
- Remover linhas de localStorage
- Adicionar chamadas para `store.updateCongregationName()` ou `store.getCongregationName()` em seu lugar
- Testar que settings carregam e salvam sem erros

**Depende de**: US-22, US-31

---

## US-36 — Validar que nenhum código de sql.js/OPFS permanece

**Épico**: EP-08 — Remoção de sql.js e OPFS
**Como** desenvolvedor, **quero** auditar o projeto inteiro para garantir que nenhuma referência a sql.js/OPFS passou despercebida, **para que** saiba que migração está completa.

**Critérios de Aceite**:
```gherkin
Feature: Auditoria de código morto

  Scenario: Grep busca por "sql.js" retorna 0 resultados
    Given que executo grep -r "sql\.js" src/
    When resultado é vazio
    Then nenhuma referência a sql.js permanece

  Scenario: Grep busca por "OPFS" retorna 0 resultados
    Given que executo grep -r "OPFS\|opfs\|FileSystemDirectoryHandle" src/
    When resultado é vazio
    Then nenhuma referência a OPFS permanece

  Scenario: Grep busca por "persist()" (função de OPFS) retorna 0 resultados
    Given que executo grep -r "persist()" src/
    When resultado é vazio
    Then nenhuma lógica de persistência manual OPFS permanece

  Scenario: Nenhum warning de dependências desatualizadas
    Given que executo npm audit
    When não há referências a sql.js
    Then audit não mostra sql.js como problema
    And build não tenta processar sql.js
```

**Notas técnicas**:
- Usar Bash tool para executar:
  - `grep -r "sql\.js" src/`
  - `grep -r "OPFS\|opfs" src/`
  - `grep -r "persist()" src/`
  - `grep -r "FileSystemDirectoryHandle\|FileSystemAccessHandle" src/`
- Se alguma encontrada, investigar e remover
- Verificar também `package.json` (sql.js deve estar completamente ausente)
- Considerar cleanup de `public/` (remover schema.sql se estava lá)

**Depende de**: US-34, US-35

---

# EP-09 — Controle de Acesso (Aprovação e Roles)

## US-37 — Criar tabela user_profiles com role e is_approved

**Épico**: EP-09 — Controle de Acesso (Aprovação e Roles)
**Como** administrador, **quero** uma tabela que armazene role e status de aprovação de cada usuário, **para que** controle quem pode usar a aplicação e quais permissões tem.

**Critérios de Aceite**:
```gherkin
Feature: Tabela de perfis de usuário com roles

  Scenario: Tabela user_profiles é criada com campos role e is_approved
    Given que executo migration no Supabase
    Then tabela user_profiles contém:
      - id (UUID, PRIMARY KEY)
      - user_id (UUID, FK para auth.users.id, UNIQUE, NOT NULL)
      - role (TEXT, DEFAULT 'user', CHECK (role IN ('admin', 'user')))
      - is_approved (BOOLEAN, DEFAULT false)
      - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
      - updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

  Scenario: Primeiro usuário é criado automaticamente como admin
    Given que executo um trigger na criação do primeiro usuário
    When nenhum admin existe ainda
    Then primeiro signup é automaticamente role='admin', is_approved=true
    And outros signups têm role='user', is_approved=false (precisam aprovação)

  Scenario: Dados são consultáveis para controle RBAC
    Given que role e is_approved estão na tabela
    When aplicação carrega perfil do usuário ao fazer login
    Then pode verificar role e is_approved para renderização condicional (no app, não via RLS)
    And controle de acesso é gerenciado via RBAC (Role-Based Access Control), não RLS
```

**Notas técnicas**:
- Arquivo: `supabase/migrations/YYYYMMDDHHMMSS_create_user_profiles.sql`
- Trigger `handle_new_user()` (já existe para user_settings em US-13) será estendido para criar registro em user_profiles
- Logic de primeiro admin:
  ```sql
  CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    INSERT INTO public.user_profiles (user_id, role, is_approved)
    VALUES (NEW.id, 
            CASE WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE role='admin') = 0 
                 THEN 'admin' 
                 ELSE 'user' 
            END,
            CASE WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE role='admin') = 0 
                 THEN true 
                 ELSE false 
            END);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- Nota: Sem RLS policies nesta tabela. O controle de quem consegue atualizar é feito via RBAC na aplicação (verificado em US-38, US-39, US-40, US-41)

**Depende de**: US-13 (trigger handle_new_user será estendido)

---

## US-38 — Criar página Admin para aprovar/bloquear usuários

**Épico**: EP-09 — Controle de Acesso
**Como** admin, **quero** uma página que liste usuários pendentes de aprovação e permita aprovar/bloquear, **para que** controle quem acessa a aplicação.

**Critérios de Aceite**:
```gherkin
Feature: Painel de aprovação de usuários

  Scenario: Página /admin/users lista usuários pendentes
    Given que sou admin
    When navego para /admin/users
    Then vejo tabela com usuários is_approved=false
    And cada linha mostra: email, data de criação, status, botões de aprovar/bloquear

  Scenario: Admin aprova usuário
    Given que vejo usuário pendente na lista
    When clico em "Aprovar"
    Then user_profiles.is_approved = true
    And usuário recebe email confirmando aprovação (opcional)
    And usuário pode agora fazer login normalmente

  Scenario: Admin bloqueia usuário
    Given que vejo usuário na lista
    When clico em "Bloquear"
    Then user_profiles.is_approved = false
    And se usuário estiver logado, é feito logout automático
    And usuário vê mensagem: "Sua conta foi desativada"

  Scenario: Apenas admin consegue acessar /admin/users
    Given que sou user comum
    When navego para /admin/users
    Then sou redirecionado para /dashboard
    And nenhum dado de outro usuário é exibido
```

**Notas técnicas**:
- Arquivo a criar: `src/pages/Admin/Users.jsx`
- Arquivo a criar: `src/api/admin.js` com funções:
  ```javascript
  export async function getPendingUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_approved, created_at, user_settings!inner(user_id)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  export async function approveUser(userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_approved: true })
      .eq('user_id', userId);
    if (error) throw error;
  }

  export async function blockUser(userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_approved: false })
      .eq('user_id', userId);
    if (error) throw error;
  }
  ```
- Componente deve usar `useAuthStore` para verificar se user.role === 'admin'
- Tabela mostra email via join com `auth.users` (pode ser feito no backend com function SQL)

**Depende de**: US-37, US-15 (API CRUD)

---

## US-39 — Proteger componentes e rotas por role

**Épico**: EP-09 — Controle de Acesso
**Como** desenvolvedor, **quero** componentes que verificam role antes de renderizar, **para que** UI adapte-se às permissões do usuário.

**Critérios de Aceite**:
```gherkin
Feature: Renderização condicional por role

  Scenario: User comum não vê menu de /admin
    Given que sou user
    When abro a aplicação
    Then sidebar não exibe link "/admin/users"

  Scenario: User comum só acessa /report (read-only)
    Given que sou user
    When navego para /brothers, /carts, /locations, etc.
    Then sou redirecionado para /report
    And vejo aviso: "Você tem acesso apenas ao relatório de programação"

  Scenario: Admin vê todos os menus e pode editar tudo
    Given que sou admin
    When abro a aplicação
    Then todos os links de menu estão visíveis
    And posso criar, editar, deletar em todas as páginas
    And /admin/users está acessível

  Scenario: User bloqueado é deslogado automaticamente
    Given que estou logado como user
    When admin bloqueia minha conta (is_approved = false)
    Then ao próximo request, recebo erro 403
    And sou redirecionado para /auth com mensagem: "Sua conta foi desativada"
```

**Notas técnicas**:
- Criar hook: `src/hooks/useRoleCheck.js`
  ```javascript
  export function useRoleCheck(requiredRole) {
    const { user, userProfile } = useAuthStore();
    if (!user || !userProfile) return false;
    if (!userProfile.is_approved) return false; // bloqueado
    if (requiredRole && userProfile.role !== requiredRole) return false;
    return true;
  }
  ```
- Criar componente: `src/components/AdminOnly.jsx`
  ```javascript
  export function AdminOnly({ children }) {
    const isAdmin = useRoleCheck('admin');
    return isAdmin ? children : null;
  }
  ```
- Modificar `src/components/Layout/Sidebar.jsx` para renderizar links condicionalmente
- Modificar `src/App.jsx` para redirecionar user para /report ao tentar acessar rotas protegidas
- Adicionar verificação em cada página: se is_approved=false, logout imediato

**Depende de**: US-37, US-38

---

## US-40 — Atualizar store com role e is_approved

**Épico**: EP-09 — Controle de Acesso
**Como** aplicação, **quero** que user role e is_approved sejam carregados automaticamente no store, **para que** componentes possam tomar decisões sem chamar Supabase novamente.

**Critérios de Aceite**:
```gherkin
Feature: Store gerencia role e aprovação

  Scenario: User profile é carregado ao fazer login
    Given que faço login
    When session é restaurada
    Then store.userProfile = { role: 'admin'|'user', is_approved: true|false, ... }
    And store.user = { id, email }

  Scenario: useRoleCheck() usa dados do store
    Given que tenho userProfile no store
    When renderizo componente AdminOnly
    Then verifica store.userProfile.role === 'admin' e store.userProfile.is_approved === true

  Scenario: Logout limpa userProfile
    Given que estou autenticado
    When faço logout
    Then store.userProfile = null
    And store.user = null
```

**Notas técnicas**:
- Modificar `src/store/useAuthStore.js`:
  ```javascript
  const useAuthStore = create((set) => ({
    // ... existing state ...
    userProfile: null,

    setUserProfile: (profile) => set({ userProfile: profile }),

    initAuth: async () => {
      // ... existing code ...
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { data: profile } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        set({ userProfile: profile });
      }
    },
  }))
  ```
- Modificar `onAuthStateChange()` listener para recarregar userProfile quando session muda
- Função de logout deve limpar userProfile

**Depende de**: US-37, US-40

---

## US-41 — Criar API CRUD para user_profiles (admin)

**Épico**: EP-09 — Controle de Acesso
**Como** desenvolvedor, **quero** funções de API para admin gerenciar user_profiles (mudar role, aprovar/bloquear), **para que** página Admin funcione.

**Critérios de Aceite**:
```gherkin
Feature: API para gerenciar user_profiles

  Scenario: Função updateUserApprovalStatus(userId, isApproved)
    Given que sou admin
    When chamo updateUserApprovalStatus(userId, true)
    Then user_profiles.is_approved é atualizado
    And função retorna o perfil atualizado

  Scenario: Função updateUserRole(userId, role)
    Given que sou admin
    When chamo updateUserRole(userId, 'admin')
    Then user_profiles.role é atualizado para 'admin'
    And função valida que role está em ('admin', 'user')

  Scenario: Apenas admin consegue chamar essas funções
    Given que sou user
    When chamo updateUserApprovalStatus()
    Then erro 403 é retornado (RLS bloqueia)
    And nenhuma alteração é feita
```

**Notas técnicas**:
- Arquivo a criar: `src/api/userProfiles.js`
- Funções:
  ```javascript
  export async function getPendingUsers() { ... }
  export async function getAllUsers() { ... }
  export async function updateUserApprovalStatus(userId, isApproved) { ... }
  export async function updateUserRole(userId, role) { ... }
  ```
- RLS policies do US-37 garantem que apenas admins conseguem atualizar
- Sem validação de permission no código JS (RLS é a fonte da verdade)

**Depende de**: US-37, US-04 (API pattern)

---

# Sumário de Dependências e Ordem de Execução

## Ordenação sugerida para implementação:

1. **US-01 a US-03** (Infraestrutura — bloqueia tudo)
2. **US-04 a US-09** (Autenticação — EP-02, bloqueia US-05)
3. **US-10 a US-13** (Schema Supabase — EP-03, bloqueia US-15+)
4. **US-15 a US-22** (Camada de API — EP-04, bloqueia US-23)
5. **US-23 a US-25** (Store — EP-05, bloqueia US-26+)
6. **US-26 a US-31** (Pages/Componentes — EP-06, validação de funcionalidade)
7. **US-37 a US-41** (Controle de Acesso com RBAC — EP-09, adicionado após validação de funcionalidade)
8. **US-32 a US-33** (Backup/Importação — EP-07, funcionalidade extra)
9. **US-34 a US-36** (Limpeza — EP-08, finalização)

## Ciclos de teste recomendados:

- **Após EP-01 + EP-02**: Testar signup/signin/logout
- **Após EP-03**: Validar RLS no SQL editor Supabase
- **Após EP-04**: Testar cada função de API via Node REPL ou teste manual
- **Após EP-05**: Testar store actions em browser console
- **Após EP-06**: Testar fluxo completo de user (login → CRUD → logout)
- **Após EP-09**: Testar aprovação de usuários, roles, acesso condicional por role
  - Admin aprova user, verifica que user consegue logar
  - User bloqueado é deslogado automaticamente
  - User comum vê apenas /report, admin vê tudo
- **Após EP-07**: Testar exportação/importação com dados reais
- **Após EP-08**: Garantir que build sem erros, bundle menor, sem warnings

---

## Notas de rastreabilidade

| US | Arquivo principal | Função chave | Dependências |
|---|---|---|---|
| US-01 | src/api/client.js | createClient() | Nenhuma |
| US-02 | src/types/supabase.ts | (tipos) | US-01 |
| US-03 | src/api/client.js | validateSupabaseConfig() | US-01, US-02 |
| US-04 | src/pages/Auth/SignUp.jsx | handleSignUp() | US-01, US-02, US-05 |
| US-05 | src/pages/Auth/SignIn.jsx | handleSignIn() | US-01, US-02 |
| US-06 | src/components/Layout/Header.jsx | handleSignOut() | US-05 |
| US-07 | src/App.jsx | onAuthStateChange listener | US-05, US-06 |
| US-08 | src/components/ProtectedRoute.jsx | ProtectedRoute component | US-07 |
| US-09 | src/components/Layout/Header.jsx | displayEmail() | US-07 |
| US-10 | Supabase Dashboard | (setup automático) | Nenhuma |
| US-11 | supabase/migrations/*.sql | CREATE TABLE + RLS | US-10 |
| US-12 | supabase/migrations/*.sql | CREATE TABLE user_settings | US-11 |
| US-13 | supabase/migrations/*.sql | CREATE TRIGGER | US-12 |
| US-15 | src/api/brothers.js | getBrothers(), createBrother(), ... | US-01, US-02, US-11 |
| US-16 | src/api/carts.js | getCarts(), createCart(), ... | US-01, US-02, US-11 |
| US-17 | src/api/locations.js | getLocations(), createLocation(), ... | US-01, US-02, US-11 |
| US-18 | src/api/groups.js | getGroups(), createGroup(), ... | US-01, US-02, US-11 |
| US-19 | src/api/slots.js | getSlots(), createSlot(), ... | US-01, US-02, US-11 |
| US-20 | src/api/scheduleWeeks.js | getScheduleWeeks(), createScheduleWeek(), ... | US-01, US-02, US-11 |
| US-21 | src/api/assignments.js | getAssignments(), upsertAssignment(), ... | US-01, US-02, US-11 |
| US-22 | src/api/userSettings.js | getCongregationName(), updateCongregationName() | US-01, US-02, US-12 |
| US-23 | src/store/useAppStore.js | async actions (fetchBrothers, createBrother, ...) | US-15-22 |
| US-24 | src/store/useAppStore.js | setCurrentUser(), currentUser state | US-23 |
| US-25 | src/store/useAppStore.js | initializeStoreData() | US-23, US-24 |
| US-26 | src/pages/Dashboard.jsx | render com loading state | US-23, US-25 |
| US-27 | src/pages/Brothers.jsx | CRUD UI | US-23, US-26 |
| US-28 | src/pages/Carts.jsx | CRUD UI | US-23, US-26 |
| US-29 | src/pages/Locations.jsx | CRUD UI | US-23, US-26 |
| US-30 | src/pages/Schedule.jsx | CRUD UI de assignments | US-23, US-26, US-21 |
| US-31 | src/pages/Settings.jsx | congregation_name update | US-22, US-23 |
| US-32 | src/api/export.js | exportAllData() | US-15-22 |
| US-33 | src/api/import.js | importDataFromJSON() | US-15-22, US-32 |
| US-37 | supabase/migrations/*.sql | CREATE TABLE user_profiles + trigger | US-13 |
| US-38 | src/pages/Admin/Users.jsx | getPendingUsers(), approveUser(), blockUser() | US-37, US-15 |
| US-39 | src/components/AdminOnly.jsx | useRoleCheck(), renderização condicional | US-37, US-38 |
| US-40 | src/store/useAuthStore.js | userProfile state, setUserProfile() | US-37, US-39 |
| US-41 | src/api/userProfiles.js | updateUserApprovalStatus(), updateUserRole() | US-37, US-04 |
| US-34 | src/db/, vite.config.js | (removal) | EP-04 complete |
| US-35 | src/ (global) | (removal of localStorage refs) | US-22, US-31 |
| US-36 | (audit) | (grep verification) | US-34, US-35 |

---

## Conclusão

**39 User Stories** estruturadas em **9 Épicos**, tecnicamente precisas e prontas para desenvolvimento. Cada story tem:

- ✅ Critérios de aceite em Gherkin português
- ✅ Notas técnicas com arquivos/funções concretas
- ✅ Dependências explícitas
- ✅ Rastreabilidade completa

**Nota**: Controle de acesso é feito via **RBAC (Role-Based Access Control)** na aplicação (EP-09), não via RLS (Row Level Security) no banco.

**Pronto para entrega a agente de desenvolvimento.**
