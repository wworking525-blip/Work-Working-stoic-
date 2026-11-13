/**
 * STOIC High-Yield Student Community & Reddit (r/step1, r/medicalschool) Consensus Data
 * Synthesizes gold-standard student mnemonics, "100 Anatomy Concepts" (Dorian/HyGuru),
 * and high-yield board examination traps.
 */

export interface CommunityStudyMnemonic {
  id: string;
  topic: string;
  system: 'skeletal' | 'nervous' | 'cardiovascular' | 'respiratory' | 'digestive' | 'urinary' | 'muscular';
  mnemonic: string;
  expansion: string;
  conceptSummary: string;
  redditSource: string; // e.g. "r/step1 • 100 Anatomy Concepts"
  upvotesEstimate: number;
  clinicalPitfall: string;
  boardYield: 'High-Yield' | 'Ultra-High-Yield';
}

export const REDDIT_STUDENT_MNEMONICS: CommunityStudyMnemonic[] = [
  {
    id: 'radial_nerve_best',
    topic: 'Radial Nerve Motor Innervation',
    system: 'nervous',
    mnemonic: 'BEST',
    expansion: 'B = Brachioradialis, E = Extensors (wrist and fingers), S = Supinator, T = Triceps',
    conceptSummary: 'Radial nerve (C5-T1 posterior cord) supplies all extensor muscles of the upper limb. Midshaft humerus fracture in spiral groove impairs wrist and finger extension, causing wrist drop.',
    redditSource: 'r/step1 • Top Nerve Lesions Consensus',
    upvotesEstimate: 1420,
    clinicalPitfall: 'Midshaft humerus fracture damages the radial nerve in the spiral groove, sparing the triceps (branched proximally in axilla), but paralyzing wrist/finger extensors.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'heart_murmurs_arms_asmr',
    topic: 'Systolic vs Diastolic Heart Murmurs',
    system: 'cardiovascular',
    mnemonic: 'ARMS & ASMR',
    expansion: 'ARMS = Aortic Regurgitation & Mitral Stenosis (Diastolic) | ASMR = Aortic Stenosis & Mitral Regurgitation (Systolic)',
    conceptSummary: 'Simplifies auscultation timing: ARMS are diastolic murmurs; ASMR are systolic murmurs. Left-sided murmurs accentuate on EXPIRATION, while right-sided murmurs accentuate on INSPIRATION (Carvallo sign).',
    redditSource: 'r/step1 • Auscultation Master Thread',
    upvotesEstimate: 1850,
    clinicalPitfall: 'Do not confuse with right-sided murmurs (e.g. Tricuspid Regurgitation). All right-sided murmurs increase in intensity during INSPIRATION because negative thoracic pressure increases right atrial venous return.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'retroperitoneal_sad_pucker',
    topic: 'Retroperitoneal Abdominopelvic Organs',
    system: 'digestive',
    mnemonic: 'SAD PUCKER',
    expansion: 'S = Suprarenal (adrenal) glands, A = Aorta & IVC, D = Duodenum (2nd-4th parts), P = Pancreas (head/body/neck, except tail), U = Ureters, C = Colon (ascending & descending), K = Kidneys, E = Esophagus, R = Rectum',
    conceptSummary: 'Retroperitoneal organs lie posterior to the peritoneum. Injuries or ruptures cause retroperitoneal hematomas or gas tracking without signs of diffuse peritoneal irritation.',
    redditSource: 'r/step1 • 100 Anatomy Concepts',
    upvotesEstimate: 2190,
    clinicalPitfall: 'The tail of the pancreas is INTRAPERITONEAL within the splenorenal ligament; only the head, neck, and body are retroperitoneal.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'diaphragm_apertures_i8_10_eggs',
    topic: 'Diaphragm Levels & Structures',
    system: 'respiratory',
    mnemonic: 'I 8 10 Eggs At 12',
    expansion: 'I 8 = IVC at T8 | 10 Eggs = Esophagus at T10 (with vagus nerve) | At 12 = Aorta at T12 (with thoracic duct & azygos vein)',
    conceptSummary: 'Three major diaphragmatic apertures transmit systemic conduits across the thoracoabdominal junction.',
    redditSource: 'r/step1 • High-Yield Diaphragm Traps',
    upvotesEstimate: 1640,
    clinicalPitfall: 'The thoracic duct traverses the aortic hiatus at T12, NOT the esophageal hiatus. Azygos vein also passes at T12.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'carpal_bones_order',
    topic: 'Carpal Bones Sequence (Proximal to Distal)',
    system: 'skeletal',
    mnemonic: "Some Lovers Try Positions That They Can't Handle",
    expansion: 'Proximal (lateral to medial): Scaphoid, Lunate, Triquetrum, Pisiform | Distal (lateral to medial): Trapezium, Trapezoid, Capitate, Hamate',
    conceptSummary: 'Scaphoid fracture from FOOSH carries high risk of avascular necrosis and nonunion due to retrograde blood supply from dorsal scaphoid branch of radial artery.',
    redditSource: 'r/step1 • Upper Extremity Bones',
    upvotesEstimate: 2890,
    clinicalPitfall: 'Lunate dislocation compresses the median nerve within the carpal tunnel; scaphoid fracture causes tenderness in the anatomical snuffbox.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'cranial_nerve_v_foramina',
    topic: 'Trigeminal Nerve Skull Base Foramina',
    system: 'nervous',
    mnemonic: 'Standing Room Only (SRO)',
    expansion: 'S = Superior orbital fissure (V1 Ophthalmic) | R = foramen Rotundum (V2 Maxillary) | O = foramen Ovale (V3 Mandibular)',
    conceptSummary: 'The three divisions of CN V exit through separate cranial base foramina. V3 also carries branchial motor fibers to the 4 muscles of mastication.',
    redditSource: 'r/step1 • Cranial Base Foramina',
    upvotesEstimate: 1980,
    clinicalPitfall: 'Foramen spinosum transmits the middle meningeal artery (damage causes epidural hematoma), NOT the mandibular nerve.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'femoral_triangle_naval',
    topic: 'Femoral Triangle & Sheath Architecture',
    system: 'muscular',
    mnemonic: 'NAVeL (Lateral to Medial)',
    expansion: 'N = Nerve (Femoral nerve) | A = Artery (Femoral artery) | V = Vein (Femoral vein) | e = empty space (Femoral canal) | L = Lymphatics',
    conceptSummary: 'Femoral canal is medial to the femoral vein. Femoral hernias protrude into the femoral canal medial to the femoral vein and inferior to the inguinal ligament.',
    redditSource: 'r/step1 • Inguinal vs Femoral Hernias',
    upvotesEstimate: 2310,
    clinicalPitfall: 'The Femoral Nerve is NOT contained within the femoral sheath! It lies lateral to the sheath under the iliopsoas fascia.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'facial_nerve_branches_cheek',
    topic: 'Facial Nerve Mimetic Extracranial Branches',
    system: 'nervous',
    mnemonic: 'The Zebra Bit My Cheek',
    expansion: 'T = Temporal | Z = Zygomatic | B = Buccal | M = Marginal mandibular | C = Cervical',
    conceptSummary: 'After exiting the stylomastoid foramen, the facial nerve passes through the substance of the parotid gland to divide into these 5 terminal motor branches.',
    redditSource: 'r/step1 • Head & Neck High Yield',
    upvotesEstimate: 1320,
    clinicalPitfall: 'Parotid gland surgery endangers these branches. The parotid gland itself is secretomotor innervated by CN IX (lesser petrosal via otic ganglion), NOT CN VII.',
    boardYield: 'High-Yield',
  },
  {
    id: 'cranial_nerve_tongue_lesion',
    topic: 'Hypoglossal (CN XII) vs Vagus (CN X) Lesions',
    system: 'nervous',
    mnemonic: 'Lick the Lesion, Uvula Away',
    expansion: 'Hypoglossal LMN: tongue protrudes TOWARD the lesion side | Vagus LMN: uvula deviates AWAY from the lesion side',
    conceptSummary: 'In CN XII lesion, the functional contralateral genioglossus pushes unopposed towards the weak side. In CN X lesion, the intact contralateral levator veli palatini pulls the uvula to the healthy side.',
    redditSource: 'r/step1 • Rapid Review Mnemonics',
    upvotesEstimate: 3100,
    clinicalPitfall: 'Tongue points toward the affected side in LMN CN XII lesions; in cortical UMN strokes, the tongue points away from the cortex lesion side.',
    boardYield: 'Ultra-High-Yield',
  },
  {
    id: 'brachial_plexus_erb_klumpke',
    topic: 'Brachial Plexus Upper vs Lower Trunk Lesions',
    system: 'nervous',
    mnemonic: 'Waiter Tip (Erb C5-C6) vs Total Claw (Klumpke C8-T1)',
    expansion: 'Erb palsy = Upper trunk (C5-C6) lateral neck distraction -> deltoid, supraspinatus, infraspinatus, biceps paralyzed -> arm hangs adducted, internally rotated, forearm pronated | Klumpke palsy = Lower trunk (C8-T1) upward arm traction -> intrinsic hand muscles paralyzed -> total claw hand',
    conceptSummary: 'Classical upper vs lower brachial plexus traction injuries commonly tested on Step 1 obstetric and trauma scenarios.',
    redditSource: 'r/step1 • 100 Anatomy Concepts',
    upvotesEstimate: 2740,
    clinicalPitfall: 'Klumpke palsy also damages sympathetic T1 preganglionic fibers traveling with the ventral root, presenting with concurrent Horner syndrome (ptosis, miosis, anhidrosis).',
    boardYield: 'Ultra-High-Yield',
  },
];

/**
 * Searches community mnemonics by keyword matching topic, mnemonic, expansion, or source.
 */
export function searchCommunityMnemonics(query: string, systemFilter?: string): CommunityStudyMnemonic[] {
  const q = query.trim().toLowerCase();
  return REDDIT_STUDENT_MNEMONICS.filter((item) => {
    if (systemFilter && systemFilter !== 'all' && item.system !== systemFilter) {
      return false;
    }
    if (!q) return true;
    return (
      item.topic.toLowerCase().includes(q) ||
      item.mnemonic.toLowerCase().includes(q) ||
      item.expansion.toLowerCase().includes(q) ||
      item.conceptSummary.toLowerCase().includes(q) ||
      item.clinicalPitfall.toLowerCase().includes(q) ||
      item.redditSource.toLowerCase().includes(q)
    );
  });
}
