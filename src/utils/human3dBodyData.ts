import type { AnatomyData, BodyPartId } from './human3dBodyTypes';

export const defaultAnatomyData: AnatomyData = {
  head: {
    id: "head",
    name: "Head",
    description: "The head contains the brain, sensory organs (eyes, ears, nose, tongue), and the beginning of the digestive and respiratory systems.",
    facts: [
      "The human skull is made up of 22 bones",
      "The brain weighs about 3 pounds (1.4 kg)",
      "The head contains all five sensory organs"
    ],
    color: "#ff6b6b"
  },
  neck: {
    id: "neck",
    name: "Neck",
    description: "The neck connects the head to the torso, containing the cervical spine, trachea, esophagus, and major blood vessels.",
    facts: [
      "The neck contains 7 cervical vertebrae",
      "Major arteries and veins pass through the neck",
      "The thyroid gland is located in the neck"
    ],
    color: "#ffa94d"
  },
  leftShoulder: {
    id: "leftShoulder",
    name: "Left Shoulder",
    description: "The shoulder joint is one of the most mobile joints in the body, connecting the arm to the torso.",
    facts: [
      "The shoulder has the greatest range of motion of any joint",
      "It consists of three bones: clavicle, scapula, and humerus",
      "Four rotator cuff muscles stabilize the shoulder"
    ],
    color: "#ffd43b"
  },
  rightShoulder: {
    id: "rightShoulder",
    name: "Right Shoulder",
    description: "The shoulder joint is one of the most mobile joints in the body, connecting the arm to the torso.",
    facts: [
      "The shoulder has the greatest range of motion of any joint",
      "It consists of three bones: clavicle, scapula, and humerus",
      "Four rotator cuff muscles stabilize the shoulder"
    ],
    color: "#ffd43b"
  },
  chest: {
    id: "chest",
    name: "Chest",
    description: "The chest (thorax) contains and protects vital organs including the heart and lungs, enclosed by the ribcage.",
    facts: [
      "The ribcage consists of 12 pairs of ribs",
      "The chest cavity is separated from the abdomen by the diaphragm",
      "Intercostal muscles between ribs assist in breathing"
    ],
    color: "#74c0fc"
  },
  heart: {
    id: "heart",
    name: "Heart",
    description: "The heart is a muscular organ that pumps blood throughout the body via the circulatory system.",
    facts: [
      "The heart beats about 100,000 times per day",
      "It pumps about 2,000 gallons of blood daily",
      "The heart has four chambers: two atria and two ventricles"
    ],
    color: "#ff6b9d"
  },
  leftLung: {
    id: "leftLung",
    name: "Left Lung",
    description: "The left lung has two lobes and is slightly smaller than the right to accommodate the heart.",
    facts: [
      "The left lung has two lobes (superior and inferior)",
      "Lungs contain about 300 million alveoli",
      "The left lung is about 10% smaller than the right"
    ],
    color: "#69db7c"
  },
  rightLung: {
    id: "rightLung",
    name: "Right Lung",
    description: "The right lung is larger than the left and has three lobes.",
    facts: [
      "The right lung has three lobes",
      "It handles more air volume than the left lung",
      "The bronchi divide into smaller bronchioles in each lung"
    ],
    color: "#69db7c"
  },
  spine: {
    id: "spine",
    name: "Spine",
    description: "The spine (vertebral column) protects the spinal cord and provides structural support for the body.",
    facts: [
      "The spine consists of 33 vertebrae",
      "It has natural curves that help absorb shock",
      "The spinal cord runs through the vertebral canal"
    ],
    color: "#b197fc"
  },
  leftArm: {
    id: "leftArm",
    name: "Left Arm",
    description: "The arm extends from the shoulder to the wrist, containing the humerus, radius, and ulna bones.",
    facts: [
      "The arm contains three main bones",
      "The elbow is a hinge joint",
      "Muscles in the arm enable flexion and extension"
    ],
    color: "#fcc419"
  },
  rightArm: {
    id: "rightArm",
    name: "Right Arm",
    description: "The arm extends from the shoulder to the wrist, containing the humerus, radius, and ulna bones.",
    facts: [
      "The arm contains three main bones",
      "The elbow is a hinge joint",
      "Muscles in the arm enable flexion and extension"
    ],
    color: "#fcc419"
  },
  liver: {
    id: "liver",
    name: "Liver",
    description: "The liver is the largest internal organ, responsible for metabolism, detoxification, and bile production.",
    facts: [
      "The liver can regenerate itself",
      "It performs over 500 functions",
      "The liver weighs about 3 pounds"
    ],
    color: "#e599f7"
  },
  leftKidney: {
    id: "leftKidney",
    name: "Left Kidney",
    description: "The kidneys filter blood, remove waste, and regulate fluid balance in the body.",
    facts: [
      "Kidneys filter about 200 quarts of blood daily",
      "Each kidney contains about 1 million nephrons",
      "The left kidney is slightly higher than the right"
    ],
    color: "#99e9f2"
  },
  rightKidney: {
    id: "rightKidney",
    name: "Right Kidney",
    description: "The kidneys filter blood, remove waste, and regulate fluid balance in the body.",
    facts: [
      "Kidneys filter about 200 quarts of blood daily",
      "Each kidney contains about 1 million nephrons",
      "The right kidney sits slightly lower due to the liver"
    ],
    color: "#99e9f2"
  },
  lowerBack: {
    id: "lowerBack",
    name: "Lower Back",
    description: "The lower back (lumbar region) supports the upper body and allows for movement and flexibility.",
    facts: [
      "The lumbar spine has 5 vertebrae",
      "It bears most of the body's weight",
      "Lower back muscles are crucial for posture"
    ],
    color: "#b197fc"
  },
  abdomen: {
    id: "abdomen",
    name: "Abdomen",
    description: "The abdomen contains digestive organs including the stomach, intestines, liver, and pancreas.",
    facts: [
      "The abdomen houses most digestive organs",
      "Abdominal muscles protect internal organs",
      "The peritoneum lines the abdominal cavity"
    ],
    color: "#a9e34b"
  },
  hip: {
    id: "hip",
    name: "Hip",
    description: "The hip joint connects the leg to the pelvis and is one of the body's largest weight-bearing joints.",
    facts: [
      "The hip is a ball-and-socket joint",
      "It supports body weight during movement",
      "The pelvis consists of three fused bones"
    ],
    color: "#fab005"
  },
  leftLeg: {
    id: "leftLeg",
    name: "Left Leg",
    description: "The leg extends from the hip to the ankle, containing the femur, tibia, and fibula bones.",
    facts: [
      "The femur is the longest bone in the body",
      "The leg contains powerful muscles for walking",
      "The knee is the largest joint in the body"
    ],
    color: "#38d9a9"
  },
  rightLeg: {
    id: "rightLeg",
    name: "Right Leg",
    description: "The leg extends from the hip to the ankle, containing the femur, tibia, and fibula bones.",
    facts: [
      "The femur is the longest bone in the body",
      "The leg contains powerful muscles for walking",
      "The knee is the largest joint in the body"
    ],
    color: "#38d9a9"
  },
  leftFoot: {
    id: "leftFoot",
    name: "Left Foot",
    description: "The foot provides balance, support, and propulsion for walking and running.",
    facts: [
      "Each foot has 26 bones",
      "The foot has three arches for shock absorption",
      "There are over 100 muscles, tendons, and ligaments in each foot"
    ],
    color: "#4dabf7"
  },
  rightFoot: {
    id: "rightFoot",
    name: "Right Foot",
    description: "The foot provides balance, support, and propulsion for walking and running.",
    facts: [
      "Each foot has 26 bones",
      "The foot has three arches for shock absorption",
      "There are over 100 muscles, tendons, and ligaments in each foot"
    ],
    color: "#4dabf7"
  }
};
