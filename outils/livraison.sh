#!/usr/bin/env bash
# Prépare livraison/my-kitchen/ : le dossier à copier sur le NAS.
# Image nginx standard + les fichiers de MY KITCHEN : aucune image à publier.
set -euo pipefail
cd "$(dirname "$0")/.."
# Adresse de KitchenOwl vue depuis le NAS : variable KITCHENOWL_URL, ou fichier
# outils/nas.local (non publié), par exemple http://192.168.1.10:8083.
KO="${KITCHENOWL_URL:-$(cat outils/nas.local 2>/dev/null)}"
[ -n "$KO" ] || { echo "Indique l'adresse de KitchenOwl : KITCHENOWL_URL=http://IP-DU-NAS:8083 $0" >&2; exit 1; }
npm test --silent
npm run build --silent
OUT=livraison/my-kitchen
mkdir -p "$OUT"
rm -rf "$OUT/site"
cp -r dist "$OUT/site"
cp docker/default.conf.template "$OUT/"
# Le compose est réécrit à chaque livraison, en gardant le jeton déjà créé (outils/jeton.sh).
OLD_TOKEN=$(grep -oP 'KITCHENOWL_TOKEN: "\K[^"]+' "$OUT/compose.yaml" 2>/dev/null || true)
cat > "$OUT/compose.yaml" <<'YAML'
services:
  my-kitchen:
    image: docker.io/nginxinc/nginx-unprivileged:1.30-alpine
    container_name: my-kitchen
    restart: unless-stopped
    ports:
      - "8084:8080"
    environment:
      KITCHENOWL_URL: "__KO__"
      KITCHENOWL_TOKEN: "A_REMPLIR_AVEC_outils/jeton.sh"
      TRANSLATE_URL: "http://libretranslate:5000"
      NGINX_ENTRYPOINT_LOCAL_RESOLVERS: "1"
    # Les fichiers copiés sur le NAS ne sont pas lisibles par l'utilisateur
    # limité de nginx : on les recopie en administrateur au démarrage, puis
    # nginx sert le site avec son utilisateur limité (« nginx »).
    volumes: ["./:/src:ro"]
    user: "0:0"
    entrypoint: ["/bin/sh", "-c", "mkdir -p /etc/nginx/templates && cp -r /src/site/. /usr/share/nginx/html/ && cp /src/default.conf.template /etc/nginx/templates/ && chmod -R a+rX /usr/share/nginx/html /etc/nginx/templates && exec /docker-entrypoint.sh nginx -g 'daemon off;'"]

  # Traducteur hors ligne anglais <-> français, joignable seulement par MY KITCHEN
  # (aucun port ouvert sur le réseau). Les modèles (~1 Go) se téléchargent au
  # premier démarrage puis restent dans le volume.
  libretranslate:
    image: docker.io/libretranslate/libretranslate:v1.9.6
    container_name: my-kitchen-traducteur
    restart: unless-stopped
    environment:
      LT_LOAD_ONLY: "en,fr"
    volumes:
      - traducteur:/home/libretranslate/.local

volumes:
  traducteur:
YAML
sed -i "s#__KO__#$KO#" "$OUT/compose.yaml"
chmod 600 "$OUT/compose.yaml"
if [ -n "$OLD_TOKEN" ] && [ "$OLD_TOKEN" != "A_REMPLIR_AVEC_outils/jeton.sh" ]; then
  TOKEN="$OLD_TOKEN" python3 - "$OUT/compose.yaml" <<'PY'
import os, re, sys
p = sys.argv[1]; s = open(p).read()
open(p, "w").write(re.sub(r'KITCHENOWL_TOKEN: ".*"', 'KITCHENOWL_TOKEN: "%s"' % os.environ["TOKEN"], s))
PY
fi
echo "Prêt : $(pwd)/$OUT"

# Version pour le NAS actuel : le projet UGOS « my_kitchen » vit dans
# docker/MY KITCHEN/ (le projet entier y a été copié), donc les fichiers sont
# sous ./livraison/my-kitchen. Copier ce docker-compose.yaml à la racine de ce
# dossier sur le NAS, à côté de livraison/.
sed 's#"\./:/src:ro"#"./livraison/my-kitchen:/src:ro"#' "$OUT/compose.yaml" > docker-compose.yaml
chmod 600 docker-compose.yaml
echo "Compose du NAS : $(pwd)/docker-compose.yaml"
