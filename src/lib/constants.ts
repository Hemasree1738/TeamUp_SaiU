// Configurable campus constants

export const SCHOOL_OPTIONS = [
  'School of Computing & Data Science',
  'School of Business',
  'School of Engineering & Applied Sciences',
  'School of Arts & Humanities',
  'School of Law',
  'Other',
] as const;

export const YEAR_OF_STUDY_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate / Masters',
  'PhD / Doctorate',
] as const;

export const AVAILABILITY_OPTIONS = [
  'Flexible (5-10 hrs/week)',
  'Moderate (10-20 hrs/week)',
  'Intensive (20+ hrs/week)',
  'Weekends Only',
] as const;

export const GENDER_OPTIONS = [
  'Prefer not to say',
  'Female',
  'Male',
  'Non-binary',
  'Self-describe',
] as const;

export const PROJECT_TYPE_OPTIONS = [
  { value: 'hackathon', label: 'Hackathon', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'research', label: 'Academic Research', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'competition', label: 'Competition', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'personal_project', label: 'Personal Project', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
] as const;

export const COMMON_PROJECT_INTERESTS = [
  'AI / Machine Learning',
  'Web3 & Blockchain',
  'Mobile Apps',
  'FinTech',
  'HealthTech & BioInformatics',
  'EdTech',
  'Sustainability & CleanTech',
  'Developer Tools',
  'Game Development',
  'Cybersecurity',
  'IoT & Robotics',
] as const;

// Transparent rule-based professional title suggester
export function suggestTitleFromSkills(skillNames: string[]): string {
  const lower = skillNames.map((s) => s.toLowerCase());

  const hasFrontend = lower.some((s) => ['react', 'html', 'css', 'vue', 'angular', 'next.js', 'tailwind css'].includes(s));
  const hasBackend = lower.some((s) => ['node.js', 'express', 'django', 'fastapi', 'sql', 'postgresql', 'mongodb', 'c#', 'java', 'go', 'rust'].includes(s));
  const hasData = lower.some((s) => ['python', 'machine learning', 'deep learning', 'data science', 'pytorch', 'tensorflow', 'nlp', 'computer vision'].includes(s));
  const hasDevOps = lower.some((s) => ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops', 'ci/cd', 'cloud computing'].includes(s));
  const hasDesign = lower.some((s) => ['ui/ux design', 'figma', 'design'].includes(s));

  if (hasFrontend && hasBackend) return 'Full-Stack Developer';
  if (hasData) return 'Machine Learning Enthusiast';
  if (hasFrontend) return 'Frontend Developer';
  if (hasBackend) return 'Backend Developer';
  if (hasDesign) return 'UI/UX Designer';
  if (hasDevOps) return 'Cloud/DevOps Enthusiast';
  
  return 'Aspiring Software Engineer';
}
