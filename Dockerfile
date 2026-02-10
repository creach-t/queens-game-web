# Multi-stage build pour optimiser la taille de l'image finale

# Stage 1: Build de l'application
FROM node:20-alpine AS builder

WORKDIR /app

# Variables Firebase injectées au build (via --build-arg ou .env)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_DATABASE_URL
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application pour la production
RUN npm run build

# Stage 2: Serveur nginx avec config SPA
FROM nginx:alpine

# Config nginx pour SPA (gère les routes côté client)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck pour zero-downtime deploy
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
