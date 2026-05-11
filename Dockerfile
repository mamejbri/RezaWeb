# Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm clean-install

COPY . .

RUN npm run build -- --configuration=production

# Serve via Nginx
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/reza-web/browser/ /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
