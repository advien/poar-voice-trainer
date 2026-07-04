/**
 * Concept seeds per POAR area.
 *
 * These are TERM NAMES / topics only — factual domain terminology, not
 * copyrightable text. They are grounded in standard prosthetics, orthotics,
 * and assistive-robotics vocabulary as catalogued by open professional
 * glossaries (AAOP, ISPO, AOPA). The generation script turns each concept
 * into ORIGINAL practice prompts; no source text is copied.
 *
 * To grow the bank, just add concepts here and re-run the generator — it
 * skips prompts that already exist.
 */
import type { AreaId } from "../src/lib/modes";

export const CONCEPTS: Record<AreaId, string[]> = {
  prosthetics: [
    "transtibial (below-knee) prosthesis",
    "transfemoral (above-knee) prosthesis",
    "myoelectric prosthesis",
    "body-powered prosthesis",
    "prosthetic socket fit",
    "prosthetic liner and suspension system",
    "prosthetic foot types (SACH vs dynamic-response)",
    "microprocessor-controlled knee",
    "residual limb care and skin health",
    "prosthetic gait training",
    "osseointegration",
    "prosthetic alignment",
    // Expanded from open glossaries (Össur, PM&R KnowledgeNow, AAOP).
    "patellar-tendon-bearing (PTB) socket",
    "total-surface-bearing (TSB) socket",
    "ischial-containment socket",
    "quadrilateral socket",
    "suction suspension",
    "pin-lock (shuttle lock) suspension",
    "elevated vacuum suspension",
    "endoskeletal pylon and frame",
    "transradial (below-elbow) upper-limb prosthesis",
    "partial-hand prosthesis",
    "hip-disarticulation prosthesis",
    "energy-storing carbon-fiber foot",
    "hydraulic versus pneumatic prosthetic knee",
    "multi-articulating myoelectric hand",
    "prosthetic candidacy and prescription assessment",
    "phantom limb pain management",
  ],
  orthotics: [
    "ankle-foot orthosis (AFO)",
    "knee-ankle-foot orthosis (KAFO)",
    "spinal orthosis / scoliosis brace",
    "custom foot orthosis (insole)",
    "wrist-hand orthosis",
    "cervical collar",
    "dynamic versus static orthosis",
    "thermoplastic orthosis fabrication",
    "pressure management and skin integrity",
    "contracture management",
    "drop-foot management",
    "orthotic alignment and tuning",
    // Expanded from open glossaries (PM&R KnowledgeNow, ABC, Wikipedia).
    "hip-knee-ankle-foot orthosis (HKAFO)",
    "thoraco-lumbo-sacral orthosis (TLSO)",
    "posterior-leaf-spring AFO (PLS-AFO)",
    "ground-reaction AFO",
    "cervical-thoracic orthosis (CTO)",
    "lumbosacral orthosis (LSO)",
    "shoulder-elbow-wrist-hand orthosis (SEWHO)",
    "elbow orthosis",
    "functional (unloader) knee orthosis",
    "diabetic foot offloading orthosis",
    "night stretching splint",
    "carbon-fiber AFO",
    "pediatric orthosis for cerebral palsy",
    "serial casting",
  ],
  robotics: [
    "powered lower-limb exoskeleton",
    "bionic (robotic) prosthesis",
    "EMG / myoelectric control",
    "sensors and actuators in assistive devices",
    "robotic gait-rehabilitation trainer",
    "assistive robotic arm for daily living",
    "brain-computer interface control",
    "powered (active) orthosis",
    "fall-safety and control systems",
    "human-robot interaction in rehab",
    "sensory feedback and proprioception",
    "outcome measures for rehabilitation robotics",
    // Expanded from open literature (NCBI/PMC, J. NeuroEngineering Rehab).
    "soft versus rigid exoskeleton design",
    "surface-EMG signal processing",
    "machine-learning EMG control (CNN/LSTM)",
    "upper-limb rehabilitation exoskeleton",
    "stroke gait-rehabilitation robotics",
    "spinal-cord-injury exoskeleton ambulation",
    "targeted muscle reinnervation (TMR) control",
    "pattern-recognition myoelectric control",
    "proportional EMG control",
    "robotic hand grasp control",
    "assist-as-needed shared control",
    "tendon-driven soft actuators",
    "inertial measurement unit (IMU) sensing",
  ],
};
