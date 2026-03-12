# Estágio 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Gera o build da aplicação
RUN npm run build

# Estágio 2: Produção com Nginx
FROM nginx:stable-alpine

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no build para o diretório servido pelo Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta padrão do Nginx
EXPOSE 80

# Mantém o container em execução
CMD ["nginx", "-g", "daemon off;"]