import React from 'react';

interface SystemCardPreviewProps {
  systemId: string;
  accent: string;
}

/**
 * Renders an exact Innerbody-style visual card preview:
 * An iconic, semi-transparent human figure silhouette with the active system's
 * anatomical organs/skeleton/vessels/muscles highlighted in authentic clinical colors.
 */
export const SystemCardPreview: React.FC<SystemCardPreviewProps> = ({
  systemId,
  accent,
}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 160 260"
        className="w-auto h-48 md:h-52 filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft background glow */}
        <ellipse cx="80" cy="130" rx="55" ry="95" fill={accent} fillOpacity="0.06" />

        {/* 1. Translucent Human Body Silhouette Outline (Matching Innerbody Reference) */}
        <g opacity="0.32" stroke="#94a3b8" strokeWidth="1.2" fill="#f1f5f9" fillOpacity="0.75">
          {/* Head & Neck */}
          <path d="M72,32 C72,21 88,21 88,32 C88,40 85,46 80,47 C75,46 72,40 72,32 Z" />
          <path d="M76,46 L76,54 L84,54 L84,46 Z" />

          {/* Torso & Pelvis */}
          <path d="M63,56 C70,55 90,55 97,56 C101,65 101,92 98,108 C96,118 94,124 96,136 C96,144 93,148 89,152 L71,152 C67,148 64,144 64,136 C66,124 64,118 62,108 C59,92 59,65 63,56 Z" />

          {/* Left Arm & Hand */}
          <path d="M62,58 C56,66 53,88 52,106 C51,118 48,135 46,146 C45,150 42,154 44,158 C46,160 48,158 50,154 C53,144 55,124 57,110 C58,95 62,72 65,64 Z" />

          {/* Right Arm & Hand */}
          <path d="M98,58 C104,66 107,88 108,106 C109,118 112,135 114,146 C115,150 118,154 116,158 C114,160 112,158 110,154 C107,144 105,124 103,110 C102,95 98,72 95,64 Z" />

          {/* Left Leg & Foot */}
          <path d="M67,152 C67,168 66,192 67,212 C67,224 65,242 63,248 C62,251 58,252 64,254 C70,254 72,250 72,246 C74,236 75,214 75,196 C75,180 77,165 77,152 Z" />

          {/* Right Leg & Foot */}
          <path d="M93,152 C93,168 94,192 93,212 C93,224 95,242 97,248 C98,251 102,252 96,254 C90,254 88,250 88,246 C86,236 85,214 85,196 C85,180 83,165 83,152 Z" />
        </g>

        {/* 2. System-Specific Internal Anatomical Rendering (Innerbody Style) */}
        {systemId === 'skeletal' && (
          <g stroke="#92400e" strokeWidth="1.2" fill="#fef3c7" opacity="0.95">
            {/* Skull & Facial Bones */}
            <path d="M73,26 C73,19 87,19 87,26 C87,31 85,34 83,35 L83,38 L77,38 L77,35 C75,34 73,31 73,26 Z" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <circle cx="76.5" cy="27" r="1.3" fill="#78350f" />
            <circle cx="83.5" cy="27" r="1.3" fill="#78350f" />
            <rect x="78" y="34" width="4" height="3" rx="0.5" fill="#fef9c3" stroke="#b45309" strokeWidth="0.8" />
            {/* Cervical & Thoracic Spine */}
            <line x1="80" y1="39" x2="80" y2="132" stroke="#b45309" strokeWidth="2.8" strokeDasharray="1.5,1.5" />
            {/* Clavicles */}
            <path d="M64,54 Q80,57 96,54" stroke="#b45309" strokeWidth="2" fill="none" />
            {/* Scapulae */}
            <path d="M62,58 L68,66 L60,74 Z M98,58 L92,66 L100,74 Z" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />
            {/* Ribcage */}
            <g fill="none" stroke="#d97706" strokeWidth="1.3">
              <path d="M68,62 Q80,66 92,62" />
              <path d="M66,69 Q80,74 94,69" />
              <path d="M65,76 Q80,82 95,76" />
              <path d="M66,83 Q80,89 94,83" />
              <path d="M68,90 Q80,95 92,90" />
              <path d="M71,97 Q80,100 89,97" />
              <rect x="78.5" y="60" width="3" height="36" rx="1" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            </g>
            {/* Pelvis & Sacrum */}
            <path d="M66,126 C68,118 76,122 80,126 C84,122 92,118 94,126 C95,135 91,142 80,142 C69,142 65,135 66,126 Z" fill="#fef08a" stroke="#b45309" strokeWidth="1.2" />
            <circle cx="74" cy="132" r="3.2" fill="#fff" stroke="#d97706" strokeWidth="0.8" />
            <circle cx="86" cy="132" r="3.2" fill="#fff" stroke="#d97706" strokeWidth="0.8" />
            {/* Humerus, Radius, Ulna */}
            <line x1="62" y1="58" x2="54" y2="102" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="53" y1="104" x2="48" y2="146" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="55" y1="105" x2="50" y2="147" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="47" cy="150" r="2.5" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
            <line x1="98" y1="58" x2="106" y2="102" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="107" y1="104" x2="112" y2="146" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="105" y1="105" x2="110" y2="147" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="113" cy="150" r="2.5" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
            {/* Femur, Patella, Tibia, Fibula, Feet */}
            <line x1="72" y1="138" x2="69" y2="192" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
            <circle cx="69" cy="194" r="2" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <line x1="69" y1="196" x2="67" y2="242" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="71" y1="197" x2="69" y2="242" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="65" cy="246" rx="4" ry="2" fill="#fde68a" stroke="#b45309" strokeWidth="1" />

            <line x1="88" y1="138" x2="91" y2="192" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
            <circle cx="91" cy="194" r="2" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <line x1="91" y1="196" x2="93" y2="242" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="89" y1="197" x2="91" y2="242" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="95" cy="246" rx="4" ry="2" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
          </g>
        )}

        {systemId === 'muscular' && (
          <g fill="#be123c" opacity="0.94" stroke="#881337" strokeWidth="0.4">
            {/* Facial & Neck muscles */}
            <path d="M76,26 C76,21 84,21 84,26 C84,33 82,37 80,37 C78,37 76,33 76,26 Z" fill="#9f1239" />
            <path d="M75,44 L72,56 L77,56 L77,44 Z M85,44 L88,56 L83,56 L83,44 Z" fill="#be123c" />
            {/* Trapezius & Deltoids */}
            <path d="M72,52 L80,57 L88,52 L95,60 L92,68 L80,62 L68,68 L65,60 Z" fill="#9f1239" />
            <ellipse cx="61" cy="65" rx="5.5" ry="8" fill="#e11d48" />
            <ellipse cx="99" cy="65" rx="5.5" ry="8" fill="#e11d48" />
            {/* Pectoralis Major */}
            <path d="M65,63 C74,60 79,66 79,75 C73,76 65,74 65,63 Z" fill="#be123c" />
            <path d="M95,63 C86,60 81,66 81,75 C87,76 95,74 95,63 Z" fill="#be123c" />
            {/* Serratus Anterior & External Obliques */}
            <path d="M64,78 L68,80 L65,86 L68,88 L65,94 L70,96 L67,112 L63,106 Z" fill="#9f1239" />
            <path d="M96,78 L92,80 L95,86 L92,88 L95,94 L90,96 L93,112 L97,106 Z" fill="#9f1239" />
            {/* Rectus Abdominis (Six-pack with tendon intersections) */}
            <rect x="73" y="78" width="6.5" height="7.5" rx="1.5" fill="#e11d48" />
            <rect x="80.5" y="78" width="6.5" height="7.5" rx="1.5" fill="#e11d48" />
            <rect x="73" y="87" width="6.5" height="7.5" rx="1.5" fill="#e11d48" />
            <rect x="80.5" y="87" width="6.5" height="7.5" rx="1.5" fill="#e11d48" />
            <rect x="73" y="96" width="6.5" height="8.5" rx="1.5" fill="#be123c" />
            <rect x="80.5" y="96" width="6.5" height="8.5" rx="1.5" fill="#be123c" />
            <rect x="74" y="106" width="5.5" height="10" rx="1.5" fill="#9f1239" />
            <rect x="80.5" y="106" width="5.5" height="10" rx="1.5" fill="#9f1239" />
            {/* Biceps & Forearm Flexors */}
            <ellipse cx="56" cy="86" rx="4.5" ry="12" fill="#e11d48" />
            <ellipse cx="104" cy="86" rx="4.5" ry="12" fill="#e11d48" />
            <ellipse cx="51" cy="120" rx="3.5" ry="14" fill="#be123c" />
            <ellipse cx="109" cy="120" rx="3.5" ry="14" fill="#be123c" />
            {/* Gluteal / Iliopsoas region */}
            <path d="M68,124 C72,120 78,122 79,132 L68,136 Z M92,124 C88,120 82,122 81,132 L92,136 Z" fill="#9f1239" />
            {/* Quadriceps (Rectus Femoris, Vastus Medialis/Lateralis) */}
            <ellipse cx="71" cy="168" rx="6.5" ry="24" fill="#e11d48" />
            <ellipse cx="89" cy="168" rx="6.5" ry="24" fill="#e11d48" />
            <ellipse cx="66" cy="172" rx="3.5" ry="20" fill="#9f1239" />
            <ellipse cx="94" cy="172" rx="3.5" ry="20" fill="#9f1239" />
            {/* Gastrocnemius (Calf) & Soleus */}
            <ellipse cx="69" cy="218" rx="5" ry="16" fill="#be123c" />
            <ellipse cx="91" cy="218" rx="5" ry="16" fill="#be123c" />
            <path d="M67,234 L71,234 L70,246 L68,246 Z M89,234 L93,234 L92,246 L90,246 Z" fill="#fde047" opacity="0.6" /> {/* Achilles tendon */}
          </g>
        )}

        {systemId === 'cardiovascular' && (
          <g>
            {/* Heart 4 Chambers in Thoracic Center */}
            <path
              d="M80,72 C75,64 67,67 67,76 C67,88 80,96 80,96 C80,96 93,88 93,76 C93,67 85,64 80,72 Z"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="0.8"
            />
            {/* Aortic Arch (Curving left then downward) */}
            <path
              d="M78,72 C76,58 86,56 86,66 L86,134 L73,184 L71,238 M86,134 L97,184 L99,238"
              stroke="#ef4444"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Carotid & Subclavian Arteries into head and arms */}
            <path
              d="M79,59 L75,34 M83,59 L85,34 M77,63 L54,104 L48,145 M85,63 L106,104 L112,145"
              stroke="#ef4444"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            {/* Coronary arteries on heart */}
            <path d="M78,74 Q80,82 76,90 M82,76 Q84,82 86,88" stroke="#fca5a5" strokeWidth="1" fill="none" />
            {/* Vena Cava (Superior & Inferior) & Jugular/Femoral Veins */}
            <path
              d="M75,68 L75,132 L67,184 L65,238 M75,132 L87,184 L89,238"
              stroke="#2563eb"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M74,62 L73,35 M77,62 L77,35 M73,66 L52,104 L46,145 M77,66 L108,104 L114,145"
              stroke="#3b82f6"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Capillary mesh in lungs & kidneys */}
            <ellipse cx="69" cy="82" rx="4" ry="6" fill="#fca5a5" opacity="0.3" />
            <ellipse cx="91" cy="82" rx="4" ry="6" fill="#fca5a5" opacity="0.3" />
          </g>
        )}

        {systemId === 'digestive' && (
          <g>
            {/* Oral cavity & Tongue */}
            <path d="M77,32 Q80,34 83,32" stroke="#fb7185" strokeWidth="2" fill="none" />
            {/* Esophagus tube down through diaphragm */}
            <path d="M80,35 L80,78" stroke="#fda4af" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* Stomach J-shape */}
            <path
              d="M79,78 C71,76 66,84 68,96 C70,105 82,104 86,97 C87,90 83,82 79,78 Z"
              fill="#e11d48"
              stroke="#9f1239"
              strokeWidth="0.8"
            />
            {/* Liver (Right upper quadrant wedge) */}
            <path
              d="M78,76 C88,74 96,80 95,92 C94,97 82,97 78,92 Z"
              fill="#9a3412"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            {/* Gallbladder */}
            <ellipse cx="88" cy="94" rx="2" ry="3.5" fill="#15803d" />
            {/* Pancreas nestled behind duodenum */}
            <path d="M78,96 Q86,95 91,98" stroke="#facc15" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Large Intestine (Ascending, Transverse, Descending colon & Cecum) */}
            <path
              d="M68,132 L68,104 C68,102 70,100 72,100 L88,100 C90,100 92,102 92,104 L92,134 L88,138 L88,146"
              stroke="#b45309"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Appendix */}
            <path d="M68,132 Q66,136 67,140" stroke="#d97706" strokeWidth="1.8" fill="none" />
            {/* Small Intestine jejunum and ileum loops */}
            <ellipse cx="80" cy="116" rx="9" ry="8" fill="#fb923c" stroke="#ea580c" strokeWidth="0.6" />
            <path d="M74,113 Q80,111 86,113 M73,117 Q80,119 87,117 M75,121 Q80,123 85,121" stroke="#fed7aa" strokeWidth="1.2" fill="none" />
          </g>
        )}

        {systemId === 'respiratory' && (
          <g>
            {/* Nasal cavity & Pharynx */}
            <circle cx="80" cy="28" r="2.5" fill="#fda4af" />
            {/* Larynx & Trachea with cartilaginous C-rings */}
            <rect x="78" y="42" width="4" height="6" rx="1" fill="#fdba74" stroke="#c2410c" strokeWidth="0.6" />
            <line x1="80" y1="48" x2="80" y2="68" stroke="#fdba74" strokeWidth="3.2" strokeDasharray="1.5,1" />
            {/* Carina bifurcation into Left and Right Mainstem Bronchi */}
            <path d="M80,68 L73,74 M80,68 L87,74" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" />
            {/* Left and Right Lungs with lobes */}
            <path
              d="M78,68 C71,68 65,74 65,88 C65,100 73,101 78,98 Z"
              fill="#f472b6"
              stroke="#db2777"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M82,68 C89,68 95,74 95,88 C95,100 87,101 82,98 Z"
              fill="#f472b6"
              stroke="#db2777"
              strokeWidth="0.8"
              opacity="0.9"
            />
            {/* Bronchial arborization branches */}
            <path d="M74,75 L70,82 M73,79 L75,85 M86,75 L90,82 M87,79 L85,85" stroke="#fce7f3" strokeWidth="1" fill="none" />
            {/* Muscular Diaphragm dome */}
            <path d="M63,102 Q80,95 97,102" stroke="#e11d48" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}

        {systemId === 'nervous' && (
          <g>
            {/* Cerebrum with cortical sulci and gyri */}
            <ellipse cx="80" cy="28" rx="10" ry="9" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <path d="M74,26 Q80,24 86,26 M73,29 Q80,31 87,29 M76,33 Q80,35 84,33" stroke="#eab308" strokeWidth="1" fill="none" />
            {/* Cerebellum & Brainstem */}
            <ellipse cx="80" cy="37" rx="5" ry="3" fill="#eab308" />
            {/* Spinal Cord running down canal */}
            <line x1="80" y1="40" x2="80" y2="134" stroke="#facc15" strokeWidth="2.8" strokeLinecap="round" />
            {/* Brachial Plexus into Upper Extremities */}
            <path
              d="M80,56 L54,102 L48,146 M80,56 L106,102 L112,146"
              stroke="#fef08a"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            {/* Lumbosacral Plexus & Sciatic Nerves into Lower Extremities */}
            <path
              d="M80,132 L70,188 L68,242 M80,132 L90,188 L92,242"
              stroke="#fef08a"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Peripheral nerve branchlets */}
            <path
              d="M54,98 L50,118 M106,98 L110,118 M70,182 L65,208 M90,182 L95,208"
              stroke="#fef08a"
              strokeWidth="1"
              strokeDasharray="2,2"
              fill="none"
            />
          </g>
        )}

        {systemId === 'urinary' && (
          <g>
            {/* Bilateral Kidneys (Bean shape) */}
            <path d="M71,94 C67,90 67,102 71,104 C73,105 74,101 73,98 C74,95 73,94 71,94 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" />
            <path d="M89,92 C93,88 93,100 89,102 C87,103 86,99 87,96 C86,93 87,92 89,92 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" />
            {/* Ureters peristaltic ducts */}
            <path d="M72,104 C73,116 77,126 78,136 M88,102 C87,116 83,126 82,136" stroke="#facc15" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* Urinary Bladder */}
            <ellipse cx="80" cy="140" rx="7" ry="6" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            {/* Urethra */}
            <line x1="80" y1="146" x2="80" y2="152" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {systemId === 'endocrine' && (
          <g>
            {/* Pituitary & Pineal Gland in brain */}
            <circle cx="80" cy="30" r="2.2" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.6" />
            {/* Thyroid Butterfly Gland across trachea */}
            <path d="M75,46 C77,44 80,47 80,49 C80,47 83,44 85,46 C87,49 85,53 82,52 L80,50 L78,52 C75,53 73,49 75,46 Z" fill="#c084fc" stroke="#9333ea" strokeWidth="0.8" />
            {/* Adrenal Glands atop kidneys */}
            <path d="M69,92 L73,90 L72,94 Z M87,90 L91,92 L88,94 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            {/* Pancreatic Islets */}
            <ellipse cx="82" cy="98" rx="6" ry="2" fill="#e9d5ff" stroke="#a855f7" strokeWidth="0.6" />
            {/* Gonadal hormone glands */}
            <circle cx="75" cy="144" r="2.2" fill="#c084fc" />
            <circle cx="85" cy="144" r="2.2" fill="#c084fc" />
          </g>
        )}

        {systemId === 'lymphatic' && (
          <g>
            {/* Spleen in LUQ */}
            <ellipse cx="91" cy="92" rx="5" ry="6" fill="#4ade80" stroke="#16a34a" strokeWidth="0.8" />
            {/* Thymus gland in mediastinum */}
            <path d="M78,64 L82,64 L81,72 L79,72 Z" fill="#86efac" stroke="#22c55e" strokeWidth="0.6" />
            {/* Thoracic duct */}
            <line x1="79" y1="62" x2="79" y2="120" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2,2" />
            {/* Cervical, Axillary, and Inguinal Lymph Node Clusters */}
            {[
              [74, 46], [86, 46], [64, 66], [96, 66], [62, 72], [98, 72],
              [73, 138], [87, 138], [75, 144], [85, 144]
            ].map(([cx, cy], idx) => (
              <circle key={idx} cx={cx} cy={cy} r="1.8" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
            ))}
          </g>
        )}

        {systemId === 'integumentary' && (
          <g>
            {/* Glowing skin dermal envelope */}
            <path
              d="M72,32 C72,21 88,21 88,32 C88,40 85,46 80,47 C75,46 72,40 72,32 Z"
              fill="#fed7aa"
              stroke="#ea580c"
              strokeWidth="1.2"
              opacity="0.75"
            />
            {/* Torso & Limbs glowing dermal barrier */}
            <ellipse cx="80" cy="100" rx="18" ry="42" fill="#ffedd5" stroke="#f97316" strokeWidth="1" opacity="0.6" />
            <ellipse cx="71" cy="195" rx="7" ry="46" fill="#ffedd5" stroke="#f97316" strokeWidth="1" opacity="0.6" />
            <ellipse cx="89" cy="195" rx="7" ry="46" fill="#ffedd5" stroke="#f97316" strokeWidth="1" opacity="0.6" />
          </g>
        )}

        {(systemId === 'female_reproductive' || systemId === 'male_reproductive') && (
          <g>
            {/* Pelvic reproductive anatomy */}
            <ellipse cx="80" cy="138" rx="8" ry="7" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
            <ellipse cx="70" cy="136" rx="3.5" ry="3" fill="#fb7185" />
            <ellipse cx="90" cy="136" rx="3.5" ry="3" fill="#fb7185" />
            <path d="M72,136 Q76,134 80,137 Q84,134 88,136" stroke="#fda4af" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {systemId === 'master_knolling' && (
          <g>
            {/* Central Muscular Core */}
            <path d="M74,65 L86,65 L84,145 L76,145 Z" fill="#be123c" />
            {/* Flanking deconstructed elements matching knolling diagram */}
            <circle cx="112" cy="40" r="8" fill="#f8fafc" stroke="#94a3b8" /> {/* Skull */}
            <circle cx="48" cy="40" r="8" fill="#fb7185" /> {/* Brain */}
            <line x1="45" y1="65" x2="45" y2="140" stroke="#f1f5f9" strokeWidth="2.5" /> {/* Spine */}
            <line x1="115" y1="65" x2="115" y2="140" stroke="#fef08a" strokeWidth="2" /> {/* Cord */}
            <ellipse cx="50" cy="180" rx="7" ry="9" fill="#78350f" /> {/* Liver */}
            <path d="M108,175 C104,170 114,170 112,185 Z" fill="#e11d48" /> {/* Heart */}
            <ellipse cx="110" cy="205" rx="6" ry="10" fill="#f472b6" /> {/* Lungs */}
            <ellipse cx="50" cy="205" rx="6" ry="6" fill="#fb923c" /> {/* Intestines */}
            <line x1="48" y1="145" x2="48" y2="175" stroke="#2563eb" strokeWidth="2" /> {/* Veins */}
            <line x1="112" y1="145" x2="112" y2="175" stroke="#dc2626" strokeWidth="2" /> {/* Arteries */}
          </g>
        )}
      </svg>
    </div>
  );
};
