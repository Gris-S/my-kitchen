<div align="center">

# MY KITCHEN

**Une interface sans connexion, en français et adaptée au téléphone pour ton [KitchenOwl](https://github.com/TomBursch/kitchenowl) auto-hébergé.**

*English: [README.md](README.md)*

</div>

---

## Construit sur KitchenOwl

MY KITCHEN n'est **qu'une interface**. Tout ce qu'elle affiche et enregistre est
géré par [KitchenOwl](https://github.com/TomBursch/kitchenowl), de **Tom Bursch
et ses contributeurs** (licence AGPL-3.0) : comptes, foyers, articles,
recettes, lecture des recettes en ligne, planning. MY KITCHEN passe par l'API
publique de KitchenOwl et ne contient aucun de son code. Ce projet n'est ni
affilié ni approuvé par KitchenOwl — le mérite leur revient d'abord :
[mets une étoile à KitchenOwl](https://github.com/TomBursch/kitchenowl).

La traduction des recettes anglaises est faite par
[LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) (AGPL-3.0),
hors ligne, sur ton serveur : pas de cloud, pas d'IA.

## Ce qu'elle ajoute

- **Plus jamais de connexion** : un petit serveur nginx ajoute le jeton
  permanent de KitchenOwl à chaque demande. Le navigateur ne voit jamais le
  jeton et n'a pas de session à garder.
- **Relais verrouillé** : seules les adresses utiles à l'interface passent ;
  comptes, mots de passe, jetons, export et suppression du foyer sont refusés.
- **Import de recettes qui marche en français**, mesures américaines converties,
  recettes anglaises traduites, photo de couverture récupérée.
- **Mode recette** pas à pas, **nombre de personnes** ajustable, **Frigo** en
  tuiles pour trouver quoi cuisiner avec ce qu'on a.

## Installation

Voir la section *How it runs* du [README anglais](README.md) :
`outils/livraison.sh`, puis `outils/jeton.sh` (une seule connexion, pour créer
le jeton), puis copier `livraison/my-kitchen/` sur le serveur.

> **Toute personne qui atteint le port 8084 peut utiliser ton foyer
> KitchenOwl.** Garde-le sur le réseau de la maison (ou derrière un VPN comme
> Tailscale), jamais ouvert sur Internet.

## Licence

MY KITCHEN : [GPL-3.0-or-later](LICENSE). KitchenOwl et LibreTranslate gardent
leurs licences (AGPL-3.0).
