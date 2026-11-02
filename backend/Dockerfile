FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --no-save prisma@5.22.0
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
