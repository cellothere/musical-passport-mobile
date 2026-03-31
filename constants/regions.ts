export interface Region {
  name: string;
  countries: string[];
}

export const REGIONS: Region[] = [
  { name: "Europe", countries: ["France","Germany","Sweden","Norway","Portugal","Spain","Italy","Greece","Poland","Iceland","Finland","Ireland","Netherlands","Romania","Serbia","Ukraine","Hungary","Czechia","Turkey","Belgium","Switzerland","Austria","Denmark","Scotland","Wales","Croatia","Bulgaria","Slovakia","Slovenia","Lithuania","Latvia","Estonia","Albania","North Macedonia","Bosnia","Kosovo","Montenegro","Luxembourg","Malta","Cyprus"] },
  { name: "Latin America", countries: ["Brazil","Argentina","Colombia","Cuba","Mexico","Chile","Peru","Jamaica","Venezuela","Bolivia","Ecuador","Panama","Uruguay","Paraguay","Costa Rica","Dominican Republic","Puerto Rico","Guatemala","Honduras","El Salvador","Nicaragua","Belize","Guyana","Suriname","Trinidad & Tobago","Barbados","Haiti"] },
  { name: "Africa", countries: ["Nigeria","Ghana","Senegal","Mali","Ethiopia","Eritrea", "South Africa","Egypt","Cameroon","Congo","Kenya","Algeria","Morocco","Tanzania","Ivory Coast","Angola","Mozambique","Zimbabwe","Uganda","Rwanda","Zambia","Tunisia","Libya","Sudan","Guinea","Burkina Faso","Benin","Togo","Sierra Leone","Liberia","Namibia","Botswana","Malawi","Madagascar","Mauritius","Cape Verde"] },
  { name: "Middle East", countries: ["Lebanon","Iran","Israel","Saudi Arabia","Armenia","Azerbaijan","Georgia","Iraq","Syria","Jordan","Yemen","Oman","UAE","Kuwait","Qatar","Bahrain","Palestine"] },
  { name: "Asia", countries: ["Japan","South Korea","India","China","Indonesia","Thailand","Vietnam","Philippines","Pakistan","Bangladesh","Taiwan","Mongolia","Myanmar","Cambodia","Laos","Malaysia","Singapore","Sri Lanka","Nepal","Afghanistan","Kazakhstan","Uzbekistan","Tajikistan","Kyrgyzstan","Turkmenistan","Hong Kong"] },
  { name: "Oceania", countries: ["Australia","New Zealand","Papua New Guinea","Fiji","Samoa","Tonga","Vanuatu","Solomon Islands","Hawaii"] },
  { name: "North America", countries: ["USA","Canada"] },
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
  ]},
  { name: "Historical", countries: ["Yugoslavia","Soviet Union","Czechoslovakia","East Germany","Ottoman Empire","British India","Ceylon","Rhodesia","Zaire","Persia","Siam","Byzantine Empire","Prussia","Austro-Hungarian Empire","Ancient Rome","Ancient Greece","Mesopotamia","Viking Scandinavia","Moorish Spain","Weimar Republic","Republic of South Vietnam","Meiji Japan"] },
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
  "The American Southwest",
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
  "The Persian World",
  "The Rio de la Plata",
  "The Sahel",
  "The Swahili Coast",
  "Trinidad & Tobago",
];

export function getAllCountries(): string[] {
  return REGIONS.flatMap(r => r.countries);
}
