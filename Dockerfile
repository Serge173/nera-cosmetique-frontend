FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/ scripts/
RUN npm ci

COPY . .
RUN npm run build:prod

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/nera-cosmetique-web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
