// Curated genre list sourced from Discogs styles + app DB genres.
// When GenreSpotlight introduces new genres, add them here.

export const GENRES: string[] = [
  // Global / Universal
  'Pop', 'Pop Rock', 'Rock', 'Indie Rock', 'Alternative Rock', 'Alt Rock', 'Hard Rock',
  'Heavy Metal', 'Black Metal', 'Punk', 'Post-Punk', 'Hardcore', 'Metal',
  'Folk', 'Country', 'Blues', 'Jazz', 'Soul', 'Funk', 'R&B',
  'Gospel', 'Classical', 'Opera', 'Ambient', 'Experimental',
  'Electronic', 'Techno', 'House', 'Deep House', 'Trance',
  'Drum n Bass', 'Dubstep', 'Disco', 'Synth-pop', 'New Wave',
  'Prog Rock', 'Psychedelic Rock', 'Shoegaze', 'Noise Rock',
  'Hip Hop', 'Rap', 'Trap', 'Grime',

  // Latin & Caribbean
  'Reggae', 'Dancehall', 'Ska',
  'Samba', 'Bossa Nova', 'MPB', 'Tropicália', 'Forró', 'Axé', 'Baile Funk',
  'Tango', 'Cumbia', 'Vallenato', 'Salsa', 'Merengue', 'Bachata', 'Reggaeton',
  'Norteño', 'Banda', 'Mariachi',

  // African
  'Afrobeat', 'Afropop', 'Highlife', 'Jùjú', 'Fuji', 'Afrobeats',
  'Mbalax', 'Soukous', 'Ndombolo', 'Kizomba', 'Semba',
  'Amapiano', 'Kwaito', 'Marabi',
  'Gnawa', 'Chaabi', 'Rai',
  'Benga', 'Taarab', 'Bongo Flava',
  'Ethio-Jazz', 'Tizita',

  // Middle East & North Africa
  'Arabic Pop', 'Shaabi', 'Mahraganat', 'Khaleeji', 'Muwashahat',
  'Persian Classical', 'Bandari',

  // West & Central Asian
  'Bhangra', 'Qawwali', 'Ghazal', 'Filmi', 'Hindustani Classical',
  'Carnatic Classical', 'Baul',
  'Mugham', 'Ashiq',

  // East & Southeast Asian
  'J-Pop', 'J-Rock', 'Enka', 'City Pop',
  'K-Pop', 'K-Hip Hop', 'Trot',
  'Mandopop', 'Cantopop', 'C-Pop',
  'P-Pop', 'OPM',
  'Thai Pop', 'Luk Thung',
  'Dangdut',

  // European Regional
  'Chanson', 'Yé-yé',
  'Schlager',
  'Fado',
  'Flamenco', 'Rumba Catalana',
  'Sieidi', 'Joik',
  'Rebetiko', 'Laïká',
  'Klezmer',
  'Polka', 'Mazurka',
  'Anatolian Rock', 'Arabesk', 'Türkü',
  'Nordic Folk', 'Celtic Folk', 'Balkan Folk',

  // Oceania & Indigenous
  'Aboriginal Australian', 'Māori Music',

  // Yoruba (highly region-specific)
  'Yoruba',

  // Misc
  'Cumbia Villera', 'Nueva Canción', 'Trova',
];

// Maps region-locked genres to the ONLY countries that should be selectable.
// Genres not in this map can pair with any country.
export const GENRE_REGIONS: Record<string, string[]> = {
  // ── Brazil ──────────────────────────────────────────────
  'Samba': ['Brazil'],
  'Bossa Nova': ['Brazil'],
  'MPB': ['Brazil'],
  'Tropicália': ['Brazil'],
  'Forró': ['Brazil'],
  'Axé': ['Brazil'],
  'Baile Funk': ['Brazil'],

  // ── River Plate / Southern Cone ──────────────────────────
  'Tango': ['Argentina', 'Uruguay'],
  'Cumbia Villera': ['Argentina'],
  'Nueva Canción': ['Argentina', 'Chile', 'Uruguay'],

  // ── Colombia ─────────────────────────────────────────────
  'Vallenato': ['Colombia'],
  'Cumbia': ['Colombia', 'Mexico', 'Peru', 'Argentina', 'Chile'],

  // ── Caribbean ────────────────────────────────────────────
  'Reggae': ['Jamaica'],
  'Dancehall': ['Jamaica'],
  'Salsa': ['Cuba', 'Puerto Rico', 'Colombia', 'Dominican Republic', 'Panama'],
  'Merengue': ['Dominican Republic'],
  'Bachata': ['Dominican Republic'],
  'Reggaeton': ['Puerto Rico', 'Colombia', 'Panama'],
  'Trova': ['Cuba', 'Mexico'],

  // ── Mexico ───────────────────────────────────────────────
  'Norteño': ['Mexico'],
  'Banda': ['Mexico'],
  'Mariachi': ['Mexico'],

  // ── West Africa ───────────────────────────────────────────
  'Afrobeat': ['Nigeria'],
  'Afrobeats': ['Nigeria', 'Ghana'],
  'Afropop': ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Cameroon'],
  'Highlife': ['Ghana', 'Nigeria'],
  'Jùjú': ['Nigeria'],
  'Fuji': ['Nigeria'],
  'Yoruba': ['Nigeria'],
  'Mbalax': ['Senegal'],

  // ── Central Africa ────────────────────────────────────────
  'Soukous': ['Congo', 'Rwanda', 'Burundi'],
  'Ndombolo': ['Congo'],

  // ── Southern Africa ───────────────────────────────────────
  'Kizomba': ['Angola'],
  'Semba': ['Angola'],
  'Amapiano': ['South Africa'],
  'Kwaito': ['South Africa'],
  'Marabi': ['South Africa'],

  // ── North Africa ──────────────────────────────────────────
  'Rai': ['Algeria', 'Morocco', 'Tunisia'],
  'Gnawa': ['Morocco'],
  'Chaabi': ['Morocco', 'Algeria'],

  // ── East Africa ───────────────────────────────────────────
  'Benga': ['Kenya'],
  'Taarab': ['Kenya', 'Tanzania'],
  'Bongo Flava': ['Tanzania'],
  'Ethio-Jazz': ['Ethiopia'],
  'Tizita': ['Ethiopia'],

  // ── Middle East ───────────────────────────────────────────
  'Arabic Pop': ['Egypt', 'Lebanon', 'Saudi Arabia', 'UAE', 'Jordan', 'Syria', 'Morocco', 'Tunisia', 'Iraq'],
  'Shaabi': ['Egypt'],
  'Mahraganat': ['Egypt'],
  'Khaleeji': ['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'],
  'Muwashahat': ['Syria', 'Lebanon', 'Egypt'],

  // ── Iran ─────────────────────────────────────────────────
  'Persian Classical': ['Iran'],
  'Bandari': ['Iran'],

  // ── South Asia ───────────────────────────────────────────
  'Bhangra': ['India', 'Pakistan'],
  'Qawwali': ['Pakistan', 'India'],
  'Ghazal': ['India', 'Pakistan'],
  'Hindustani Classical': ['India'],
  'Carnatic Classical': ['India', 'Sri Lanka'],
  'Filmi': ['India'],
  'Baul': ['Bangladesh', 'India'],

  // ── Caucasus ─────────────────────────────────────────────
  'Mugham': ['Azerbaijan'],
  'Ashiq': ['Azerbaijan', 'Armenia'],

  // ── Japan ────────────────────────────────────────────────
  'J-Pop': ['Japan'],
  'J-Rock': ['Japan'],
  'Enka': ['Japan'],
  'City Pop': ['Japan'],

  // ── Korea ────────────────────────────────────────────────
  'K-Pop': ['South Korea'],
  'K-Hip Hop': ['South Korea'],
  'Trot': ['South Korea'],

  // ── China / Chinese diaspora ──────────────────────────────
  'Mandopop': ['China', 'Taiwan'],
  'Cantopop': ['Hong Kong'],
  'C-Pop': ['China', 'Taiwan', 'Hong Kong'],

  // ── Philippines ───────────────────────────────────────────
  'P-Pop': ['Philippines'],
  'OPM': ['Philippines'],

  // ── Southeast Asia ────────────────────────────────────────
  'Dangdut': ['Indonesia'],
  'Thai Pop': ['Thailand'],
  'Luk Thung': ['Thailand'],

  // ── Turkey ───────────────────────────────────────────────
  'Anatolian Rock': ['Turkey'],
  'Arabesk': ['Turkey'],
  'Türkü': ['Turkey'],

  // ── France / Francophone ──────────────────────────────────
  'Chanson': ['France', 'Belgium', 'Switzerland', 'Luxembourg'],
  'Yé-yé': ['France'],

  // ── Germanic / Nordic Schlager ────────────────────────────
  'Schlager': ['Germany', 'Sweden', 'Austria', 'Switzerland', 'Norway', 'Denmark', 'Finland'],

  // ── Iberia ───────────────────────────────────────────────
  'Fado': ['Portugal'],
  'Flamenco': ['Spain'],
  'Rumba Catalana': ['Spain'],

  // ── Balkans ──────────────────────────────────────────────
  'Balkan Folk': ['Serbia', 'Bulgaria', 'Romania', 'Croatia', 'Bosnia', 'Albania', 'North Macedonia', 'Kosovo', 'Montenegro', 'Slovenia', 'Greece'],
  'Rebetiko': ['Greece'],
  'Laïká': ['Greece'],

  // ── Eastern Europe ───────────────────────────────────────
  'Polka': ['Poland', 'Czechia', 'Slovakia', 'Germany', 'Austria'],
  'Mazurka': ['Poland'],
  'Klezmer': ['Israel', 'Ukraine', 'Poland', 'Romania', 'Hungary', 'Moldova'],

  // ── Nordic / Sámi ────────────────────────────────────────
  'Nordic Folk': ['Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland'],
  'Joik': ['Norway', 'Sweden', 'Finland'],
  'Sieidi': ['Norway', 'Sweden', 'Finland'],

  // ── Celtic ───────────────────────────────────────────────
  'Celtic Folk': ['Ireland', 'Scotland', 'Wales'],

  // ── UK ───────────────────────────────────────────────────
  'Grime': ['England'],

  // ── Oceania & Indigenous ─────────────────────────────────
  'Aboriginal Australian': ['Australia'],
  'Māori Music': ['New Zealand'],
};
