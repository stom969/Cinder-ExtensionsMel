// ── Shortened comic list (first 100) ─────────────────
const GOCOMICS_LIST = [
    {"name":"Mike Luckovich","featureId":256,"slug":"mikeluckovich"},
    {"name":"Andertoons","featureId":930,"slug":"andertoons"},
    {"name":"bacon","featureId":1520,"slug":"bacon"},
    {"name":"Birdbrains","featureId":30,"slug":"birdbrains"},
    {"name":"Big Top","featureId":220,"slug":"bigtop"},
    {"name":"Bird and Moon","featureId":1638,"slug":"bird-and-moon"},
    {"name":"Bliss","featureId":64,"slug":"bliss"},
    {"name":"Bloom County","featureId":213,"slug":"bloomcounty"},
    {"name":"The Boondocks","featureId":215,"slug":"boondocks"},
    {"name":"Dinosaur Comics","featureId":1322,"slug":"dinosaur-comics"},
    {"name":"Edge City","featureId":1495,"slug":"edge-city"},
    {"name":"Bo Nanas","featureId":217,"slug":"bonanas"},
    {"name":"Bob the Angry Flower","featureId":1732,"slug":"bob-the-angry-flower"},
    {"name":"Emmy Lou","featureId":1105,"slug":"emmy-lou"},
    {"name":"Bob the Squirrel","featureId":26,"slug":"bobthesquirrel"},
    {"name":"False Knees","featureId":1604,"slug":"false-knees"},
    {"name":"Flo and Friends","featureId":248,"slug":"floandfriends"},
    {"name":"Mike du Jour","featureId":1078,"slug":"mike-du-jour"},
    {"name":"Boomerangs","featureId":45,"slug":"boomerangs"},
    {"name":"Bottomliners","featureId":143,"slug":"bottomliners"},
    {"name":"Periquita","featureId":916,"slug":"periquita"},
    {"name":"Bound and Gagged","featureId":142,"slug":"boundandgagged"},
    {"name":"Brewster Rockit","featureId":104,"slug":"brewsterrockit"},
    {"name":"Berger & Wyse","featureId":1065,"slug":"berger-and-wyse"},
    {"name":"The Duplex","featureId":313,"slug":"duplex"},
    {"name":"For Better or For Worse","featureId":316,"slug":"forbetterorforworse"},
    {"name":"Grand Avenue","featureId":472,"slug":"grand-avenue"},
    {"name":"Alley Oop","featureId":805,"slug":"alley-oop"},
    {"name":"Tutelandia","featureId":152,"slug":"tutelandia"},
    {"name":"UFO","featureId":1745,"slug":"ufo"},
    {"name":"Mike Beckom","featureId":1728,"slug":"mike-beckom"},
    {"name":"Junk Drawer","featureId":1664,"slug":"junk-drawer"},
    {"name":"Long Story Short","featureId":1621,"slug":"long-story-short"},
    {"name":"Looks Good on Paper","featureId":1370,"slug":"looks-good-on-paper"},
    {"name":"Non Sequitur","featureId":182,"slug":"nonsequitur"},
    {"name":"Overboard","featureId":347,"slug":"overboard"},
    {"name":"Half Full","featureId":1259,"slug":"half-full"},
    {"name":"@Tavicat","featureId":1503,"slug":"tavicat"},
    {"name":"Betty","featureId":468,"slug":"betty"},
    {"name":"Animal Crackers","featureId":146,"slug":"animalcrackers"},
    {"name":"Aaggghhh","featureId":1614,"slug":"aaggghhh"},
    {"name":"Adult Children","featureId":1303,"slug":"adult-children"},
    {"name":"Agnes","featureId":233,"slug":"agnes"},
    {"name":"Ali's House","featureId":1519,"slug":"alis-house"},
    {"name":"Andy Capp","featureId":192,"slug":"andycapp"},
    {"name":"Angry Little Girls","featureId":905,"slug":"angry-little-girls"},
    {"name":"Annie","featureId":145,"slug":"annie"},
    {"name":"Arlo and Janis","featureId":467,"slug":"arloandjanis"},
    {"name":"Ask Shagg","featureId":235,"slug":"askshagg"},
    {"name":"Aunty Acid","featureId":1236,"slug":"aunty-acid"},
    {"name":"B.C.","featureId":193,"slug":"bc"},
    {"name":"Barkeater Lake","featureId":3,"slug":"barkeaterlake"},
    {"name":"Basic Instructions","featureId":36,"slug":"basicinstructions"},
    {"name":"Batch Rejection","featureId":1639,"slug":"batch-rejection"},
    {"name":"Beardo","featureId":1068,"slug":"beardo"},
    {"name":"Ben","featureId":874,"slug":"ben"},
    {"name":"Berkeley Mews","featureId":1353,"slug":"berkeley-mews"},
    {"name":"BFGF Syndrome","featureId":1593,"slug":"bfgf-syndrome"},
    {"name":"Bozo","featureId":1700,"slug":"bozo"},
    {"name":"Brevity","featureId":816,"slug":"brevity"},
    {"name":"Broom Hilda","featureId":140,"slug":"broomhilda"},
    {"name":"Barney & Clyde","featureId":624,"slug":"barneyandclyde"},
    {"name":"Bully","featureId":1305,"slug":"bully"},
    {"name":"Buckles","featureId":1192,"slug":"buckles"},
    {"name":"Cathy","featureId":170,"slug":"cathy"},
    {"name":"Chris Britt","featureId":74,"slug":"chrisbritt"},
    {"name":"C'est la Vie","featureId":37,"slug":"cestlavie"},
    {"name":"Cat's Cafe","featureId":1659,"slug":"cats-cafe"},
    {"name":"Chuck Draws Things","featureId":1667,"slug":"chuckdrawsthings"},
    {"name":"Chuckle Bros","featureId":59,"slug":"chucklebros"},
    {"name":"Citizen Dog","featureId":225,"slug":"citizendog"},
    {"name":"Clay Jones","featureId":242,"slug":"clayjones"},
    {"name":"CowTown","featureId":749,"slug":"cowtown"},
    {"name":"Catana Comics","featureId":1645,"slug":"little-moments-of-love"},
    {"name":"Curses!","featureId":1731,"slug":"curses"},
    {"name":"Daddy's Home","featureId":77,"slug":"daddyshome"},
    {"name":"Dark Side of the Horse","featureId":721,"slug":"darksideofthehorse"},
    {"name":"Eek!","featureId":28,"slug":"eek"},
    {"name":"Cathy Commiserations","featureId":1690,"slug":"cathy-commiserations"},
    {"name":"Cattitude — Doggonit","featureId":1498,"slug":"cattitude-doggonit"},
    {"name":"El Café de Poncho","featureId":156,"slug":"el-cafe-de-poncho"},
    {"name":"Endtown","featureId":751,"slug":"endtown"},
    {"name":"Cheer Up, Emo Kid","featureId":1581,"slug":"cheer-up-emo-kid"},
    {"name":"Crankshaft","featureId":271,"slug":"crankshaft"},
    {"name":"Dogs of C-Kennel","featureId":745,"slug":"dogsofckennel"},
    {"name":"Foolish Mortals","featureId":1076,"slug":"foolish-mortals"},
    {"name":"FoxTrot en Español","featureId":167,"slug":"foxtrotespanol"},
    {"name":"Drabble","featureId":470,"slug":"drabble"},
    {"name":"Nate el Grande","featureId":914,"slug":"nate-el-grande"},
    {"name":"Home and Away","featureId":76,"slug":"homeandaway"},
    {"name":"Ripley’s ¡Aunque Usted no lo Crea!","featureId":918,"slug":"ripleys-en-espanol"},
    {"name":"Peanuts en Español","featureId":758,"slug":"peanuts-espanol"},
    {"name":"Shen Comix","featureId":1497,"slug":"shen-comix"},
    {"name":"Tarzán en Español","featureId":920,"slug":"tarzan-en-espanol"},
    {"name":"The Wandering Melon","featureId":1313,"slug":"the-wandering-melon"},
    {"name":"Win, Lose, Drew","featureId":813,"slug":"drewlitton"},
    {"name":"Eric Allie","featureId":1729,"slug":"eric-allie"},
    {"name":"Wondermark","featureId":1515,"slug":"wondermark"},
    {"name":"Los Osorios","featureId":915,"slug":"los-osorios"},
    {"name":"Marshall Ramsey","featureId":72,"slug":"marshallramsey"},
    {"name":"Bill Bramhall","featureId":1746,"slug":"bill-bramhall"},
    {"name":"Bob Gorrell","featureId":237,"slug":"bobgorrell"}
];

// ── Extension export ─────────────────────────────────
__cinderExport = {
  id: "gocomics",
  name: "GoComics Short",
  version: "2.5.0",
  icon: "📰",
  description: "Short test with 100 comics",
  contentType: "comics",

  capabilities: {
    search: true,
    discover: true,
    download: true,
  },

  async search(query, page) {
    let lowerQuery = query.toLowerCase().trim();
    let filtered = GOCOMICS_LIST;
    if (lowerQuery !== "") {
      filtered = GOCOMICS_LIST.filter(comic =>
        comic.name && comic.name.toLowerCase().includes(lowerQuery)
      );
    }
    let pageSize = 20;
    let start = page * pageSize;
    let paged = filtered.slice(start, start + pageSize);
    return paged.map(comic => ({
      id: comic.slug,
      title: comic.name,
      author: "",
      cover: "https://avatar.amuniversal.com/feature_avatars/recommendation?feature=" + comic.slug,
      url: "https://www.gocomics.com/" + comic.slug,
      format: "comics"
    }));
  },

  async resolve(item) {
    return { url: "https://via.placeholder.com/800x600.png?text=Not+implemented+yet" };
  }
};
