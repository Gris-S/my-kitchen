# MY KITCHEN : l'interface web, servie par nginx. Construire depuis la racine :
#   podman build -f docker/Dockerfile -t my-kitchen .
FROM --platform=$BUILDPLATFORM docker.io/library/node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm test && npm run build

FROM docker.io/nginxinc/nginx-unprivileged:1.30-alpine@sha256:ed04ec1ff34502c339ee5c3ae3f855442398edc1d05591e2b98981dcbbd20b1e
LABEL org.opencontainers.image.title="MY KITCHEN" \
      org.opencontainers.image.description="Interface sans connexion pour KitchenOwl : courses, recettes, planning."
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    TRANSLATE_URL=http://libretranslate:5000
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
