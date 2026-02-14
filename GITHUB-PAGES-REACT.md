# Substituir o site no GitHub Pages pelo React (www.racionaljazzband.com.br)

O repositório hoje tem:
- **Raiz:** site antigo (HTML + CSS + Tailwind) em `index.html`
- **frontend/:** site novo em React (Vite)

Este guia explica como passar a publicar **só o React** no GitHub Pages, no domínio **www.racionaljazzband.com.br**.

---

## 1. O que foi adicionado no repositório

- **`.github/workflows/deploy-github-pages.yml`**  
  A cada push em `main`/`master` (quando houver mudança em `frontend/`), o workflow:
  1. Faz o build do React (`npm run build` em `frontend/`)
  2. Publica a pasta `frontend/dist` no **GitHub Pages** (via GitHub Actions)

Assim, o que estiver configurado como “fonte” do Pages passará a ser o build do React, não mais o `index.html` da raiz.

---

## 2. Configurar o GitHub Pages para usar o React

No repositório no GitHub:

1. Vá em **Settings** → **Pages** (menu lateral).
2. Em **Build and deployment** → **Source**:
   - Se estiver **“Deploy from a branch”** (ex.: branch `main` ou `gh-pages`), mude para **“GitHub Actions”**.
   - Assim o Pages passa a usar o que o workflow `Deploy React no GitHub Pages` publicar, ou seja, o build do React.
3. Em **Custom domain**, mantenha **www.racionaljazzband.com.br** (ou o que você usa).
4. Salve. O próximo deploy do workflow vai atualizar o site.

Não é necessário criar branch `gh-pages` manualmente: o deploy é feito direto pelo workflow.

---

## 3. Resumo do que você precisa fazer

| Passo | Ação |
|-------|------|
| 1 | **Settings** → **Pages** → **Source** = **GitHub Actions**. |
| 2 | Manter o **Custom domain** = **www.racionaljazzband.com.br**. |
| 3 | Dar **push** em `main`/`master` (com alteração em `frontend/` ou no workflow) para rodar o deploy. |

Depois disso, **www.racionaljazzband.com.br** passará a exibir o site em React; o `index.html` da raiz deixa de ser usado pelo Pages.

---

## 4. Se quiser enviar a configuração atual do Pages

Se você enviar como está a tela **Settings → Pages** (por exemplo, print ou texto: Source, Branch, Folder, Custom domain), dá para conferir se falta algum ajuste (domínio, HTTPS, etc.) e alinhar com o que está neste guia.

---

## 5. Observações

- O **site antigo** (HTML/CSS) continua no repositório na raiz; ele só deixa de ser servido pelo Pages quando a fonte for **GitHub Actions** e o workflow publicar o build do React.
- A **API** do backend (Cloud Run) já está configurada no frontend (`VITE_API_BASE`). Não é preciso mudar nada no domínio da HostGator para o React no GitHub Pages: o domínio **www.racionaljazzband.com.br** deve apontar para o GitHub Pages (registro do domínio / DNS), como já está hoje.
