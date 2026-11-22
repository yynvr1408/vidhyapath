// Comprehensive Vidyapath Product Release Notes & Changelog
// Real, authentic features implemented across Vidyapath releases

export type UpdateCategory =
  | 'New Features'
  | 'Improvements'
  | 'UI/UX Enhancements'
  | 'AI Tutor Updates'
  | 'Authentication and Security'
  | 'Bug Fixes';

export interface ProductUpdateItem {
  id: string;
  version: string;
  releaseDate: string; // ISO or readable date
  category: UpdateCategory;
  title: string;
  description: string;
  highlights?: string[];
  isUpcoming?: boolean;
}

export const PRODUCT_UPDATES: ProductUpdateItem[] = [
  // --- Version 1.2.0 (Current Production Release) ---
  {
    id: 'upd_120_lang22',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'UI/UX Enhancements',
    title: 'Native 22-Language Discovery & Navigation',
    description:
      'Universal language navigation supporting all 22 Eighth Schedule Indian languages rendered strictly in their native scripts (తెలుగు, हिन्दी, বাংলা, தமிழ், etc.) without brackets or English subtitle clutter. Complete awareness and exploration of the Vidyapath ecosystem for every regional learner.',
    highlights: [
      'Pure native script rendering with zero English bracket clutter',
      'Accessible from header, navigation sidebar, and profile picker',
      'Full keyboard navigation (Arrow keys, Enter, Escape) and direction-aware popovers',
    ],
  },
  {
    id: 'upd_120_profile_ui',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'UI/UX Enhancements',
    title: 'Streamlined Profile & Sibling Management UI',
    description:
      'Eliminated repetitive symbol clutter on the profile selector screen. Replaced nested plus badges with a clean, cohesive "Add Profile" card featuring clear typography, dedicated user avatars, and intuitive touch targets for shared-phone households.',
    highlights: [
      'Clean single-action "Add Student Profile" card',
      'Intuitive hierarchy for multi-sibling shared smartphones',
      'Zero redundant plus badges or doubled label prefixes',
    ],
  },
  {
    id: 'upd_120_classes_1_12',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'New Features',
    title: 'Expanded Academic Classes (Grade 1 through 12)',
    description:
      'Curriculum structure expanded across all educational stages: Primary (Classes 1–5), Middle School (Classes 6–8), Secondary Board Exam Prep (Classes 9–10 Free Tier under State SSC and CBSE), and Higher Secondary (Classes 11–12) with specialized streams: MPC, BiPC, MEC, CEC, and Humanities.',
    highlights: [
      '100% Free foundational tier for Classes 1 through 10',
      'Higher secondary stream selection (MPC, BiPC, MEC, CEC, Humanities)',
      'Pedagogical prompts in AI tutor adapting to grade-level cognitive readiness',
    ],
  },
  {
    id: 'upd_120_onboarding_5step',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'Authentication and Security',
    title: '5-Step Student Registration & Onboarding',
    description:
      'Structured onboarding flow with EmailJS OTP verification, academic grade & stream selection, zero-email student PIN recovery via safety questions, and a first-time orientation walkthrough introducing the Socratic AI tutor and offline study features.',
    highlights: [
      'Step 1: Personal info & parent phone contact',
      'Step 2: Academic grade (1–12), Board, and stream selection',
      'Step 3: Secure EmailJS 6-digit OTP verification',
      'Step 4: 4-digit PIN creation & zero-email safety question setup',
      'Step 5: Student roll-code generation & interactive classroom orientation',
    ],
  },
  {
    id: 'upd_120_desktop_keyboard',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'Bug Fixes',
    title: 'Physical Keyboard & Desktop Input Usability',
    description:
      'Comprehensive keyboard input support for desktop web and Chromebooks: number row and numeric keypad (Numpad 0–9) entry for PIN pads, Enter-to-submit form workflows, Escape-to-dismiss for all modals, and visible accessibility focus rings.',
    highlights: [
      'Number row (0-9) and numeric keypad (Numpad) PIN entry',
      'Enter to submit and Escape to dismiss across all dialogs',
      'Tab and Shift+Tab natural focus traversal',
    ],
  },
  {
    id: 'upd_120_clean_db',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'Bug Fixes',
    title: 'Purged Mock Placeholders & Hardened Neon PostgreSQL Persistence',
    description:
      'Removed all hardcoded mock accounts, dummy names, and fabricated stats from production dashboards. All portal views now display real database records with honest, helpful empty states.',
    highlights: [
      'Eliminated hardcoded placeholder accounts across parent, teacher, and student dashboards',
      'Clean, actionable empty states when no assignments or submissions exist',
      'Production-ready Super Administrator credentials and audit logging',
    ],
  },
  {
    id: 'upd_120_emailjs_routes',
    version: '1.2.0',
    releaseDate: 'Nov 22, 2026',
    category: 'Authentication and Security',
    title: 'Dedicated EmailJS Service Routing',
    description:
      'Configured dedicated EmailJS service credentials with automatic failover: service_92ab4cb for student registration verification and service_w1gbm99 for password resets and guardian academic alerts.',
    highlights: [
      'Separated verification and administrative delivery channels',
      'HTML-formatted responsive email templates with zero-PII security headers',
      'Automated fallback to development console simulator when offline',
    ],
  },

  // --- Version 1.1.0 ---
  {
    id: 'upd_110_socratic_voice',
    version: '1.1.0',
    releaseDate: 'Nov 21, 2026',
    category: 'AI Tutor Updates',
    title: 'Socratic AI Tutor with Live Voice & Photo Input',
    description:
      'Empathic, step-by-step Socratic teaching engine in Telugu, Hindi, and English. Students can speak doubts using on-device Web Speech API or photograph notebook math problems for instant conceptual breakdown.',
    highlights: [
      'Strict adherence to the 3 core teaching mediums: Telugu, Hindi, English',
      'Visual question solver with camera upload and image thumbnail preview',
      'Follow-up chips for simpler explanations, real-world examples, and step-by-step guidance',
    ],
  },
  {
    id: 'upd_110_guardian_telemetry',
    version: '1.1.0',
    releaseDate: 'Nov 21, 2026',
    category: 'New Features',
    title: 'Independent Learner & Guardian Voice Digest',
    description:
      'A dedicated guardian portal designed for parents with varying literacy levels. Provides audio progress digests in Telugu, Hindi, and English with everyday household practice suggestions (e.g. Venn diagrams with lentils).',
    highlights: [
      '1-minute regional spoken voice summaries via SpeechSynthesis',
      'Household analogies without academic jargon',
      'Secure PIN-protected access preventing accidental tampering by siblings',
    ],
  },
  {
    id: 'upd_110_deterministic_maths',
    version: '1.1.0',
    releaseDate: 'Nov 21, 2026',
    category: 'Improvements',
    title: 'Offline-First Deterministic Answer Checker',
    description:
      'Ultra-fast client-side mathematical expression validator that grades student calculations with zero network latency and maps specific distractors to remedial conceptual explanations.',
    highlights: [
      'Zero token cost and zero network delay for practice questions',
      'Distractor mistake taxonomy with tailored regional feedback',
      'Lantern glow mastery tracking per syllabus chapter',
    ],
  },

  // --- Version 1.0.0 ---
  {
    id: 'upd_100_launch',
    version: '1.0.0',
    releaseDate: 'Nov 20, 2026',
    category: 'New Features',
    title: 'Initial Release: The Last-Mile Multilingual Learning Engine',
    description:
      'Offline-first educational Progressive Web App for shared budget smartphones in rural and semi-urban India. Complete Class 10 AP State Board Mathematics launch pack.',
    highlights: [
      '100% offline functionality with IndexedDB persistence',
      'Responsive browser learning flow with offline practice and local progress storage',
      'Multi-sibling shared profile support on a single budget device',
    ],
  },

  // --- Upcoming Features in Pipeline (Clearly Labeled) ---
  {
    id: 'upd_upcoming_voice_models',
    version: 'Upcoming (v1.3.0)',
    releaseDate: 'Roadmap Q1 2027',
    category: 'AI Tutor Updates',
    title: 'Full Socratic Audio Voice Models for All 22 Languages',
    description:
      'Deep vernacular speech-to-speech AI tutoring models trained across all 22 scheduled Indian languages, extending the current Telugu, Hindi, and English Socratic depth to Marathi, Bengali, Tamil, Kannada, and beyond.',
    isUpcoming: true,
  },
  {
    id: 'upd_upcoming_peer_mesh',
    version: 'Upcoming (v1.3.0)',
    releaseDate: 'Roadmap Q1 2027',
    category: 'New Features',
    title: 'Device-to-Device Offline Bluetooth Curriculum Sync',
    description:
      'Peer-to-peer curriculum pack sharing over local Wi-Fi Direct and Bluetooth Low Energy, allowing students in zero-signal hamlets to receive syllabus updates from village community centers.',
    isUpcoming: true,
  },
];
