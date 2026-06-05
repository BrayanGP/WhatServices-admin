FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_PUBLIC_BACKEND_URL
ENV VITE_PUBLIC_BACKEND_URL=$VITE_PUBLIC_BACKEND_URL
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine sustituye las variables de entorno en los templates al arrancar
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
