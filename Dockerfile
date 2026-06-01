# Multi-stage Dockerfile: build client then run server
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --silent
COPY --from=build /app/dist ./dist
COPY server.cjs ./
COPY data ./data
EXPOSE 4000
CMD ["node","server.cjs"]
