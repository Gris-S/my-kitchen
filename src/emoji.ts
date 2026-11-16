// Un emoji devant chaque ingrédient (tuiles du Frigo). On cherche un mot-clé dans
// le nom, du plus précis au plus général : « pomme de terre » avant « pomme ».
// shortcut: liste écrite à la main ; un ingrédient inconnu prend 🥄, on complète au besoin.

import { norm } from './fridge'

const TABLE: [string[], string][] = [
  [['pomme de terre', 'patate'], '🥔'],
  [['pate brisee', 'pate feuilletee', 'pate sablee', 'pate a pizza'], '🥧'],
  [['sauce tomate', 'concentre de tomate', 'coulis'], '🥫'],
  [['jaune d oeuf', 'blanc d oeuf', 'oeuf'], '🥚'],
  [['lait de coco'], '🥥'],
  [['beurre'], '🧈'],
  [['creme', 'lait', 'yaourt', 'fromage blanc'], '🥛'],
  [['fromage', 'emmental', 'cheddar', 'parmesan', 'mascarpone', 'mozzarella', 'gruyere', 'comte', 'chevre', 'feta', 'ricotta'], '🧀'],
  [['huile', 'olive'], '🫒'],
  [['farine', 'ble', 'semoule'], '🌾'],
  [['amidon', 'fecule', 'mais'], '🌽'],
  [['sucre', 'cassonade', 'sirop'], '🍬'],
  [['miel'], '🍯'],
  [['chocolat', 'cacao'], '🍫'],
  [['sel'], '🧂'],
  [['poivre', 'piment', 'curry', 'paprika', 'cumin', 'muscade', 'epice', 'cannelle', 'cayenne', 'chili'], '🌶️'],
  [['poivron'], '🫑'],
  [['ail'], '🧄'],
  [['oignon', 'echalote', 'poireau', 'ciboulette'], '🧅'],
  [['gingembre'], '🫚'],
  [['tomate'], '🍅'],
  [['carotte'], '🥕'],
  [['champignon'], '🍄'],
  [['brocoli', 'chou'], '🥦'],
  [['salade', 'laitue', 'epinard', 'roquette', 'mache'], '🥬'],
  [['concombre', 'cornichon', 'courgette'], '🥒'],
  [['aubergine'], '🍆'],
  [['avocat'], '🥑'],
  [['citron'], '🍋'],
  [['orange', 'clementine', 'mandarine'], '🍊'],
  [['pomme', 'compote'], '🍎'],
  [['poire'], '🍐'],
  [['banane'], '🍌'],
  [['fraise', 'framboise', 'fruits rouges'], '🍓'],
  [['raisin'], '🍇'],
  [['coco'], '🥥'],
  [['petits pois', 'pois', 'haricot vert', 'feve'], '🫛'],
  [['lentille', 'haricot', 'pois chiche'], '🫘'],
  [['noix', 'amande', 'noisette', 'cacahuete', 'pistache', 'sesame'], '🥜'],
  [['basilic', 'persil', 'coriandre', 'thym', 'laurier', 'menthe', 'romarin', 'herbe', 'estragon', 'aneth', 'assaisonnement', 'origan', 'herbes de provence'], '🌿'],
  [['poulet', 'volaille', 'dinde', 'canard', 'cuisse'], '🍗'],
  [['lardon', 'bacon', 'jambon', 'chorizo', 'saucisse', 'saucisson'], '🥓'],
  [['viande', 'boeuf', 'veau', 'porc', 'agneau', 'steak', 'hache'], '🥩'],
  [['saumon', 'thon', 'poisson', 'cabillaud', 'truite'], '🐟'],
  [['crevette', 'gambas'], '🦐'],
  [['riz'], '🍚'],
  [['pate', 'tagliatelle', 'lasagne', 'spaghetti', 'nouille', 'penne', 'macaroni', 'gnocchi', 'fettuccine', 'linguine', 'ravioli'], '🍝'],
  [['pain', 'baguette', 'brioche', 'levure'], '🍞'],
  [['bouillon', 'soupe', 'fond de'], '🍲'],
  [['vinaigre', 'sauce soja', 'sauce'], '🍶'],
  [['vin'], '🍷'],
  [['biere'], '🍺'],
  [['cafe'], '☕'],
  [['the'], '🍵'],
  [['eau'], '💧'],
  [['baileys', 'rhum', 'whisky', 'liqueur', 'cognac', 'amaretto'], '🥃'],
]

// Mots-clés comparés mot à mot : « ail » ne doit pas trouver « mayonnaise ».
const RULES = TABLE.flatMap(([keys, emoji]) => keys.map((k) => [norm(k).split(' '), emoji] as const))

export function ingredientEmoji(name: string): string {
  const words = norm(name).split(' ')
  for (const [key, emoji] of RULES)
    for (let i = 0; i + key.length <= words.length; i++)
      if (key.every((k, j) => words[i + j] === k || (j === key.length - 1 && words[i + j].startsWith(k) && k.length > 3)))
        return emoji
  return '🥄'
}
