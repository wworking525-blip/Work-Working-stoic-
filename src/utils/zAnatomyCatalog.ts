export type ZAnatomySystemKey =
  | 'skeletal'
  | 'joints'
  | 'muscular'
  | 'cardiovascular'
  | 'lymphatic'
  | 'nervous'
  | 'visceral';

export interface ZAnatomyLexiconEntry {
  la?: string;
  official?: boolean;
}

export interface ZAnatomySearchEntry {
  rawName: string;
  displayName: string;
  latinName?: string;
  official?: boolean;
  system: ZAnatomySystemKey;
}

export interface ZAnatomyMetadata {
  rawName: string;
  displayName: string;
  latinName: string;
  isOfficialTA: boolean;
  system: ZAnatomySystemKey;
  description: string;
  wikipediaUrl?: string;
  highYieldFact: string;
}

const SHEATH_MATERIAL_RE =
  /^(fascia|peritoneum|lcr|articular capsule|bursa|cornea|meninges|pleura|pericardium)$/i;

const SHEATH_NAME_RE =
  /\b(fascia|fasciae|peritoneum|peritoneal|pericardi|pleura|pleural|dura mater|arachnoid|pia mater|retinaculum|aponeurosis|capsule|bursa|synovial sheath|interosseous membrane)\b/i;

const MALE_SPECIFIC_MESH_RE =
  /\b(prostate|prostatic|seminal|ejaculatory|testis|testicular|epididymis|ductus deferens|vas deferens|spermatic|scrotum|scrotal|penis|penile|corpus cavernosum|corpus spongiosum|glans|prepuce|bulbourethral|cremaster|dartos)\b/i;

const FEMALE_SPECIFIC_MESH_RE =
  /\b(uterus|uterine|cervix|vagina|vaginal|ovary|ovarian|fallopian|salpinx|fimbria|infundibulum|clitoris|labia)\b/i;

export function isMaleSpecificAnatomyMesh(name?: string): boolean {
  if (!name) return false;
  return MALE_SPECIFIC_MESH_RE.test(name);
}

export function isFemaleSpecificAnatomyName(name?: string): boolean {
  if (!name) return false;
  return FEMALE_SPECIFIC_MESH_RE.test(name);
}

export const FEMALE_REPRODUCTIVE_SEARCH_ENTRIES: ZAnatomySearchEntry[] = [
  {
    rawName: 'Uterus',
    displayName: 'Uterus',
    latinName: 'Uterus',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Cervix of uterus',
    displayName: 'Cervix of uterus',
    latinName: 'Cervix uteri',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Vagina',
    displayName: 'Vagina',
    latinName: 'Vagina',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Fallopian tube.l',
    displayName: 'Fallopian tube (Left)',
    latinName: 'Tuba uterina sinistra',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Fallopian tube.r',
    displayName: 'Fallopian tube (Right)',
    latinName: 'Tuba uterina dextra',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Ovary.l',
    displayName: 'Ovary (Left)',
    latinName: 'Ovarium sinistrum',
    official: true,
    system: 'visceral',
  },
  {
    rawName: 'Ovary.r',
    displayName: 'Ovary (Right)',
    latinName: 'Ovarium dextrum',
    official: true,
    system: 'visceral',
  },
];

export const FEMALE_REPRODUCTIVE_METADATA: Record<
  string,
  {
    latinName: string;
    description: string;
    wikipediaUrl: string;
    highYieldFact: string;
  }
> = {
  Uterus: {
    latinName: 'Uterus',
    description:
      'Hollow, pear-shaped muscular organ of the true pelvis positioned posterosuperior to the urinary bladder and anterior to the rectum. Composed of perimetrium, thick smooth-muscle myometrium, and cyclical endometrium.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Uterus',
    highYieldFact:
      'Normally anteverted and anteflexed over the bladder; the uterine artery crosses anterior/superior to the ureter ("water under the bridge").',
  },
  'Cervix of uterus': {
    latinName: 'Cervix uteri',
    description:
      'Cylindrical inferior fibromuscular neck of the uterus projecting into the upper vaginal vault, forming the internal and external cervical os around the endocervical canal.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cervix',
    highYieldFact:
      'The transformation zone (squamocolumnar junction) between columnar endocervix and stratified squamous ectocervix is the prime site for HPV-driven dysplasia.',
  },
  Vagina: {
    latinName: 'Vagina',
    description:
      'Distensible fibromuscular canal extending posterosuperiorly from the vestibule to the uterine cervix, forming anterior, posterior, and lateral vaginal fornices.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Vagina',
    highYieldFact:
      'The posterior vaginal fornix lies directly adjacent to the rectouterine pouch (Pouch of Douglas), allowing culdocentesis access to intraperitoneal fluid.',
  },
  'Fallopian tube': {
    latinName: 'Tuba uterina',
    description:
      'Paired seromuscular uterine tubes connecting the uterine cornua to the peritoneal cavity near each ovary via the intramural, isthmic, ampullary, and fimbriated infundibular segments.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Fallopian_tube',
    highYieldFact:
      'Fertilization typically occurs in the wide ampullary segment, which is also the most frequent implantation site for ectopic pregnancy.',
  },
  Ovary: {
    latinName: 'Ovarium',
    description:
      'Paired almond-shaped female gonads suspended on the posterior broad ligament by the mesovarium, ovarian ligament medially, and suspensory (infundibulopelvic) ligament laterally.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ovary',
    highYieldFact:
      'Ovarian vessels travel in the suspensory ligament (from abdominal aorta) while the uterine-ovarian anastomosis runs with the ovarian ligament.',
  },
  'Ovarian ligament': {
    latinName: 'Ligamentum ovarii proprium',
    description:
      'Fibromuscular cord within the broad ligament anchoring the medial pole of each ovary to the lateral uterine cornu just inferior to the fallopian tube.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ovarian_ligament',
    highYieldFact:
      'Embryologically derived from the gubernaculum, homologous to the round ligament of the uterus distally.',
  },
};

export function cleanZAnatomyName(rawName: string): string {
  if (!rawName) return 'Anatomical Structure';
  let name = rawName.trim().replace(/_\d+$/, '');
  let suffix = '';
  if (/\.l$/i.test(name)) {
    suffix = ' (Left)';
    name = name.replace(/\.l$/i, '');
  } else if (/\.r$/i.test(name)) {
    suffix = ' (Right)';
    name = name.replace(/\.r$/i, '');
  }
  name = name
    .replace(/^\((.+)\)$/, '$1')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${name}${suffix}`.trim();
}

export function stripLaterality(rawName: string): string {
  return rawName
    .trim()
    .replace(/_\d+$/, '')
    .replace(/\.[lr]$/i, '')
    .replace(/^\((.+)\)$/, '$1')
    .trim();
}

export function isTranslucentSheathMaterialOrMesh(
  materialName?: string,
  meshName?: string
): boolean {
  if (materialName && SHEATH_MATERIAL_RE.test(materialName.trim())) {
    return true;
  }
  if (meshName && SHEATH_NAME_RE.test(meshName)) {
    return true;
  }
  return false;
}

export function parseZAnatomyDefinition(rawDef?: string): {
  summary: string;
  wikipediaUrl?: string;
} {
  if (!rawDef) {
    return { summary: '' };
  }

  let wikipediaUrl: string | undefined;
  const urlMatch = rawDef.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    wikipediaUrl = urlMatch[0].replace(/[),.;]+$/, '');
  }

  const summary = rawDef
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/==+\s*([^=]+?)\s*==+/g, '$1:')
    .replace(/\s+/g, ' ')
    .trim();

  return { summary, wikipediaUrl };
}

function findDictionaryValue<T>(
  dict: Record<string, T>,
  rawName: string
): T | undefined {
  const bare = stripLaterality(rawName);
  const candidates = [
    rawName,
    bare,
    `(${bare})`,
    `${bare}.l`,
    `${bare}.r`,
    `(${rawName})`,
  ];
  for (const key of candidates) {
    if (key in dict && dict[key] !== undefined) {
      return dict[key];
    }
  }
  return undefined;
}

const SYSTEM_HIGH_YIELD_HINTS: Record<ZAnatomySystemKey, string> = {
  skeletal:
    'Check articular surfaces, vascular foramina, and bony landmarks for fracture lines and nerve entrapment.',
  joints:
    'Assess ligamentous stabilizers, capsular attachments, and joint range-of-motion axes.',
  muscular:
    'Trace proximal origin, distal insertion, primary vector action, and peripheral motor nerve innervation.',
  cardiovascular:
    'Correlate arterial territory, anastomotic collaterals, and venous drainage pathways for ischemic syndromes.',
  lymphatic:
    'Map regional lymph node drainage basins to evaluate infection spread and metastatic staging.',
  nervous:
    'Localize central nuclei, tract decussation levels, and peripheral sensory/motor root distribution.',
  visceral:
    'Identify peritoneal vs. retroperitoneal relations, dual blood supply, and visceral autonomic innervation.',
};

export function lookupZAnatomyMetadata(
  meshName: string,
  fallbackSystem: ZAnatomySystemKey,
  definitions: Record<string, string>,
  lexicon: Record<string, ZAnatomyLexiconEntry>,
  systemsMap: Record<string, string[]>
): ZAnatomyMetadata {
  const displayName = cleanZAnatomyName(meshName);
  const bare = stripLaterality(meshName);

  const femaleMeta = FEMALE_REPRODUCTIVE_METADATA[bare];
  if (femaleMeta) {
    return {
      rawName: meshName,
      displayName,
      latinName: femaleMeta.latinName,
      isOfficialTA: true,
      system: 'visceral',
      description: femaleMeta.description,
      wikipediaUrl: femaleMeta.wikipediaUrl,
      highYieldFact: femaleMeta.highYieldFact,
    };
  }

  const lexEntry = findDictionaryValue(lexicon, meshName);
  const latinName = lexEntry?.la || `${displayName} (Terminologia Anatomica)`;
  const isOfficialTA = Boolean(lexEntry?.official);

  const rawDef = findDictionaryValue(definitions, meshName);
  const { summary, wikipediaUrl } = parseZAnatomyDefinition(rawDef);

  let resolvedSystem: ZAnatomySystemKey = fallbackSystem;
  for (const [sysKey, list] of Object.entries(systemsMap)) {
    if (
      Array.isArray(list) &&
      (list.includes(meshName) ||
        list.includes(bare) ||
        list.includes(`(${bare})`))
    ) {
      resolvedSystem = sysKey as ZAnatomySystemKey;
      break;
    }
  }

  const description =
    summary ||
    `${displayName} is an anatomical structure of the Z-Anatomy ${resolvedSystem} atlas, registered with surrounding musculoskeletal and neurovascular landmarks.`;

  return {
    rawName: meshName,
    displayName,
    latinName,
    isOfficialTA,
    system: resolvedSystem,
    description,
    wikipediaUrl,
    highYieldFact: SYSTEM_HIGH_YIELD_HINTS[resolvedSystem],
  };
}

export function buildSearchableCatalog(
  systemsMap: Record<string, string[]>,
  lexicon: Record<string, ZAnatomyLexiconEntry>
): ZAnatomySearchEntry[] {
  const seen = new Set<string>();
  const entries: ZAnatomySearchEntry[] = [];

  for (const [sysKey, names] of Object.entries(systemsMap)) {
    if (!Array.isArray(names)) continue;
    const system = sysKey as ZAnatomySystemKey;
    for (const rawName of names) {
      if (!rawName || seen.has(rawName)) continue;
      seen.add(rawName);
      const displayName = cleanZAnatomyName(rawName);
      const lexEntry = findDictionaryValue(lexicon, rawName);
      entries.push({
        rawName,
        displayName,
        latinName: lexEntry?.la,
        official: lexEntry?.official,
        system,
      });
    }
  }

  for (const femaleEntry of FEMALE_REPRODUCTIVE_SEARCH_ENTRIES) {
    if (!seen.has(femaleEntry.rawName)) {
      seen.add(femaleEntry.rawName);
      entries.push(femaleEntry);
    }
  }

  return entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function searchZAnatomyCatalog(
  entries: ZAnatomySearchEntry[],
  query: string,
  limit = 12
): ZAnatomySearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries.slice(0, limit);

  const exactOrPrefix: ZAnatomySearchEntry[] = [];
  const contains: ZAnatomySearchEntry[] = [];

  for (const entry of entries) {
    const en = entry.displayName.toLowerCase();
    const la = (entry.latinName || '').toLowerCase();
    if (en.startsWith(q) || la.startsWith(q)) {
      exactOrPrefix.push(entry);
    } else if (en.includes(q) || la.includes(q) || entry.system.includes(q)) {
      contains.push(entry);
    }
    if (exactOrPrefix.length >= limit) break;
  }

  return [...exactOrPrefix, ...contains].slice(0, limit);
}
