# Build e execução do backend RJB (Cloud Run) a partir desta pasta.
# Build: docker build -t rjb-email-sender .   (rodar de dentro de backend/send-email)
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 8080

ENV NODE_ENV=production
CMD ["node", "index.js"]
