/**
 * Ahona images — branded heroes in /public/brand/heroes
 * plus verified Unsplash product / doctor stills.
 */

const U = "https://images.unsplash.com";

function sq(id: string, w = 1200) {
  return `${U}/${id}?auto=format&fit=crop&w=${w}&h=${w}&q=90`;
}

function portrait(id: string, w = 800) {
  return `${U}/${id}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 1.15)}&q=90`;
}

// ── Products (verified) ──────────────────────────────────────────
export const productImg = {
  serum: sq("photo-1631730486572-226d1f595b68"),
  serumGold: sq("photo-1611930022073-b7a4ba5fcccd"),
  serumDrop: sq("photo-1608248543803-ba4f8c70ae0b"),
  facewash: sq("photo-1556228578-0d85b1a4d571"),
  cleanser: sq("photo-1556228720-195a672e8a03"),
  sunscreen: sq("photo-1556229010-6c3f2c9ca5f8"),
  shampoo: sq("photo-1527799820374-dcf8d9d4a388"),
  lotion: sq("photo-1556228453-efd6c1ff04f6"),
  cream: sq("photo-1598440947619-2c35fc9aa908"),
  creamJar: sq("photo-1608571423902-eed4a5ad8108"),
  vitamins: sq("photo-1607619056574-7b8d3ee536b2"),
  vitamins2: sq("photo-1584308666744-24d5c474f2ae"),
  medicine: sq("photo-1587854692152-cbe660dbde88"),
  pills: sq("photo-1471864190281-a93a3070b6de"),
  medicine2: sq("photo-1585435557343-3b092031a831"),
  baby: sq("photo-1515488042361-ee00e0ddd4e4"),
  babyCare: sq("photo-1544367567-0f2fcb009e0b"),
  herbal: sq("photo-1512290923902-8a9f81dc236c"),
  herbs: sq("photo-1515377905703-c4788e51af15"),
  device: sq("photo-1631815588090-d4bfec5b1ccb"),
  stethoscope: sq("photo-1505751172876-fa1923c5c528"),
  oil: sq("photo-1600857062241-98e5dba7f214"),
  soap: sq("photo-1600857544200-b2f666a9a2ec"),
  mask: sq("photo-1596755389378-c31d21fd1273"),
  protein: sq("photo-1593095948071-474c5cc2989d"),
  pet: sq("photo-1450778869180-41d0601e046e"),
  home: sq("photo-1584622650111-993a426fbf0a"),
  beauty: sq("photo-1596462502278-27bfdc403348"),
  makeup: sq("photo-1522335789203-aabd1fc54bc9"),
  spa: sq("photo-1570172619644-dfd03ed5d881"),
  spa2: sq("photo-1616394584738-fc6e612e71b9"),
  cosmetics: sq("photo-1571781926291-c477ebfd024b"),
  wellness: sq("photo-1540555700478-4be289fbecef"),
  food: sq("photo-1490645935967-10de6ba17061"),
  labTube: sq("photo-1579154204601-01588f351e67"),
  labSci: sq("photo-1582719471384-894fbb16e074"),
  labMic: sq("photo-1576086213369-97a306d36557"),
  blood: sq("photo-1530026405186-ed1f139313f8"),
  heart: sq("photo-1628348068343-c6a848d2b6dd"),
  luxury: sq("photo-1629198688000-71f23e745b6e"),
  flatlay: sq("photo-1487412947147-5cebf100ffc2"),
};

// ── Banners / heroes ─────────────────────────────────────────────
export const brandHero = {
  beauty: "/brand/heroes/beauty.jpg",
  pharmacy: "/brand/heroes/pharmacy.jpg",
  doctor: "/brand/heroes/doctor.jpg",
  lab: "/brand/heroes/lab.jpg",
};

export const heroImg = {
  pharmacy: brandHero.pharmacy,
  beauty: brandHero.beauty,
  skincare: brandHero.beauty,
  wellness: brandHero.pharmacy,
  doctor: brandHero.doctor,
  doctor2: brandHero.doctor,
  lab: brandHero.lab,
  hospital: brandHero.doctor,
  store: brandHero.pharmacy,
  all: brandHero.pharmacy,
  luxury: brandHero.beauty,
  cosmetics: brandHero.beauty,
  spa: brandHero.beauty,
  medical: brandHero.lab,
};

// ── Doctors (verified portraits) ─────────────────────────────────
export const doctorImg = {
  d1: portrait("photo-1559839734-2b71ea197ec2"),
  d2: portrait("photo-1612349317150-e413f6a5b16d"),
  d3: portrait("photo-1594824476967-48c8b964273f"),
  d4: portrait("photo-1537368910025-700350fe46c7"),
  d5: portrait("photo-1651008376811-b90baee60c1f"),
  d6: portrait("photo-1622253692010-333f2da6031d"),
  d7: portrait("photo-1582750433449-648ed127bb54"),
  d8: portrait("photo-1527613426441-4da17471b66d"),
  d9: portrait("photo-1607990281513-2c110a25bd8c"),
  d10: portrait("photo-1591604021695-0c69b7c05981"),
  d11: portrait("photo-1612531386530-97286d97c2d2"),
  d12: portrait("photo-1551836022-d5d88e9218df"),
};

// ── Lab tests ────────────────────────────────────────────────────
export const labImg = {
  cbc: sq("photo-1579154204601-01588f351e67"),
  creatinine: sq("photo-1579154204601-01588f351e67"),
  electrolytes: sq("photo-1576086213369-97a306d36557"),
  urine: sq("photo-1530026405186-ed1f139313f8"),
  esr: sq("photo-1582719471384-894fbb16e074"),
  tsh: sq("photo-1631815588090-d4bfec5b1ccb"),
  package: sq("photo-1505751172876-fa1923c5c528"),
  dengue: sq("photo-1584036561566-baf8f5f1b144"),
};

// ── Nav mega-menu ────────────────────────────────────────────────
export const premiumImg = {
  medicine: productImg.medicine,
  beauty: productImg.beauty,
  skincare: productImg.spa,
  hair: productImg.shampoo,
  baby: productImg.baby,
  vitamin: productImg.vitamins,
  herbal: productImg.herbal,
  device: productImg.device,
  lab: productImg.labTube,
  doctor: doctorImg.d1,
  wellness: productImg.wellness,
  food: productImg.food,
  pet: productImg.pet,
  home: productImg.home,
  heroStore: brandHero.pharmacy,
  heroLab: brandHero.lab,
  heroDoctor: brandHero.doctor,
  heroAll: brandHero.beauty,
};

export const seedProductPool = [
  productImg.serum,
  productImg.serumGold,
  productImg.serumDrop,
  productImg.facewash,
  productImg.cleanser,
  productImg.sunscreen,
  productImg.shampoo,
  productImg.lotion,
  productImg.cream,
  productImg.creamJar,
  productImg.vitamins,
  productImg.vitamins2,
  productImg.medicine,
  productImg.pills,
  productImg.medicine2,
  productImg.baby,
  productImg.herbal,
  productImg.device,
  productImg.oil,
  productImg.soap,
  productImg.mask,
  productImg.protein,
  productImg.beauty,
  productImg.makeup,
  productImg.spa,
  productImg.cosmetics,
  productImg.luxury,
  productImg.flatlay,
];
