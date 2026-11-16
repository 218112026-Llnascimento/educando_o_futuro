FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server
COPY index.html cadastro.html consulta.html painel.html ./public/
COPY css ./public/css
COPY js ./public/js
ENV PUBLIC_DIR=/app/public PORT=3000
EXPOSE 3000
CMD ["node", "server/server.js"]
