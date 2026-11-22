// Comprehensive Academic Structure for Vidyapath: Classes 1 to 12
// Supporting Primary, Middle, Secondary, and Higher Secondary with Streams

export type AcademicStage = 'primary' | 'middle' | 'secondary' | 'higher_secondary';

export interface AcademicGrade {
  grade: number;
  label: string;
  stage: AcademicStage;
  stageLabel: {
    en: string;
    te: string;
    hi: string;
  };
  isFreeTier: boolean;
  hasStreams: boolean;
}

export interface StreamOption {
  id: string;
  code: string;
  name: string;
  description: string;
  subjects: string[];
}

export const ACADEMIC_GRADES: AcademicGrade[] = [
  // Primary Education (Classes 1–5): 100% Free
  { grade: 1, label: 'Class 1', stage: 'primary', stageLabel: { en: 'Primary', te: 'ప్రాథమిక', hi: 'प्राथमिक' }, isFreeTier: true, hasStreams: false },
  { grade: 2, label: 'Class 2', stage: 'primary', stageLabel: { en: 'Primary', te: 'ప్రాథమిక', hi: 'प्राथमिक' }, isFreeTier: true, hasStreams: false },
  { grade: 3, label: 'Class 3', stage: 'primary', stageLabel: { en: 'Primary', te: 'ప్రాథమిక', hi: 'प्राथमिक' }, isFreeTier: true, hasStreams: false },
  { grade: 4, label: 'Class 4', stage: 'primary', stageLabel: { en: 'Primary', te: 'ప్రాథమిక', hi: 'प्राथमिक' }, isFreeTier: true, hasStreams: false },
  { grade: 5, label: 'Class 5', stage: 'primary', stageLabel: { en: 'Primary', te: 'ప్రాథమిక', hi: 'प्राथमिक' }, isFreeTier: true, hasStreams: false },

  // Middle School (Classes 6–8): 100% Free
  { grade: 6, label: 'Class 6', stage: 'middle', stageLabel: { en: 'Middle School', te: 'ఉన్నత ప్రాథమిక', hi: 'माध्यमिक पूर्व' }, isFreeTier: true, hasStreams: false },
  { grade: 7, label: 'Class 7', stage: 'middle', stageLabel: { en: 'Middle School', te: 'ఉన్నత ప్రాథమిక', hi: 'माध्यमिक पूर्व' }, isFreeTier: true, hasStreams: false },
  { grade: 8, label: 'Class 8', stage: 'middle', stageLabel: { en: 'Middle School', te: 'ఉన్నత ప్రాథమిక', hi: 'माध्यमिक पूर्व' }, isFreeTier: true, hasStreams: false },

  // Secondary Education (Classes 9–10): 100% Free State SSC / CBSE Board Exam Prep
  { grade: 9, label: 'Class 9', stage: 'secondary', stageLabel: { en: 'Secondary', te: 'సెకండరీ', hi: 'माध्यमिक' }, isFreeTier: true, hasStreams: false },
  { grade: 10, label: 'Class 10', stage: 'secondary', stageLabel: { en: 'Class 10 (Board Exam)', te: '10వ తరగతి (బోర్డు)', hi: 'कक्षा 10 (बोर्ड परीक्षा)' }, isFreeTier: true, hasStreams: false },

  // Higher Secondary / Junior College (Classes 11–12): Dynamic Stream Catalogs
  { grade: 11, label: 'Class 11 (Intermediate 1st Yr)', stage: 'higher_secondary', stageLabel: { en: 'Higher Secondary', te: 'ఇంటర్ ప్రథమ', hi: 'उच्च माध्यमिक' }, isFreeTier: false, hasStreams: true },
  { grade: 12, label: 'Class 12 (Intermediate 2nd Yr)', stage: 'higher_secondary', stageLabel: { en: 'Higher Secondary', te: 'ఇంటర్ ద్వితీయ', hi: 'उच्च माध्यमिक' }, isFreeTier: false, hasStreams: true },
];

export const HIGHER_SECONDARY_STREAMS: StreamOption[] = [
  {
    id: 'mpc',
    code: 'MPC',
    name: 'MPC (Maths, Physics, Chemistry)',
    description: 'Engineering & Physical Sciences focus (IIT-JEE, EAMCET, B.Tech foundations)',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
  },
  {
    id: 'bipc',
    code: 'BiPC',
    name: 'BiPC (Biology, Physics, Chemistry)',
    description: 'Medical & Life Sciences focus (NEET, Nursing, Pharmacy foundations)',
    subjects: ['Botany & Zoology', 'Physics', 'Chemistry', 'English'],
  },
  {
    id: 'mec',
    code: 'MEC',
    name: 'MEC (Maths, Economics, Commerce)',
    description: 'Quantitative Business & Financial Management (CA, Actuarial, Data Analysis)',
    subjects: ['Mathematics', 'Economics', 'Commerce & Accountancy', 'English'],
  },
  {
    id: 'cec',
    code: 'CEC',
    name: 'CEC (Civics, Economics, Commerce)',
    description: 'Business Administration, Law & Banking (BBA, B.Com, UPSC foundations)',
    subjects: ['Civics & Political Science', 'Economics', 'Commerce & Accountancy', 'English'],
  },
  {
    id: 'humanities',
    code: 'Humanities',
    name: 'Humanities & Arts',
    description: 'Social Sciences, Public Policy, Civil Services, Literature & Journalism',
    subjects: ['History', 'Political Science', 'Economics', 'Sociology/Geography', 'English'],
  },
];

export const EDUCATIONAL_BOARDS = [
  { id: 'state_ssc', code: 'State SSC', label: 'State Board (SSC / State Syllabus)' },
  { id: 'cbse', code: 'CBSE', label: 'Central Board of Secondary Education (CBSE)' },
  { id: 'icse', code: 'ICSE', label: 'Council for the Indian School Certificate Examinations (ICSE)' },
];

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Kerala',
  'Gujarat',
  'Delhi (NCR)',
  'Rajasthan',
  'West Bengal',
  'Madhya Pradesh',
  'Bihar',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Goa',
  'Jammu & Kashmir',
  'Tripura',
  'Meghalaya',
  'Manipur',
  'Nagaland',
  'Mizoram',
  'Sikkim',
  'Arunachal Pradesh',
  'Puducherry',
  'Chandigarh',
  'Ladakh',
  'Andaman & Nicobar',
  'Dadra & Nagar Haveli',
  'Lakshadweep',
];
