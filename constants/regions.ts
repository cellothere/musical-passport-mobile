export interface Region {
  name: string;
  countries: string[];
}

export const MODERN_REGIONS: Region[] = [
  { name: "Europe", countries: [
    "Albania","Andorra","Austria","Belarus","Belgium","Bosnia","Bulgaria","Croatia","Cyprus",
    "Czechia","Denmark","England","Estonia","Finland","France","Germany","Greece","Hungary",
    "Iceland","Ireland","Italy","Kosovo","Latvia","Liechtenstein","Lithuania","Luxembourg",
    "Malta","Moldova","Monaco","Montenegro","Netherlands","North Macedonia","Norway","Poland",
    "Portugal","Romania","Russia","San Marino","Scotland","Serbia","Slovakia","Slovenia",
    "Spain","Sweden","Switzerland","Turkey","Ukraine","United Kingdom","Vatican City","Wales",
  ] },
  { name: "Latin America", countries: [
    "Antigua and Barbuda","Argentina","Bahamas","Barbados","Belize","Bolivia","Brazil","Chile",
    "Colombia","Costa Rica","Cuba","Dominica","Dominican Republic","Ecuador","El Salvador",
    "Grenada","Guatemala","Guyana","Haiti","Honduras","Jamaica","Mexico","Nicaragua","Panama",
    "Paraguay","Peru","Puerto Rico","Saint Kitts and Nevis","Saint Lucia",
    "Saint Vincent and the Grenadines","Suriname","Trinidad & Tobago","Uruguay","Venezuela",
  ] },
  { name: "Africa", countries: [
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde",
    "Central African Republic","Chad","Comoros","Congo","DR Congo","Djibouti","Egypt",
    "Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea",
    "Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi",
    "Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda",
    "Sao Tome & Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa",
    "South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe",
  ] },
  { name: "Middle East", countries: [
    "Armenia","Azerbaijan","Bahrain","Georgia","Iran","Iraq","Israel","Jordan","Kuwait","Lebanon",
    "Oman","Palestine","Qatar","Saudi Arabia","Syria","UAE","Yemen",
  ] },
  { name: "Asia", countries: [
    "Afghanistan","Bangladesh","Bhutan","Brunei","Cambodia","China","Hong Kong","India","Indonesia",
    "Japan","Kazakhstan","Kyrgyzstan","Laos","Malaysia","Maldives","Mongolia","Myanmar","Nepal",
    "North Korea","Pakistan","Philippines","Singapore","South Korea","Sri Lanka","Taiwan",
    "Tajikistan","Thailand","Timor-Leste","Turkmenistan","Uzbekistan","Vietnam",
  ] },
  { name: "Oceania", countries: [
    "Australia","Fiji","Kiribati","Marshall Islands","Micronesia","Nauru","New Zealand",
    "Papua New Guinea","Samoa","Solomon Islands","Tonga","Tuvalu","Vanuatu","Hawaii",
    // "Palau" we don't have enough data for Palau yet.
  ] },
  { name: "North America", countries: ["Canada","USA"] },
];

export const REGIONS: Region[] = [
  ...MODERN_REGIONS,
  { name: "Indigenous Nations", countries: [
    "Māori Nation",
    "Aboriginal Australia",
    "Sámi Nation",
    "Inuit",
    "Lakota Nation",
    "Navajo Nation",
    "Anishinaabe",
    "Cree Nation",
    "Métis",
    "Haudenosaunee",
    "Pacific Northwest Coast",
    "Cherokee Nation",
    "Blackfoot Confederacy",
    "Mapuche",
    "Quechua Nations",
    "Ainu",
    "Yupik",
    "Maya Nations",
    "Guarani Nation",
    "Shipibo-Conibo",
    "Kuna Nation",
  ]},
  { name: "Historical", countries: ["Yugoslavia","Soviet Union","Czechoslovakia","East Germany","Ottoman Empire","Ceylon","Byzantine Empire","Austro-Hungarian Empire","Ancient Rome","Ancient Greece","Viking Scandinavia","Moorish Spain","Weimar Republic"] },
];

export const DECADES = ["1900s","1910s","1920s","1930s","1940s","1950s","1960s","1970s","1980s","1990s","2000s","2010s","2020s"];

// Cultural / musical regions that transcend political borders.
// Each entry is a place-name Claude understands as a distinct musical world.
export const MUSIC_REGIONS: string[] = [
  "Andalusia",
  "Appalachia",
  "Basque Country",
  "Bengal",
  "Brittany",
  "Cape Verde",
  "Central Asia",
  "Galicia (Spain)",
  "Louisiana",
  "Melanesia",
  "New Orleans",
  "Occitania",
  "Polynesia",
  "Punjab",
  "Quebec",
  "Sardinia",
  "Southern Africa",
  "The Amazon Basin",
  "The American South",
  "The Andes",
  "The Arabian Peninsula",
  "The Balkans",
  "The Caribbean",
  "The Caucasus",
  "The Celtic Fringe",
  "The Congo Basin",
  "The French Antilles",
  "The Horn of Africa",
  "The Indonesian Archipelago",
  "The Levant",
  "The Maghreb",
  "The Mekong Delta",
  "The Rio de la Plata",
  "The Sahel",
  "The Swahili Coast",
  "Trinidad & Tobago",
];

export function getAllCountries(): string[] {
  return REGIONS.flatMap(r => r.countries);
}
