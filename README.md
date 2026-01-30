# 📅 ClassSync - Controle de Presença Inteligente

Um aplicativo moderno e responsivo para professores e instrutores gerenciarem a presença de alunos e o tempo de duração de contratos baseados em aulas.

## 🚀 Funcionalidades

- **Cálculo Dinâmico:** O término do plano é recalculado automaticamente a cada falta (gerando reposição).
- **Dashboard do Aluno:** Visualize progresso, próximas aulas e estatísticas mensais.
- **Sincronização:** Suporte a banco de dados em nuvem via Supabase para uso em múltiplos dispositivos.
- **Offline First:** Funciona localmente no navegador mesmo sem internet.

## 🛠️ Como colocar "No Ar" (Vercel)

Para usar este app no seu celular como um site real:

1. Suba os arquivos para um repositório no **GitHub**.
2. Crie uma conta gratuita em [vercel.com](https://vercel.com).
3. Clique em **"Add New"** > **"Project"**.
4. Importe o repositório do GitHub.
5. Clique em **"Deploy"**.
6. A Vercel te dará um link (ex: `meu-app.vercel.app`) para você acessar de onde quiser!

## ☁️ Configuração da Nuvem (Supabase)

Para habilitar a sincronização:

1. Crie um projeto no [Supabase](https://supabase.com).
2. No menu **SQL Editor**, execute:
   ```sql
   create table class_sync_data (
     id text primary key,
     plans jsonb not null,
     updated_at timestamp with time zone default now()
   );
   alter table class_sync_data enable row level security;
   create policy "Acesso Público" on class_sync_data for all using (true) with check (true);
   ```
3. Copie a **Project URL** e a **Anon Key** para as configurações de nuvem dentro do App.

---
Desenvolvido com ❤️ para facilitar a gestão de aulas.
