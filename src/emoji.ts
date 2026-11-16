// Un emoji devant chaque ingrédient (tuiles du Frigo), noms français ou anglais. On cherche un mot-clé dans
// le nom, du plus précis au plus général : « pomme de terre » avant « pomme ».
// shortcut: liste écrite à la main ; un ingrédient inconnu prend 🥄, on complète au besoin.

import { norm } from './fridge'

const TABLE: [string[], string][] = [
  [['pomme de terre', 'patate', 'potato', 'potatoes'], '🥔'],
  [['pate brisee', 'pate feuilletee', 'pate sablee', 'pate a pizza', 'pastry', 'pie crust', 'puff pastry'], '🥧'],
  [['sauce tomate', 'concentre de tomate', 'coulis', 'tomato sauce', 'tomato paste', 'passata'], '🥫'],
  [['jaune d oeuf', 'blanc d oeuf', 'oeuf', 'egg', 'eggs', 'egg yolk'], '🥚'],
  [['lait de coco', 'coconut milk'], '🥥'],
  [['beurre', 'butter'], '🧈'],
  [['creme', 'lait', 'yaourt', 'fromage blanc', 'cream', 'milk', 'yogurt', 'yoghurt'], '🥛'],
  [['fromage', 'emmental', 'cheddar', 'parmesan', 'mascarpone', 'mozzarella', 'gruyere', 'comte', 'chevre', 'feta', 'ricotta', 'cheese'], '🧀'],
  [['huile', 'olive', 'oil'], '🫒'],
  [['farine', 'ble', 'semoule', 'flour'], '🌾'],
  [['amidon', 'fecule', 'mais', 'cornstarch', 'corn'], '🌽'],
  [['sucre', 'cassonade', 'sirop', 'sugar', 'syrup'], '🍬'],
  [['miel', 'honey'], '🍯'],
  [['chocolat', 'cacao', 'chocolate', 'cocoa'], '🍫'],
  [['sel', 'salt'], '🧂'],
  [['poivron', 'bell pepper'], '🫑'],
  [['poivre', 'piment', 'curry', 'paprika', 'cumin', 'muscade', 'epice', 'cannelle', 'cayenne', 'chili', 'pepper', 'paprika', 'cumin', 'nutmeg', 'cinnamon', 'spice', 'curry'], '🌶️'],
  [['ail', 'garlic'], '🧄'],
  [['oignon', 'echalote', 'poireau', 'ciboulette', 'onion', 'onions', 'shallot', 'leek', 'chives', 'scallion'], '🧅'],
  [['gingembre', 'ginger'], '🫚'],
  [['tomate', 'tomato', 'tomatoes'], '🍅'],
  [['carotte', 'carrot', 'carrots'], '🥕'],
  [['champignon', 'mushroom', 'mushrooms'], '🍄'],
  [['brocoli', 'chou', 'broccoli', 'cabbage'], '🥦'],
  [['salade', 'laitue', 'epinard', 'roquette', 'mache', 'lettuce', 'spinach', 'arugula', 'salad'], '🥬'],
  [['concombre', 'cornichon', 'courgette', 'cucumber', 'zucchini', 'pickle', 'pickles'], '🥒'],
  [['aubergine', 'eggplant'], '🍆'],
  [['avocat', 'avocado'], '🥑'],
  [['citron', 'lemon', 'lime'], '🍋'],
  [['orange', 'clementine', 'mandarine'], '🍊'],
  [['pomme', 'compote', 'apple', 'apples'], '🍎'],
  [['poire', 'pear'], '🍐'],
  [['banane', 'banana'], '🍌'],
  [['fraise', 'framboise', 'fruits rouges', 'strawberry', 'raspberry', 'berries'], '🍓'],
  [['raisin'], '🍇'],
  [['coco'], '🥥'],
  [['petits pois', 'pois', 'haricot vert', 'feve', 'peas', 'green beans'], '🫛'],
  [['lentille', 'haricot', 'pois chiche', 'lentil', 'lentils', 'beans', 'chickpeas'], '🫘'],
  [['noix', 'amande', 'noisette', 'cacahuete', 'pistache', 'sesame', 'nut', 'nuts', 'almond', 'almonds', 'peanut', 'peanuts', 'walnut', 'hazelnut', 'sesame seeds'], '🥜'],
  [['basilic', 'persil', 'coriandre', 'thym', 'laurier', 'menthe', 'romarin', 'herbe', 'estragon', 'aneth', 'assaisonnement', 'origan', 'herbes de provence', 'basil', 'parsley', 'cilantro', 'coriander', 'thyme', 'bay leaf', 'mint', 'rosemary', 'herbs', 'oregano', 'dill', 'seasoning'], '🌿'],
  [['poulet', 'volaille', 'dinde', 'canard', 'cuisse', 'chicken', 'turkey', 'duck'], '🍗'],
  [['lardon', 'bacon', 'jambon', 'chorizo', 'saucisse', 'saucisson', 'ham', 'sausage'], '🥓'],
  [['viande', 'boeuf', 'veau', 'porc', 'agneau', 'steak', 'hache', 'meat', 'beef', 'veal', 'pork', 'lamb', 'ground'], '🥩'],
  [['saumon', 'thon', 'poisson', 'cabillaud', 'truite', 'salmon', 'tuna', 'fish', 'cod', 'trout'], '🐟'],
  [['crevette', 'gambas', 'shrimp', 'prawns'], '🦐'],
  [['riz', 'rice'], '🍚'],
  [['pate', 'tagliatelle', 'lasagne', 'spaghetti', 'nouille', 'penne', 'macaroni', 'gnocchi', 'fettuccine', 'linguine', 'ravioli', 'pasta', 'noodles'], '🍝'],
  [['pain', 'baguette', 'brioche', 'levure', 'bread', 'yeast', 'toast'], '🍞'],
  [['bouillon', 'soupe', 'fond de', 'broth', 'stock', 'soup'], '🍲'],
  [['vinaigre', 'sauce soja', 'sauce', 'vinegar', 'soy sauce'], '🍶'],
  [['vin', 'wine'], '🍷'],
  [['biere', 'beer'], '🍺'],
  [['cafe', 'coffee'], '☕'],
  [['the', 'tea'], '🍵'],
  [['eau', 'water'], '💧'],
  [['baileys', 'rhum', 'whisky', 'liqueur', 'cognac', 'amaretto', 'rum', 'brandy'], '🥃'],
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
