# Guia de Publicação do GestorPro no GitHub e Hostinger

Este projecto está preparado para ser enviado para o **GitHub** e importado directamente na **Hostinger** com o seu domínio personalizado.

---

## Passo 1 — Enviar o código para o GitHub

No terminal (na pasta do projecto):

```bash
git init
git add .
git commit -m "Versão inicial GestorPro pronta para Hostinger"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/gestorpro.git
git push -u origin main
```

> **Nota:** O ficheiro `firebase-applet-config.json` contém apenas a configuração pública do cliente Firebase e já está incluído para que o build funcione imediatamente na Hostinger sem configurações extra.

---

## Passo 2 — Importar na Hostinger a partir do GitHub

Pode usar **qualquer uma** das duas opções da Hostinger:

### Opção A: Hostinger Web App / Node.js (Recomendado se importar o repositório Vite directamente)
1. No **hPanel da Hostinger**, vá a **Sites** → **Adicionar Site** → **Aplicação Web / Node.js** (ou **Deploy from GitHub**).
2. Ligue a sua conta **GitHub** e escolha o repositório `gestorpro` (branch `main`).
3. Configure os comandos de build:
   - **Versão do Node.js:** `20` (ou superior)
   - **Comando de instalação:** `npm install`
   - **Comando de build:** `npm run build`
   - **Comando de arranque:** `npm start` *(arranca o servidor `server.mjs` que serve a pasta `dist/`)*
4. Clique em **Implementar / Deploy**.

### Opção B: Hospedagem Web / Sites Estáticos (Static Site via GitHub)
1. No **hPanel**, escolha **Sites** → **Site Estático (GitHub)** ou configure o deploy para a pasta `dist`:
   - **Framework:** `Vite`
   - **Comando de build:** `npm run build`
   - **Directório de saída (Publish/Output directory):** `dist`
2. Os ficheiros `public/.htaccess` e `public/_redirects` já são copiados automaticamente para dentro de `dist/`, garantindo rotas SPA e funcionamento correcto do PWA no Apache/LiteSpeed da Hostinger.

---

## Passo 3 — Ligar o seu Domínio da Hostinger e SSL

1. No hPanel, associe o seu domínio (ex.: `gestorpro.co.mz` ou `app.seudominio.com`) ao site implementado.
2. Active o **Certificado SSL gratuito (HTTPS)** na Hostinger — o HTTPS é obrigatório para instalação como aplicação (PWA) e funcionamento offline.

---

## Passo 4 — Autorizar o Domínio no Firebase (MUITO IMPORTANTE)

Depois de ligar o seu domínio da Hostinger, **autorize o domínio no Firebase** para que o login com Google funcione sem erros:

1. Aceda à **Firebase Console** (`natural-buckeye-wtvkm`).
2. Abra **Authentication** → **Settings** → **Authorized domains**.
3. Clique em **Add domain** e adicione o seu domínio da Hostinger:
   - `seudominio.com`
   - `www.seudominio.com` (se utilizar `www`)
4. Confirme também em **Authentication → Sign-in method** que **Google** e **Email/Password** (usado para o acesso por telefone) estão **Activados**.
