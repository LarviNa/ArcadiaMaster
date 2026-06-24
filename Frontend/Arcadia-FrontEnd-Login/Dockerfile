# Step 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time environment variables for Vite
ARG VITE_API_GATEWAY_URL
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
ARG VITE_LOGIN_URL
ENV VITE_LOGIN_URL=$VITE_LOGIN_URL
ARG VITE_ADMIN_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
ARG VITE_CLIENTES_URL
ENV VITE_CLIENTES_URL=$VITE_CLIENTES_URL

RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configure Nginx to support SPA routing (redirect all to index.html)
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
