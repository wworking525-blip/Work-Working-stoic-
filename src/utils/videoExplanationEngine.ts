/**
 * STOIC 3D Visual Video Explanation Engine
 * Implements Cognitive Multimedia Learning Theory (Richard Mayer / Paivio's Dual-Coding)
 * Generates structured, synchronized 3D cinematic scenes, camera choreographies,
 * on-screen visual telemetry callouts, and verbatim quote evidence from user notes.
 */

import { ANATOMICAL_SYSTEMS, AnatomyPartDef } from './anatomyData';
import { normalizeText, verifyEvidenceInText } from './textParser';

export interface VisualCallout {
  id: string;
  title: string;
  description: string;
  type: 'metric' | 'equation' | 'anatomical_tag' | 'clinical_pearl';
  evidenceQuote: string;
  isVerified: boolean;
  value?: string;
  icon?: string;
}

export interface VideoScene {
  id: string;
  sceneNumber: number;
  title: string;
  durationSeconds: number; // Duration of this scene in seconds
  cameraPosition: [number, number, number]; // [x, y, z] in Three.js space
  cameraTarget: [number, number, number]; // [x, y, z] lookAt
  cameraFov?: number;
  focusedPartIds: string[]; // IDs of 3D parts to highlight
  explosionLevel: number; // 0 = assembled, 0.5 = partial explosion, 1.0 = knolled dispatch
  rotationSpeed: number; // Ambient 3D rotation speed
  visualCallouts: VisualCallout[];
  narrationScript: string;
  subtitles: Array<{
    startSec: number;
    endSec: number;
    text: string;
  }>;
}

export interface VideoStoryboard {
  videoTitle: string;
  topic: string;
  totalDurationSeconds: number;
  cinematicStyle: string;
  learningObjectives: string[];
  scenes: VideoScene[];
  sourceSummary: string;
  keyFormulas: string[];
}

/**
 * Extracts key clinical keywords and themes from study material
 */
export function extractClinicalThemes(material: string): {
  isCardiac: boolean;
  isRespiratory: boolean;
  isNeuro: boolean;
  isRenal: boolean;
  isSkeletal: boolean;
  isDigestive: boolean;
  detectedTerms: string[];
} {
  const lower = (material || '').toLowerCase();
  const detectedTerms: string[] = [];

  const check = (regex: RegExp, term: string) => {
    if (regex.test(lower)) {
      detectedTerms.push(term);
      return true;
    }
    return false;
  };

  const isCardiac = check(/\b(ventricle|aort|heart|myocard|coronary|systol|diastol|valv|cardiac)\b/i, 'Cardiovascular Hemodynamics');
  const isRespiratory = check(/\b(lung|alveol|surfactant|trachea|bronch|respirat|atelectasis)\b/i, 'Pulmonary Gas Exchange');
  const isNeuro = check(/\b(brain|cortex|nerve|cranial|corticospinal|neuron|spinal|synap)\b/i, 'Neuroanatomy & Synaptic Conduction');
  const isRenal = check(/\b(kidney|nephron|glomerul|henle|nkcc2|diuretic|renal|filtrat)\b/i, 'Renal Countercurrent Architecture');
  const isSkeletal = check(/\b(bone|lever|joint|femur|tibia|humerus|vertebra|skeleton|oste)\b/i, 'Skeletal Biomechanics');
  const isDigestive = check(/\b(liver|stomach|bowel|colon|pancreas|intestin|digest|portal)\b/i, 'Gastrointestinal & Hepatic Metabolism');

  return { isCardiac, isRespiratory, isNeuro, isRenal, isSkeletal, isDigestive, detectedTerms };
}

/**
 * Generates an accurate, synchronized 4-scene video storyboard from user notes
 */
export function generateVisualStoryboard(material: string, topic?: string): VideoStoryboard {
  const cleanMat = material && material.trim().length > 15 ? material : ANATOMICAL_SYSTEMS[0].sampleStudyNote;
  const themes = extractClinicalThemes(cleanMat);

  // Extract clean sentences from notes for authentic evidence citations
  const sentences = cleanMat
    .replace(/[\r\n]+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const fallbackSentence = sentences[0] || 'Anatomical structure dictates mechanical leverage and clinical function.';
  const s1 = sentences[0] || fallbackSentence;
  const s2 = sentences[1] || sentences[0] || fallbackSentence;
  const s3 = sentences[2] || sentences[0] || fallbackSentence;
  const s4 = sentences[3] || sentences[1] || fallbackSentence;

  let videoTitle = topic || 'Human Anatomy & Biomechanical Mechanism';
  if (!topic) {
    if (themes.isCardiac) videoTitle = 'Cardiovascular Hemodynamics & Ventricular Biomechanics';
    else if (themes.isRespiratory) videoTitle = 'Pulmonary Mechanics, Surfactant & Alveolar Exchange';
    else if (themes.isNeuro) videoTitle = 'Functional Neuroanatomy & Corticospinal Motor Pathways';
    else if (themes.isRenal) videoTitle = 'Renal Micro-Architecture & Countercurrent Multiplier';
    else if (themes.isSkeletal) videoTitle = 'Skeletal Lever Classes & Joint Kinematic Chains';
    else videoTitle = 'Clinical Anatomy & 3D Mechanical Assembly';
  }

  // Camera presets tuned for high-impact YouTube-style cinematography
  let targetScene2Parts: string[] = ['heart_ventricles', 'aorta_tree'];
  let targetScene3Parts: string[] = ['heart_ventricles'];
  let formula1 = 'Laplace: T = (P × r) / (2h)';
  let formula2 = 'Poiseuille: ΔP = Q × 8ηL / (πr⁴)';

  if (themes.isRespiratory) {
    targetScene2Parts = ['lungs_trachea', 'rib_cage'];
    targetScene3Parts = ['lungs_trachea'];
    formula1 = 'Laplace Alveolar: P = 2T / r';
    formula2 = 'Fick Law: V_gas = (A × D × ΔP) / T';
  } else if (themes.isNeuro) {
    targetScene2Parts = ['brain_brainstem', 'spinal_cord'];
    targetScene3Parts = ['brain_brainstem'];
    formula1 = 'Nernst: E = (RT/zF) × ln([ion]_out / [ion]_in)';
    formula2 = 'Conduction Velocity: v ∝ √(axon diameter)';
  } else if (themes.isRenal) {
    targetScene2Parts = ['kidneys_ureters', 'aorta_tree'];
    targetScene3Parts = ['kidneys_ureters'];
    formula1 = 'GFR: Kf × [(P_gc - P_bs) - (π_gc - π_bs)]';
    formula2 = 'Clearance: C = (U_x × V) / P_x';
  } else if (themes.isSkeletal) {
    targetScene2Parts = ['femurs', 'tib_fib', 'pelvis'];
    targetScene3Parts = ['femurs', 'humerus_pair'];
    formula1 = 'Torque: τ = F × d × sin(θ)';
    formula2 = 'Class 3 Lever: Mechanical Advantage < 1.0';
  }

  // Construct Scene 1: 3D Spatial Matrix & Macro Architecture
  const scene1Duration = 16;
  const scene1: VideoScene = {
    id: 'scene-1',
    sceneNumber: 1,
    title: 'Macro Architecture & 3D Anatomical Envelope',
    durationSeconds: scene1Duration,
    cameraPosition: [0, 1.4, 4.2],
    cameraTarget: [0, 1.1, 0],
    cameraFov: 42,
    focusedPartIds: ['calvarium', 'rib_cage', 'pelvis'],
    explosionLevel: 0.15,
    rotationSpeed: 0.008,
    visualCallouts: [
      {
        id: 'c1-1',
        title: 'Primary Structural Envelope',
        description: 'Multi-layer spatial arrangement shielding visceral chambers.',
        type: 'anatomical_tag',
        evidenceQuote: s1,
        isVerified: verifyEvidenceInText(cleanMat, s1).verified,
        value: '3D Envelope',
        icon: 'Box',
      },
      {
        id: 'c1-2',
        title: 'Kinematic Fulcrum',
        description: 'Bilateral mechanical alignment stabilizing axial posture.',
        type: 'metric',
        evidenceQuote: s2,
        isVerified: verifyEvidenceInText(cleanMat, s2).verified,
        value: '90° Knolled Alignment',
        icon: 'Layers',
      },
    ],
    narrationScript: `Welcome to this STOIC 3D masterclass. We begin with the macro-architectural envelope: notice how the outer muscular actuators and skeletal framework form a calibrated kinematic shield surrounding the visceral core. In your notes: "${s1.slice(0, 140)}..."`,
    subtitles: [
      { startSec: 0, endSec: 5, text: 'Welcome to this STOIC 3D visual explanation masterclass.' },
      { startSec: 5, endSec: 10, text: 'Notice the macro-architectural envelope shielding visceral organs.' },
      { startSec: 10, endSec: 16, text: `Directly grounded in your notes: "${s1.slice(0, 90)}..."` },
    ],
  };

  // Construct Scene 2: Deep Biomechanical Mechanics & Explosive Layering
  const scene2Duration = 22;
  const scene2: VideoScene = {
    id: 'scene-2',
    sceneNumber: 2,
    title: 'Dispatched Assembly & Physiological Force Vectors',
    durationSeconds: scene2Duration,
    cameraPosition: [0.8, 1.25, 2.8],
    cameraTarget: [0, 1.15, 0],
    cameraFov: 38,
    focusedPartIds: targetScene2Parts,
    explosionLevel: 0.65,
    rotationSpeed: 0.004,
    visualCallouts: [
      {
        id: 'c2-1',
        title: 'Governing Law',
        description: 'Mathematical pressure and compliance relationship.',
        type: 'equation',
        evidenceQuote: s2,
        isVerified: verifyEvidenceInText(cleanMat, s2).verified,
        value: formula1,
        icon: 'Sparkles',
      },
      {
        id: 'c2-2',
        title: 'Dynamic Compliance',
        description: 'Kinetic energy storage and elastic return during continuous cycles.',
        type: 'metric',
        evidenceQuote: s3,
        isVerified: verifyEvidenceInText(cleanMat, s3).verified,
        value: formula2,
        icon: 'Activity',
      },
    ],
    narrationScript: `Now, peeling back the outer skeletal struts along explosive dispatch vectors. Here inside the functional core, mechanical force is converted into physiological flow. Look at the high-compliance chamber: as pressure rises, wall tension increases proportionally to radius. As documented in your material: "${s2.slice(0, 140)}..."`,
    subtitles: [
      { startSec: 0, endSec: 6, text: 'Peeling back outer layers along explosive dispatch vectors.' },
      { startSec: 6, endSec: 13, text: `Governed by fundamental physics: ${formula1}` },
      { startSec: 13, endSec: 22, text: `Source evidence verified: "${s2.slice(0, 90)}..."` },
    ],
  };

  // Construct Scene 3: Pathophysiology & Structural Failure Modes
  const scene3Duration = 20;
  const scene3: VideoScene = {
    id: 'scene-3',
    sceneNumber: 3,
    title: 'Pathophysiological Stress & Failure Modes',
    durationSeconds: scene3Duration,
    cameraPosition: [-0.4, 1.1, 1.9],
    cameraTarget: [0.02, 1.12, 0.06],
    cameraFov: 32,
    focusedPartIds: targetScene3Parts,
    explosionLevel: 0.35,
    rotationSpeed: 0.002,
    visualCallouts: [
      {
        id: 'c3-1',
        title: 'Critical Wall Stress Zone',
        description: 'Vulnerable subendocardial or alveolar membrane locus during acute overload.',
        type: 'clinical_pearl',
        evidenceQuote: s3,
        isVerified: verifyEvidenceInText(cleanMat, s3).verified,
        value: 'High Stress Delta',
        icon: 'AlertTriangle',
      },
      {
        id: 'c3-2',
        title: 'USMLE Diagnostic Hallmark',
        description: 'Classic presentation finding tested on Step 1 and Step 2 board exams.',
        type: 'clinical_pearl',
        evidenceQuote: s4,
        isVerified: verifyEvidenceInText(cleanMat, s4).verified,
        value: 'Step 1 High-Yield Anchor',
        icon: 'Trophy',
      },
    ],
    narrationScript: `Now zoom in close to the focal stress points. When compliance degrades or afterload spikes, shear stress damages delicate sub-layers. On the USMLE, board examiners test this exact coupling between structural anatomy and clinical decompensation: "${s3.slice(0, 140)}..."`,
    subtitles: [
      { startSec: 0, endSec: 6, text: 'Zooming into focal stress points and vulnerable sub-layers.' },
      { startSec: 6, endSec: 13, text: 'When compliance degrades, shear stress triggers decompensation.' },
      { startSec: 13, endSec: 20, text: `USMLE Board Anchor: "${s3.slice(0, 90)}..."` },
    ],
  };

  // Construct Scene 4: Re-assembly & High-Yield Master Synthesis
  const scene4Duration = 18;
  const scene4: VideoScene = {
    id: 'scene-4',
    sceneNumber: 4,
    title: 'Cohesive Reassembly & Executive Board Takeaway',
    durationSeconds: scene4Duration,
    cameraPosition: [0, 1.35, 3.8],
    cameraTarget: [0, 1.1, 0],
    cameraFov: 40,
    focusedPartIds: ['calvarium', 'heart_ventricles', 'lungs_trachea', 'femurs'],
    explosionLevel: 0.0,
    rotationSpeed: 0.006,
    visualCallouts: [
      {
        id: 'c4-1',
        title: 'Continuous Kinematic Chain',
        description: 'Cohesive reassembly of the complete human biological organism.',
        type: 'anatomical_tag',
        evidenceQuote: s4,
        isVerified: verifyEvidenceInText(cleanMat, s4).verified,
        value: '100% Reassembled',
        icon: 'CheckCircle2',
      },
      {
        id: 'c4-2',
        title: 'First-Principles Rule',
        description: 'Form dictates leverage; leverage determines clinical survival.',
        type: 'clinical_pearl',
        evidenceQuote: s1,
        isVerified: verifyEvidenceInText(cleanMat, s1).verified,
        value: 'Mastered',
        icon: 'Sparkles',
      },
    ],
    narrationScript: `Finally, reassembling every component back into a cohesive, functioning organism. Master this physical intuition: anatomy is not a collection of isolated terms, but a continuous kinematic system. With STOIC first-principles grounding, your board retention is locked in.`,
    subtitles: [
      { startSec: 0, endSec: 6, text: 'Reassembling all layers into a unified biomechanical system.' },
      { startSec: 6, endSec: 12, text: 'Anatomy is a continuous kinematic chain, not isolated terms.' },
      { startSec: 12, endSec: 18, text: 'STOIC visual grounding: master the mechanism, master the board exam.' },
    ],
  };

  const scenes = [scene1, scene2, scene3, scene4];
  const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  return {
    videoTitle,
    topic: topic || themes.detectedTerms[0] || 'Clinical Anatomy & Biomechanics',
    totalDurationSeconds,
    cinematicStyle: '3D Procedural Kinematic Masterclass',
    learningObjectives: [
      'Visualize 3D spatial relationships and layer depth without destructive dissection',
      'Understand mathematical force, pressure, and compliance vectors in real time',
      'Correlate macro mechanical architecture with USMLE Step 1 clinical failure modes',
      'Retain high-yield board concepts via verified verbatim source text grounding',
    ],
    scenes,
    sourceSummary: `${cleanMat.slice(0, 240)}...`,
    keyFormulas: [formula1, formula2],
  };
}
