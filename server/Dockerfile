FROM node:22-alpine

WORKDIR /app

# Apetraho aloha ny dependencies (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

# Healthcheck: mijery ny /health (fetch global ao amin'ny Node 22)
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
