# Estágio 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos (incluindo o tsconfig.json e vite.config.ts)
COPY . .

# Executa o build definido no seu package.json
RUN npm run build

# Estágio 2: Serve (Produção)
FROM nginx:stable-alpine

# Copia os arquivos gerados no estágio anterior para o diretório do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM nginx:stable-alpine
# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia os arquivos do build
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]