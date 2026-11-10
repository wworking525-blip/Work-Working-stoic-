export type BodyPartId =
  | "head" | "neck" | "leftShoulder" | "rightShoulder"
  | "chest" | "heart" | "leftLung" | "rightLung" | "spine"
  | "leftArm" | "rightArm" | "liver" | "leftKidney" | "rightKidney"
  | "lowerBack" | "abdomen" | "hip" | "leftLeg" | "rightLeg"
  | "leftFoot" | "rightFoot";

export interface BodyPartInfo {
  id: BodyPartId;
  name: string;
  description: string;
  facts: string[];
  color: string;
}

export interface AnatomyData {
  [key: string]: BodyPartInfo;
}

export interface ControlsConfig {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  horizontalOnly?: boolean;
}

export interface LightingConfig {
  ambientIntensity?: number;
  directionalIntensity?: number;
}

export interface HumanAnatomyViewerProps {
  modelUrl?: string;
  onPartSelect?: (partId: string | null, partInfo: BodyPartInfo | null) => void;
  onPartHover?: (partId: string | null) => void;
  initialPartId?: string | null;
  anatomyData?: AnatomyData;
  renderInfoContent?: (partId: string) => React.ReactNode;
  controlsConfig?: ControlsConfig;
  lightingConfig?: LightingConfig;
  showInfoPanel?: boolean;
  infoPanelPosition?: 'left' | 'right';
  infoPanelTitle?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface HumanBodyProps {
  onPartClick: (partId: string) => void;
  onPartHover?: (partId: string | null) => void;
  selectedPart: string | null;
  modelPath: string;
}

export interface InfoPanelProps {
  selectedPartId: string | null;
  anatomyData?: AnatomyData;
  renderContent?: (partId: string) => React.ReactNode;
  onClose: () => void;
  position?: 'left' | 'right';
  title?: string;
}
