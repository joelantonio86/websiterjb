# Deploy do backend no Cloud Run (rjb-email-sender)

O serviço **rjb-email-sender** precisa ser construído a partir da pasta **backend/send-email** para que as rotas `/api/public/health` e `/api/public/stats/members-by-state` existam.  
Só "Implantar nova revisão" sem **reconstruir a imagem** mantém o código antigo.

---

## O que foi adicionado no repositório

- **backend/send-email/Dockerfile** – build do Node a partir dessa pasta.
- **cloudbuild.yaml** (raiz) – script do Cloud Build que usa esse Dockerfile e faz o deploy no Cloud Run.
- **backend/send-email/.dockerignore** – evita copiar `node_modules` etc. para a imagem.

---

## Opção A: Cloud Build pelo Console (recomendado)

1. **Conectar o repositório ao Cloud Build (se ainda não estiver):**
   - **Cloud Build** → **Repositórios** → conectar o repositório (GitHub `websiterjb`).
   - Escolher a branch **main**.

2. **Criar o repositório de imagens no Artifact Registry (uma vez):**
   - **Artifact Registry** → **Criar repositório**.
   - Nome: `cloud-run-source-deploy` (ou o nome que você usar no `cloudbuild.yaml`).
   - Formato: **Docker**.
   - Região: **europe-west1** (mesma do Cloud Run).

3. **Disparar o build com o `cloudbuild.yaml`:**
   - **Cloud Build** → **Histórico** → **Disparar build**.
   - **Fonte:** repositório conectado, branch **main**.
   - **Configuração:** **Arquivo de configuração do Cloud Build**.
   - Caminho: `cloudbuild.yaml` (na raiz do repositório).
   - **Substituições:** deixar padrão (ou ajustar `_SERVICE_NAME` e `_REGION` se precisar).
   - Disparar o build.

4. **Aguardar o fim do build.** O passo de deploy do `cloudbuild.yaml` já implanta no Cloud Run. Se der erro de permissão, o serviço do Cloud Build precisa da role **Cloud Run Admin** e **Storage** (para a imagem).

5. **Testar:**
   - `https://rjb-email-sender-215755766100.europe-west1.run.app/api/public/health`
   - Depois: `https://rjb-email-sender-215755766100.europe-west1.run.app/api/public/stats/members-by-state`

---

## Opção B: Linha de comando (gcloud)

Na **raiz do repositório** (onde está o `cloudbuild.yaml`):

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

Isso usa o código da **main** (ou da branch atual) e o `cloudbuild.yaml` que aponta para **backend/send-email**.  
Antes, faça login e defina o projeto:

```bash
gcloud auth login
gcloud config set project SEU_PROJECT_ID
```

Se o repositório de imagens no Artifact Registry tiver outro nome ou região, edite as linhas do `cloudbuild.yaml` que usam `europe-west1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/...` e ajuste para o seu repositório.

---

## Se a imagem for em outro repositório (Artifact Registry)

Se o projeto já usa um repositório de imagens com outro nome (por exemplo, criado pelo “Deploy from repository” do Cloud Run), abra o **Cloud Run** → **rjb-email-sender** → aba **Imagem** e veja a URL da imagem atual (ex.: `europe-west1-docker.pkg.dev/PROJECT_ID/OUTRO_NOME/...`).  
Copie esse caminho (sem a tag) e, no `cloudbuild.yaml`, troque:

- `europe-west1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${_SERVICE_NAME}`  
por esse caminho (ex.: `europe-west1-docker.pkg.dev/${PROJECT_ID}/OUTRO_NOME/${_SERVICE_NAME}`).

Assim o build passa a enviar a imagem para o mesmo repositório que o Cloud Run já usa.

---

## Resumo

- O **código** das rotas está em **backend/send-email/index.js**.
- O **build** deve usar **backend/send-email** (Dockerfile + cloudbuild.yaml).
- Depois do deploy, teste **/api/public/health**; se retornar JSON com `version: "with-members-by-state"`, o código novo está no ar.
