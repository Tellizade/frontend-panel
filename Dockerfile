FROM node:22-bookworm-slim AS build

# Farklı ortam: docker build --build-arg VITE_API_BASE_URL=https://...
ARG VITE_API_BASE_URL=https://backend-496709738148.europe-west1.run.app/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
