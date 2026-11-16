<div align="center">

# MY KITCHEN

**A no-login, French, phone-friendly interface for your self-hosted [KitchenOwl](https://github.com/TomBursch/kitchenowl).**

Shopping list, recipes, recipe import from a link, meal planner, step-by-step
cooking mode and a "what's in my fridge?" finder — on top of the KitchenOwl
server you already run, with your data left where it is.

[![Licence](https://img.shields.io/badge/licence-GPL--3.0--or--later-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)

*Français : [README.fr.md](README.fr.md)*

</div>

---

## Built on KitchenOwl

MY KITCHEN is **only a front-end**. Everything it shows and saves lives in
[KitchenOwl](https://github.com/TomBursch/kitchenowl) by **Tom Bursch and its
contributors** (AGPL-3.0): accounts, households, items, recipes, the recipe
scraper, the planner. MY KITCHEN talks to KitchenOwl's public API and contains
none of its code. It is not affiliated with or endorsed by the KitchenOwl
project — if you like what you see, the credit goes to them first:
[star KitchenOwl](https://github.com/TomBursch/kitchenowl),
[read its docs](https://docs.kitchenowl.org).

The translation of English recipes is done by
[LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) (AGPL-3.0),
running offline next to it — no cloud, no AI service.

## What it adds

- **No login, ever.** A small nginx server sits in front of KitchenOwl and adds
  a KitchenOwl *long-lived token* to every request. The browser never sees the
  token and keeps no session, so nothing expires and it works over plain HTTP
  on your home network.
- **Locked-down proxy.** Only the API paths the interface uses are relayed;
  accounts, passwords, tokens, exports and household deletion are refused.
  Strict security headers (CSP, no framing, no referrer).
- **Recipe import that works in French**: its own ingredient parser
  ("20 cl de crème fraîche" → *Crème fraîche · 20 cl*), US units converted to
  metric (cups, oz, lb, °F, Tbsp → c. à soupe), English recipes translated
  automatically, cover photo fetched even when the site blocks KitchenOwl.
- **Cooking mode**: full screen, one step at a time, ingredients to tick.
- **Servings**: change the number of people, quantities follow.
- **Fridge**: tap the ingredients you have (tiles with emoji), get the recipes
  you can cook, best match first, with what's missing.
- Responsive (phone and desktop), light and dark, in French.

## How it runs

```
browser ──► MY KITCHEN (nginx :8084) ──► KitchenOwl API (:8083)
                     └──────────────────► LibreTranslate (internal only)
```

MY KITCHEN uses the stock `nginxinc/nginx-unprivileged` image plus a folder of
static files — no custom image to publish.

1. `npm ci`, then `outils/livraison.sh` (set `KITCHENOWL_URL=http://<nas>:8083`
   or write it in `outils/nas.local`). It builds `livraison/my-kitchen/` with the
   site, the nginx template and a `compose.yaml`.
2. `outils/jeton.sh` asks for your KitchenOwl login **once**, creates a
   long-lived token named "MY KITCHEN" and writes it into that `compose.yaml`
   (mode 600, never committed). Revoke it any time from KitchenOwl's settings.
3. Copy `livraison/my-kitchen/` to your server and start it with Docker Compose.

> **Anyone who can reach port 8084 can use your KitchenOwl household.** Keep it
> on your home network (or behind a VPN such as Tailscale); do not expose it to
> the Internet.

## Development

```bash
npm ci
npm test          # vitest: ingredient parser, units, servings, fridge, emoji, steps
KITCHENOWL_URL=http://127.0.0.1:8083 KITCHENOWL_TOKEN=<token> npm run dev
```

Vite plays the role of the nginx proxy in development (`vite.config.ts`).

## Licence

MY KITCHEN: [GPL-3.0-or-later](LICENSE).
KitchenOwl and LibreTranslate keep their own licences (AGPL-3.0).
