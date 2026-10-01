FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server

COPY . .

ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build && npm run build --prefix server \
    && npm prune --omit=dev && npm prune --prefix server --omit=dev

ENV NODE_ENV=production
ENV PORT=4200
EXPOSE 4200

CMD ["node", "server/dist/index.js"]
