#!/usr/bin/env python3
"""Passe le foyer KitchenOwl en français : rayons et articles par défaut avec la
traduction officielle de KitchenOwl (backend/templates/l10n/fr.json), articles
perso corrigés à la main, doublons fusionnés (sinon KitchenOwl ignore le
renommage sans prévenir).

  francaiser.py plan  <items.json> <cats.json> <fr.json> <plan.json>
  francaiser.py appliquer <plan.json> <choix.txt>   (KITCHENOWL_URL, KITCHENOWL_TOKEN)

Faire une sauvegarde (export du foyer) avant d'appliquer.
"""
import json, os, sys, unicodedata, urllib.request

# Articles créés par les imports, corrigés à la main (clé : nom actuel en minuscules).
MANUEL = {
    "4 jaunes d'oeufs": "Jaunes d'œufs",
    "aile": "Ail",
    "boneless skinless chicken thighs*": "Cuisses de poulet sans os ni peau",
    "cuisses de poulet sans os et sans peau*": "Cuisses de poulet sans os ni peau",
    "gingembre frais râpé***": "Gingembre frais râpé",
    "grated fresh ginger***": "Gingembre frais râpé",
    "nom de l'œuf": "Œufs",
    "sesame seeds": "Graines de sésame",
    "toasted sesame oil": "Huile de sésame grillée",
    "whole green onions": "Oignons verts entiers",
    "baileys": "Baileys",
    "beurre demi-sel ( pas de cristaux )": "Beurre demi-sel",
    "blanquette de veau": "Veau pour blanquette",
    "bouillon": "Bouillon",
    "extrait de cafe": "Extrait de café",
    "laurier": "Laurier",
    "lentille corail": "Lentilles corail",
    "levure fraiche": "Levure fraîche",
    "meat": "Viande hachée",
    "muscade": "Muscade",
    "tranche de fromage": "Tranches de fromage",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower().replace("œ", "oe"))
    return " ".join("".join(c for c in s if not unicodedata.combining(c)).split())


def plan(items_p, cats_p, fr_p, out_p):
    items, cats, fr = (json.load(open(p)) for p in (items_p, cats_p, fr_p))
    ops = []
    for c in cats:
        new = fr["categories"].get(c.get("default_key") or "")
        if new and new != c["name"]:
            ops.append({"id": f"rayon-{c['id']}", "kind": "rayon", "cat": c["id"], "old": c["name"], "new": new})

    target = {}
    for i in items:
        t = fr["items"].get(i.get("default_key") or "") or MANUEL.get(i["name"].lower()) or i["name"]
        target[i["id"]] = t
    groups = {}
    for i in items:
        groups.setdefault(norm(target[i["id"]]), []).append(i)

    for key, members in groups.items():
        # Garde l'article par défaut rangé dans un rayon, sinon le premier.
        keep = sorted(members, key=lambda i: (not i.get("default_key"), not i.get("category_id"), i["id"]))[0]
        new = target[keep["id"]]
        others = [m for m in members if m["id"] != keep["id"]]
        if not others and new == keep["name"]:
            continue
        perso = not keep.get("default_key") or any(not m.get("default_key") for m in others)
        ops.append({
            "id": f"article-{keep['id']}",
            "kind": "article-perso" if perso else "article-defaut",
            "keep": keep["id"],
            "merge": [m["id"] for m in others],
            "old": " + ".join(sorted({m["name"] for m in members})),
            "new": new,
        })
    json.dump(ops, open(out_p, "w"), ensure_ascii=False, indent=1)
    kinds = {}
    for o in ops:
        kinds[o["kind"]] = kinds.get(o["kind"], 0) + 1
    print(kinds)


def call(method, path, body):
    req = urllib.request.Request(
        os.environ["KITCHENOWL_URL"].rstrip("/") + "/api" + path,
        data=json.dumps(body).encode(), method=method,
        headers={"Authorization": "Bearer " + os.environ["KITCHENOWL_TOKEN"], "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def appliquer(plan_p, choix_p):
    ops = json.load(open(plan_p))
    chosen = set(open(choix_p).read().split())
    # La case « article-defaut » couvre les simples renommages ; chaque fusion se coche à part.
    todo = [o for o in ops if o["id"] in chosen or ("article-defaut" in chosen and o["kind"] == "article-defaut" and not o["merge"])]
    failed = []
    for o in todo:
        if o["kind"] == "rayon":
            call("POST", f"/category/{o['cat']}", {"name": o["new"]})
            continue
        for m in o["merge"]:  # fusionner d'abord : libère le nom pour le renommage
            call("POST", f"/item/{o['keep']}", {"merge_item_id": m})
        r = call("POST", f"/item/{o['keep']}", {"name": o["new"]})
        if r["name"] != o["new"]:
            failed.append(o)
    for o in list(failed):  # un nom pris par un article renommé ensuite : on réessaie
        if call("POST", f"/item/{o['keep']}", {"name": o["new"]})["name"] == o["new"]:
            failed.remove(o)
    if "langue" in chosen:
        call("POST", f"/household/{os.environ['HOUSEHOLD']}", {"language": "fr"})
    print(f"{len(todo)} changements appliqués, {len(failed)} renommages refusés :",
          [f"{o['old']} → {o['new']}" for o in failed])


if __name__ == "__main__":
    {"plan": plan, "appliquer": appliquer}[sys.argv[1]](*sys.argv[2:])
