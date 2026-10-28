# Production Dockerfile for IndiStay Backend
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "run", "start:backend"]
