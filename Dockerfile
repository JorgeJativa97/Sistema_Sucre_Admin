# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Argumentos de build para variables de entorno
ARG VITE_API_BASE_URL
ARG VITE_API_TOKEN
ARG VITE_API_CT_VENCIDA
ARG VITE_API_CT_VENCIDA_IMPUESTO
ARG VITE_API_CT_VENCIDA_TITULO
ARG VITE_API_CT_VENCIDA_DETALLE
ARG VITE_API_TITULOS

# Establecer variables de entorno para el build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TOKEN=$VITE_API_TOKEN
ENV VITE_API_CT_VENCIDA=$VITE_API_CT_VENCIDA
ENV VITE_API_CT_VENCIDA_IMPUESTO=$VITE_API_CT_VENCIDA_IMPUESTO
ENV VITE_API_CT_VENCIDA_TITULO=$VITE_API_CT_VENCIDA_TITULO
ENV VITE_API_CT_VENCIDA_DETALLE=$VITE_API_CT_VENCIDA_DETALLE
ENV VITE_API_TITULOS=$VITE_API_TITULOS

# Construir la aplicación
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
