/* =======================================================================
   MODES — le contenu du jeu (choisi dans la page d'accueil).
   Chaque mode = { id, label, noun, items:[[id,name],…], image:(id)=>url }
   -----------------------------------------------------------------------
   Ajouter un mode = ajouter un objet ici. `image(id)` renvoie l'URL de
   l'image (drapeau, logo…). Astuce : on ne lit jamais les pixels du canvas,
   donc n'importe quelle image du web s'affiche (pas besoin de CORS).
   ======================================================================= */

/* ---- MARQUES (logos automatiques via Clearbit, par nom de domaine) ---- */
const BRANDS = [
  ['apple.com','Apple'],['google.com','Google'],['amazon.com','Amazon'],['microsoft.com','Microsoft'],
  ['nike.com','Nike'],['adidas.com','Adidas'],['coca-cola.com','Coca-Cola'],['pepsi.com','Pepsi'],
  ['mcdonalds.com','McDonald’s'],['starbucks.com','Starbucks'],['netflix.com','Netflix'],['spotify.com','Spotify'],
  ['youtube.com','YouTube'],['instagram.com','Instagram'],['tiktok.com','TikTok'],['facebook.com','Facebook'],
  ['samsung.com','Samsung'],['sony.com','Sony'],['tesla.com','Tesla'],['bmw.com','BMW'],
  ['mercedes-benz.com','Mercedes'],['audi.com','Audi'],['toyota.com','Toyota'],['ferrari.com','Ferrari'],
  ['ford.com','Ford'],['intel.com','Intel'],['nvidia.com','Nvidia'],['amd.com','AMD'],
  ['ibm.com','IBM'],['oracle.com','Oracle'],['paypal.com','PayPal'],['visa.com','Visa'],
  ['mastercard.com','Mastercard'],['disney.com','Disney'],['playstation.com','PlayStation'],['xbox.com','Xbox'],
  ['nintendo.com','Nintendo'],['redbull.com','Red Bull'],['gucci.com','Gucci'],['louisvuitton.com','Louis Vuitton'],
  ['chanel.com','Chanel'],['zara.com','Zara'],['uber.com','Uber'],['airbnb.com','Airbnb'],
  ['ebay.com','eBay'],['reddit.com','Reddit'],['twitch.tv','Twitch'],['snapchat.com','Snapchat'],
];

/* ---- CAPITALES (nom de ville + drapeau du pays, images flagcdn fiables) ---- */
const CAPITALS = [
  ['fr','Paris'],['gb','London'],['us','Washington'],['jp','Tokyo'],['cn','Beijing'],['ru','Moscow'],
  ['de','Berlin'],['it','Rome'],['es','Madrid'],['pt','Lisbon'],['nl','Amsterdam'],['be','Brussels'],
  ['ch','Bern'],['at','Vienna'],['gr','Athens'],['se','Stockholm'],['no','Oslo'],['dk','Copenhagen'],
  ['fi','Helsinki'],['ie','Dublin'],['pl','Warsaw'],['cz','Prague'],['hu','Budapest'],['ro','Bucharest'],
  ['ua','Kyiv'],['tr','Ankara'],['eg','Cairo'],['ma','Rabat'],['za','Pretoria'],['ng','Abuja'],
  ['ke','Nairobi'],['br','Brasília'],['ar','Buenos Aires'],['mx','Mexico City'],['ca','Ottawa'],['in','New Delhi'],
  ['id','Jakarta'],['kr','Seoul'],['th','Bangkok'],['vn','Hanoi'],['ph','Manila'],['au','Canberra'],
  ['nz','Wellington'],['sa','Riyadh'],['ae','Abu Dhabi'],['ir','Tehran'],['pk','Islamabad'],['bd','Dhaka'],
  ['sg','Singapore'],['cu','Havana'],
];

/* ---- CLUBS DE FOOT (logos via api-sports, par ID d'équipe) ----
   Pour AJOUTER/CORRIGER un club : l'image est media.api-sports.io/football/teams/<ID>.png
   → ouvre l'URL avec un ID pour vérifier le logo, puis mets [ID,'Nom'].
   NB : les 5 grands championnats sont fiables ; les autres compétitions
   européennes sont "best-effort" — si un écusson est faux, corrige le numéro. */
const CLUBS = [
  /* --- Premier League (Angleterre) --- */
  [33,'Manchester United'],[50,'Manchester City'],[40,'Liverpool'],[42,'Arsenal'],[49,'Chelsea'],
  [47,'Tottenham'],[34,'Newcastle'],[66,'Aston Villa'],[48,'West Ham'],[51,'Brighton'],
  [45,'Everton'],[52,'Crystal Palace'],[55,'Brentford'],[36,'Fulham'],[39,'Wolves'],
  [35,'Bournemouth'],[65,'Nottingham Forest'],[46,'Leicester'],[41,'Southampton'],[63,'Leeds'],
  /* --- La Liga (Espagne) --- */
  [541,'Real Madrid'],[529,'Barcelona'],[530,'Atlético Madrid'],[531,'Athletic Club'],[536,'Sevilla'],
  [533,'Villarreal'],[548,'Real Sociedad'],[543,'Real Betis'],[532,'Valencia'],[538,'Celta Vigo'],
  [546,'Getafe'],[547,'Girona'],[728,'Rayo Vallecano'],[727,'Osasuna'],[542,'Alavés'],
  [798,'Mallorca'],[540,'Espanyol'],[534,'Las Palmas'],
  /* --- Serie A (Italie) --- */
  [496,'Juventus'],[505,'Inter'],[489,'AC Milan'],[492,'Napoli'],[497,'Roma'],[487,'Lazio'],
  [499,'Atalanta'],[502,'Fiorentina'],[503,'Torino'],[494,'Udinese'],[495,'Genoa'],[500,'Bologna'],
  [490,'Cagliari'],[504,'Hellas Verona'],[867,'Lecce'],[1579,'Monza'],[511,'Empoli'],
  /* --- Bundesliga (Allemagne) --- */
  [157,'Bayern München'],[165,'Borussia Dortmund'],[168,'Bayer Leverkusen'],[173,'RB Leipzig'],
  [169,'Eintracht Frankfurt'],[172,'VfB Stuttgart'],[160,'Freiburg'],[161,'Wolfsburg'],
  [162,'Werder Bremen'],[163,'B. Mönchengladbach'],[164,'Mainz'],[167,'Hoffenheim'],
  [170,'Augsburg'],[182,'Union Berlin'],[192,'FC Köln'],[159,'Hertha Berlin'],
  /* --- Ligue 1 (France) --- */
  [85,'Paris Saint-Germain'],[81,'Marseille'],[80,'Lyon'],[91,'Monaco'],[84,'Nice'],[79,'Lille'],
  [94,'Rennes'],[116,'Lens'],[93,'Reims'],[83,'Nantes'],[82,'Montpellier'],[95,'Strasbourg'],
  [96,'Toulouse'],[97,'Lorient'],[106,'Brest'],
  /* --- Portugal --- */
  [212,'FC Porto'],[211,'Benfica'],[228,'Sporting CP'],[217,'SC Braga'],[224,'Vitória Guimarães'],
  /* --- Pays-Bas --- */
  [194,'Ajax'],[197,'PSV'],[209,'Feyenoord'],[201,'AZ Alkmaar'],[415,'Twente'],
  /* --- Écosse --- */
  [247,'Celtic'],[257,'Rangers'],
  /* --- Autres habitués des coupes d'Europe (best-effort, vérifie les logos) --- */
  [645,'Galatasaray'],[611,'Fenerbahçe'],[549,'Beşiktaş'],
  [553,'Olympiacos'],[619,'PAOK'],[617,'Panathinaikos'],[575,'AEK Athens'],
  [550,'Shakhtar Donetsk'],[572,'Dynamo Kyiv'],
  [569,'Club Brugge'],[554,'Anderlecht'],[742,'Genk'],[631,'Gent'],[1393,'Union SG'],
  [571,'RB Salzburg'],[637,'Sturm Graz'],
  [552,'Slavia Praha'],[570,'Sparta Praha'],[567,'Viktoria Plzeň'],
  [598,'Crvena Zvezda'],[573,'Partizan'],[592,'Dinamo Zagreb'],
  [400,'FC Copenhagen'],[397,'Midtjylland'],[327,'Bodø/Glimt'],
  [651,'Ferencváros'],[606,'Ludogorets'],[339,'Legia Warszawa'],[638,'Maccabi Tel Aviv'],
];

/* ---- POKÉMON (les 151 de la 1re génération) ----
   Images : sprites officiels PokeAPI, par numéro du Pokédex.
   On utilise les petits sprites (~1 Ko chacun) et pas les grandes
   illustrations : 151 images en 475 px, ça ferait 18 Mo à charger et
   ~130 Mo en mémoire — beaucoup trop pour un serveur qui diffuse 24/7.
   Pour les grandes illustrations, remplace l'URL du mode par :
   .../sprites/pokemon/other/official-artwork/${id}.png                */
const POKEMON = [
  [1,'Bulbasaur'],[2,'Ivysaur'],[3,'Venusaur'],[4,'Charmander'],[5,'Charmeleon'],[6,'Charizard'],[7,'Squirtle'],[8,'Wartortle'],
  [9,'Blastoise'],[10,'Caterpie'],[11,'Metapod'],[12,'Butterfree'],[13,'Weedle'],[14,'Kakuna'],[15,'Beedrill'],[16,'Pidgey'],
  [17,'Pidgeotto'],[18,'Pidgeot'],[19,'Rattata'],[20,'Raticate'],[21,'Spearow'],[22,'Fearow'],[23,'Ekans'],[24,'Arbok'],
  [25,'Pikachu'],[26,'Raichu'],[27,'Sandshrew'],[28,'Sandslash'],[29,'Nidoran ♀'],[30,'Nidorina'],[31,'Nidoqueen'],[32,'Nidoran ♂'],
  [33,'Nidorino'],[34,'Nidoking'],[35,'Clefairy'],[36,'Clefable'],[37,'Vulpix'],[38,'Ninetales'],[39,'Jigglypuff'],[40,'Wigglytuff'],
  [41,'Zubat'],[42,'Golbat'],[43,'Oddish'],[44,'Gloom'],[45,'Vileplume'],[46,'Paras'],[47,'Parasect'],[48,'Venonat'],
  [49,'Venomoth'],[50,'Diglett'],[51,'Dugtrio'],[52,'Meowth'],[53,'Persian'],[54,'Psyduck'],[55,'Golduck'],[56,'Mankey'],
  [57,'Primeape'],[58,'Growlithe'],[59,'Arcanine'],[60,'Poliwag'],[61,'Poliwhirl'],[62,'Poliwrath'],[63,'Abra'],[64,'Kadabra'],
  [65,'Alakazam'],[66,'Machop'],[67,'Machoke'],[68,'Machamp'],[69,'Bellsprout'],[70,'Weepinbell'],[71,'Victreebel'],[72,'Tentacool'],
  [73,'Tentacruel'],[74,'Geodude'],[75,'Graveler'],[76,'Golem'],[77,'Ponyta'],[78,'Rapidash'],[79,'Slowpoke'],[80,'Slowbro'],
  [81,'Magnemite'],[82,'Magneton'],[83,'Farfetch\'d'],[84,'Doduo'],[85,'Dodrio'],[86,'Seel'],[87,'Dewgong'],[88,'Grimer'],
  [89,'Muk'],[90,'Shellder'],[91,'Cloyster'],[92,'Gastly'],[93,'Haunter'],[94,'Gengar'],[95,'Onix'],[96,'Drowzee'],
  [97,'Hypno'],[98,'Krabby'],[99,'Kingler'],[100,'Voltorb'],[101,'Electrode'],[102,'Exeggcute'],[103,'Exeggutor'],[104,'Cubone'],
  [105,'Marowak'],[106,'Hitmonlee'],[107,'Hitmonchan'],[108,'Lickitung'],[109,'Koffing'],[110,'Weezing'],[111,'Rhyhorn'],[112,'Rhydon'],
  [113,'Chansey'],[114,'Tangela'],[115,'Kangaskhan'],[116,'Horsea'],[117,'Seadra'],[118,'Goldeen'],[119,'Seaking'],[120,'Staryu'],
  [121,'Starmie'],[122,'Mr. Mime'],[123,'Scyther'],[124,'Jynx'],[125,'Electabuzz'],[126,'Magmar'],[127,'Pinsir'],[128,'Tauros'],
  [129,'Magikarp'],[130,'Gyarados'],[131,'Lapras'],[132,'Ditto'],[133,'Eevee'],[134,'Vaporeon'],[135,'Jolteon'],[136,'Flareon'],
  [137,'Porygon'],[138,'Omanyte'],[139,'Omastar'],[140,'Kabuto'],[141,'Kabutops'],[142,'Aerodactyl'],[143,'Snorlax'],[144,'Articuno'],
  [145,'Zapdos'],[146,'Moltres'],[147,'Dratini'],[148,'Dragonair'],[149,'Dragonite'],[150,'Mewtwo'],[151,'Mew']
];

window.MODES = [
  { id: 'countries', label: '🌍 Pays (drapeaux)', noun: 'FLAGS',
    items: window.COUNTRIES,
    image: (c) => `https://flagcdn.com/w160/${c}.png` },

  { id: 'clubs', label: '⚽ Clubs de foot', noun: 'CLUBS',
    items: CLUBS,
    image: (id) => `https://media.api-sports.io/football/teams/${id}.png` },

  { id: 'brands', label: '🏷️ Marques', noun: 'BRANDS',
    items: BRANDS,
    image: (d) => `https://logo.clearbit.com/${d}` },

  { id: 'capitals', label: '🏙️ Capitales', noun: 'CAPITALS',
    items: CAPITALS,
    image: (c) => `https://flagcdn.com/w160/${c}.png` },

  { id: 'pokemon', label: '🔴 Pokémon (151)', noun: 'POKÉMON',
    items: POKEMON,
    image: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` },
];

window.currentMode = () => (window.MODES.find(m => m.id === CONFIG.MODE) || window.MODES[0]);
window.itemList   = () => window.currentMode().items;
window.itemImage  = (id) => window.currentMode().image(id);
