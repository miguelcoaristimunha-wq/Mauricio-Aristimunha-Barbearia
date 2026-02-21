# Guia de Deploy - Maurício Aristimunha Barbearia

Este projeto foi preparado para ser hospedado facilmente na Vercel ou em qualquer servidor que suporte aplicações estáticas (Vite).

## 🚀 Como subir na Vercel (Recomendado)

1. **Repositório:** Envie o código para o seu GitHub, GitLab ou Bitbucket.
2. **Importar:** No dashboard da Vercel, clique em "Add New" > "Project" e importe o seu repositório.
3. **Variáveis de Ambiente:** No passo de configuração do projeto na Vercel, localize a seção "Environment Variables" e adicione as seguintes chaves (os valores você encontra no seu painel do Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy:** Clique em "Deploy". A Vercel detectará automaticamente as configurações do Vite.

## 🏠 Como hospedar manualmente (Self-Hosting)

Se você quiser hospedar em seu próprio servidor ou hospedagem simples:

1. **Build do Projeto:** No terminal, dentro da pasta do projeto, rode:
   ```bash
   npm run build
   ```
2. **Pasta Dist:** Esse comando criará uma pasta chamada `dist`.
3. **Upload:** Envie todo o conteúdo da pasta `dist` (não a pasta em si, mas o que tem dentro dela) para o seu servidor via FTP ou Painel de Controle.
4. **SPA Config:** Como o app é uma Single Page Application (SPA), certifique-se de que o seu servidor redirecione todas as rotas para o `index.html`. 
   - Na Vercel, o arquivo `vercel.json` incluído já faz isso.
   - No Apache (com `.htaccess`), você precisará de uma regra de regravação.

## 🛠️ Manutenção

- **Atualizações:** Sempre que fizer mudanças no código, lembre-se de rodar o `npm run build` novamente se estiver hospedando manualmente.
- **Segurança:** Nunca compartilhe o seu arquivo `.env.local`. Use o `.env.example` como base para novas instalações.
