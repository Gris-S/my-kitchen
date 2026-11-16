#!/usr/bin/env bash
# Crée le jeton permanent de MY KITCHEN sur le vrai KitchenOwl et l'écrit dans
# livraison/my-kitchen/compose.yaml. Le mot de passe est demandé ici, n'est
# affiché nulle part et ne sert qu'une fois ; le jeton n'est pas affiché non plus.
set -euo pipefail
cd "$(dirname "$0")/.."
# Adresse de KitchenOwl : variable KITCHENOWL_URL, ou fichier outils/nas.local (non publié).
KO="${KITCHENOWL_URL:-$(cat outils/nas.local 2>/dev/null)}"
[ -n "$KO" ] || { echo "Indique l'adresse de KitchenOwl : KITCHENOWL_URL=http://IP-DU-NAS:8083 $0" >&2; exit 1; }
COMPOSE=livraison/my-kitchen/compose.yaml
[ -f "$COMPOSE" ] || outils/livraison.sh >/dev/null
read -rp "Identifiant KitchenOwl : " USERNAME
read -rsp "Mot de passe : " PASSWORD; echo
LOGIN=$(USERNAME="$USERNAME" PASSWORD="$PASSWORD" python3 -c 'import json,os;print(json.dumps({"username":os.environ["USERNAME"],"password":os.environ["PASSWORD"],"device":"MY KITCHEN (connexion temporaire)"}))' \
  | curl -sf -X POST "$KO/api/auth" -H 'Content-Type: application/json' --data-binary @-) \
  || { echo "Connexion refusée : identifiant ou mot de passe faux, ou KitchenOwl injoignable." >&2; exit 1; }
unset PASSWORD
ACCESS=$(python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])' <<<"$LOGIN")
TOKEN=$(curl -sf -X POST "$KO/api/auth/llt" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -d '{"device":"MY KITCHEN"}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["longlived_token"])')
# La session temporaire ouverte pour l'occasion est refermée.
curl -sf -X DELETE "$KO/api/auth" -H "Authorization: Bearer $ACCESS" >/dev/null || true
TOKEN="$TOKEN" python3 - "$COMPOSE" <<'PY'
import os, re, sys
p = sys.argv[1]
s = open(p).read()
s = re.sub(r'KITCHENOWL_TOKEN: ".*"', 'KITCHENOWL_TOKEN: "%s"' % os.environ["TOKEN"], s)
open(p, "w").write(s)
PY
chmod 600 "$COMPOSE"
echo "Jeton créé et écrit dans $(pwd)/$COMPOSE (visible dans KitchenOwl sous le nom « MY KITCHEN »)."
