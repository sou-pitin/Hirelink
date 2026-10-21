/**
 * AI job matcher: TF-IDF + cosine similarity, plus rule-based skill extraction.
 *
 * How it works (see the "How it works" box on the Matches page):
 *  1. Text is cleaned: lowercased, punctuation removed, stop words dropped, light stemming.
 *  2. Every job and the candidate's profile become a vector of TF-IDF weights.
 *     - TF  (term frequency): how often a word appears, damped with 1 + ln(count).
 *     - IDF (inverse document frequency): rare words weigh more than common ones.
 *     - Job titles, tags and requirements are weighted higher than the description.
 *  3. Cosine similarity between the candidate vector and a job vector gives a
 *     0..1 text-match score.
 *  4. Skills are extracted from the text with a skill dictionary. Skill coverage
 *     (matched skills / skills the job asks for) is blended with the text score.
 *  5. The result explains itself: shared keywords, matched skills, missing skills.
 *
 * No external API or model is used, so it runs in the browser and is fully explainable.
 */

export interface MatchJob {
  id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  tags?: string[] | null;
  category?: string | null;
}

export interface MatchProfile {
  /** free text: summary, bio, resume text, current title ... */
  text: string;
  /** skills the user listed explicitly */
  skills?: string[];
}

export interface MatchResult {
  jobId: string;
  /** final 0..100 score used for ranking */
  score: number;
  /** raw cosine similarity 0..1 */
  similarity: number;
  /** share of the job's skills the candidate has, 0..1 (null if the job lists none) */
  skillCoverage: number | null;
  sharedTerms: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

// ---------------------------------------------------------------- tuning constants
/** cosine similarity that counts as a "perfect" text match (resume vs job rarely exceeds ~0.4) */
export const SIM_FOR_FULL_SCORE = 0.4;
/** weight of text similarity vs skill coverage in the final score */
export const TEXT_WEIGHT = 0.6;
const FIELD_WEIGHT = { title: 3, tags: 3, requirements: 2, description: 1, category: 1 };

// ---------------------------------------------------------------- text processing
const STOP_WORDS = new Set(
  (
    'a about above after again all also am an and any are as at be because been before being below between both but by can ' +
    'could did do does doing down during each few for from further had has have having he her here hers him his how i if in ' +
    'into is it its just me more most my no nor not now of off on once only or other our out over own same she should so ' +
    'some such than that the their them then there these they this those through to too under until up us very was we were ' +
    'what when where which while who whom why will with would you your ' +
    // words that appear in almost every job post or resume and say nothing about fit
    'experience experienced year years work working works team teams strong ability able knowledge skill skills looking ' +
    'join role roles company candidate candidates position responsible responsibilities including include etc good great ' +
    'excellent proven understanding using use used well new help helping need needs seeking within across based related ' +
    'plus preferred required requirement requirements must best like love passionate environment opportunity'
  ).split(' ')
);

/** map symbols that matter in tech names before punctuation is stripped */
function normalizeSymbols(text: string): string {
  return text
    .toLowerCase()
    .replace(/c\+\+/g, ' cplusplus ')
    .replace(/c#/g, ' csharp ')
    .replace(/\.net\b/g, ' dotnet ')
    .replace(/node\.?js/g, ' nodejs ')
    .replace(/next\.?js/g, ' nextjs ')
    .replace(/vue\.?js/g, ' vuejs ')
    .replace(/react\.?js/g, ' react ')
    .replace(/ci\/cd/g, ' cicd ')
    .replace(/\bui\/ux\b/g, ' ui ux ')
    .replace(/\bml\b/g, ' machinelearning ')
    .replace(/\bmachine learning\b/g, ' machinelearning ')
    .replace(/\bdeep learning\b/g, ' deeplearning ')
    .replace(/\bnatural language processing\b/g, ' nlp ');
}

function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

interface Token {
  stem: string;
  word: string; // readable form for explanations
}

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const raw of normalizeSymbols(text).split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP_WORDS.has(raw) || /^\d+$/.test(raw)) continue;
    out.push({ stem: stem(raw), word: raw });
  }
  return out;
}

// ---------------------------------------------------------------- skill dictionary
// name -> aliases (lowercase). Extend this list to teach the matcher new skills.
const SKILL_DICTIONARY: Record<string, string[]> = {
  React: ['react', 'react.js', 'reactjs'],
  TypeScript: ['typescript'],
  JavaScript: ['javascript', 'ecmascript'],
  'Node.js': ['node', 'node.js', 'nodejs'],
  Express: ['express', 'express.js'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3', 'sass', 'scss'],
  Tailwind: ['tailwind', 'tailwindcss'],
  Vite: ['vite'],
  Webpack: ['webpack'],
  'Next.js': ['next.js', 'nextjs'],
  'Vue.js': ['vue', 'vue.js', 'vuejs'],
  Angular: ['angular'],
  Python: ['python'],
  Java: ['java'],
  'C#': ['c#', 'csharp'],
  'C++': ['c++'],
  Go: ['golang'],
  PHP: ['php'],
  Ruby: ['ruby', 'rails'],
  SQL: ['sql', 'mysql', 'postgres', 'postgresql', 'sqlite'],
  PostgreSQL: ['postgres', 'postgresql'],
  MongoDB: ['mongodb', 'mongo'],
  'REST APIs': ['restful', 'rest api', 'rest apis', 'api design'],
  GraphQL: ['graphql'],
  Docker: ['docker', 'containers', 'containerization'],
  Kubernetes: ['kubernetes', 'k8s'],
  AWS: ['aws', 'amazon web services'],
  GCP: ['gcp', 'google cloud'],
  Azure: ['azure'],
  Terraform: ['terraform'],
  'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'jenkins', 'github actions'],
  Git: ['git', 'github', 'gitlab'],
  Linux: ['linux', 'bash', 'shell scripting'],
  Monitoring: ['datadog', 'prometheus', 'grafana', 'monitoring'],
  'Machine Learning': ['machine learning', 'machinelearning', 'ml'],
  'Deep Learning': ['deep learning', 'deeplearning', 'neural networks'],
  PyTorch: ['pytorch'],
  TensorFlow: ['tensorflow', 'keras'],
  NLP: ['nlp', 'natural language processing'],
  'Computer Vision': ['computer vision', 'image recognition'],
  MLOps: ['mlops'],
  Pandas: ['pandas', 'numpy'],
  'Data Analysis': ['data analysis', 'data analytics', 'analytics', 'data analyst'],
  Tableau: ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  Looker: ['looker'],
  Excel: ['excel', 'spreadsheets'],
  Statistics: ['statistics', 'statistical'],
  Figma: ['figma', 'sketch', 'adobe xd'],
  'UX Design': ['ux', 'ux design', 'user experience'],
  'UI Design': ['ui', 'ui design', 'user interface'],
  Wireframing: ['wireframe', 'wireframes', 'wireframing'],
  Prototyping: ['prototype', 'prototypes', 'prototyping'],
  'Design Systems': ['design system', 'design systems'],
  'UX Research': ['ux research', 'user research', 'usability testing', 'user interviews', 'usability'],
  'Survey Design': ['survey', 'surveys'],
  SEO: ['seo', 'search engine optimization'],
  'Content Marketing': ['content marketing', 'content strategy', 'copywriting', 'blogging'],
  'Social Media': ['social media', 'instagram', 'tiktok', 'linkedin'],
  'Email Marketing': ['email marketing', 'newsletters', 'mailchimp'],
  'Google Analytics': ['google analytics', 'ga4'],
  'Marketing Automation': ['marketing automation', 'hubspot'],
  Agile: ['agile', 'scrum', 'kanban'],
  'Project Management': ['project management', 'jira', 'roadmap', 'roadmapping'],
  Communication: ['communication', 'presentation', 'presentations', 'stakeholder'],
  Leadership: ['leadership', 'mentoring', 'team lead'],
  Testing: ['testing', 'jest', 'cypress', 'unit tests', 'qa'],
  Accessibility: ['accessibility', 'wcag', 'a11y'],
  Security: ['security', 'cybersecurity', 'encryption'],
  Microservices: ['microservice', 'microservices'],
  Sales: ['sales', 'crm', 'salesforce'],
  'Customer Support': ['customer support', 'customer service', 'helpdesk'],
  Accounting: ['accounting', 'bookkeeping', 'quickbooks'],
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SKILL_PATTERNS: { name: string; re: RegExp }[] = Object.entries(SKILL_DICTIONARY).map(
  ([name, aliases]) => ({
    name,
    re: new RegExp(`(^|[^a-z0-9+#])(${aliases.map(escapeRegex).join('|')})($|[^a-z0-9+#])`, 'i'),
  })
);

/** Find dictionary skills mentioned in free text. */
export function extractSkills(text: string): string[] {
  const found: string[] = [];
  for (const { name, re } of SKILL_PATTERNS) {
    if (re.test(text)) found.push(name);
  }
  return found;
}

/** Map a user-typed skill ("reactjs", "Node") to its dictionary name, else keep it Title-cased. */
function canonicalSkill(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const hit = extractSkills(s)[0];
  return hit ?? s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

// ---------------------------------------------------------------- TF-IDF
type Vector = Map<string, number>;

function termCounts(tokens: Token[], weight = 1, into: Map<string, number> = new Map()) {
  for (const t of tokens) into.set(t.stem, (into.get(t.stem) ?? 0) + weight);
  return into;
}

function jobCounts(job: MatchJob): Map<string, number> {
  const counts = new Map<string, number>();
  termCounts(tokenize(job.title), FIELD_WEIGHT.title, counts);
  termCounts(tokenize((job.tags ?? []).join(' ')), FIELD_WEIGHT.tags, counts);
  termCounts(tokenize(job.requirements ?? ''), FIELD_WEIGHT.requirements, counts);
  termCounts(tokenize(job.description ?? ''), FIELD_WEIGHT.description, counts);
  termCounts(tokenize(job.category ?? ''), FIELD_WEIGHT.category, counts);
  return counts;
}

function profileCounts(profile: MatchProfile): Map<string, number> {
  const counts = new Map<string, number>();
  // explicitly listed skills count extra: the user chose to highlight them
  termCounts(tokenize((profile.skills ?? []).join(' ')), 3, counts);
  termCounts(tokenize(profile.text), 1, counts);
  return counts;
}

function toVector(counts: Map<string, number>, idf: Map<string, number>): Vector {
  const v: Vector = new Map();
  counts.forEach((c, term) => {
    const tf = 1 + Math.log(c);
    v.set(term, tf * (idf.get(term) ?? Math.log(2) + 1));
  });
  return v;
}

function norm(v: Vector): number {
  let s = 0;
  v.forEach((x) => (s += x * x));
  return Math.sqrt(s);
}

/** cosine similarity of two sparse vectors, plus each shared term's contribution to the dot product */
function cosine(a: Vector, b: Vector): { sim: number; contributions: [string, number][] } {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return { sim: 0, contributions: [] };
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  const contributions: [string, number][] = [];
  small.forEach((x, term) => {
    const y = large.get(term);
    if (y) {
      dot += x * y;
      contributions.push([term, (x * y) / (na * nb)]);
    }
  });
  return { sim: dot / (na * nb), contributions };
}

// ---------------------------------------------------------------- public API
export function jobSkills(job: MatchJob): string[] {
  const text = [job.title, job.requirements, job.description].filter(Boolean).join(' . ');
  return uniq([...(job.tags ?? []).map(canonicalSkill).filter(Boolean), ...extractSkills(text)]);
}

/** Having a specific skill implies a more general one (knowing PyTorch implies machine learning). */
const SKILL_IMPLIES: Record<string, string[]> = {
  PyTorch: ['Machine Learning', 'Deep Learning', 'Python'],
  TensorFlow: ['Machine Learning', 'Deep Learning', 'Python'],
  'Deep Learning': ['Machine Learning'],
  NLP: ['Machine Learning'],
  'Computer Vision': ['Machine Learning'],
  MLOps: ['Machine Learning'],
  Pandas: ['Python', 'Data Analysis'],
  TypeScript: ['JavaScript'],
  React: ['JavaScript'],
  'Next.js': ['React', 'JavaScript'],
  'Vue.js': ['JavaScript'],
  Angular: ['JavaScript', 'TypeScript'],
  'Node.js': ['JavaScript'],
  Express: ['Node.js', 'JavaScript'],
  PostgreSQL: ['SQL'],
  Tableau: ['Data Analysis'],
  'Power BI': ['Data Analysis'],
  Looker: ['Data Analysis'],
  Kubernetes: ['Docker'],
};

export function candidateSkills(profile: MatchProfile): string[] {
  const direct = uniq([...(profile.skills ?? []).map(canonicalSkill).filter(Boolean), ...extractSkills(profile.text)]);
  return uniq([...direct, ...direct.flatMap((s) => SKILL_IMPLIES[s] ?? [])]);
}

/** Rank jobs for one candidate. Returns results sorted best-first. */
export function matchJobs(profile: MatchProfile, jobs: MatchJob[]): MatchResult[] {
  if (jobs.length === 0) return [];

  const jobCountList = jobs.map(jobCounts);
  const userCounts = profileCounts(profile);

  // document frequency over all jobs + the candidate profile
  const df = new Map<string, number>();
  [...jobCountList, userCounts].forEach((counts) => counts.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const N = jobCountList.length + 1;
  const idf = new Map<string, number>();
  df.forEach((d, t) => idf.set(t, Math.log((N + 1) / (d + 1)) + 1));

  const userVec = toVector(userCounts, idf);
  const userSkills = candidateSkills(profile);
  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));

  // readable word for each stem (for the "shared keywords" explanation)
  const wordFor = new Map<string, string>();
  const remember = (text: string) => tokenize(text).forEach((t) => !wordFor.has(t.stem) && wordFor.set(t.stem, t.word));
  jobs.forEach((j) => remember([j.title, ...(j.tags ?? []), j.requirements ?? '', j.description ?? ''].join(' ')));

  const results = jobs.map((job, i): MatchResult => {
    const { sim, contributions } = cosine(userVec, toVector(jobCountList[i], idf));

    const required = jobSkills(job);
    const matched = required.filter((s) => userSkillSet.has(s.toLowerCase()));
    const missing = required.filter((s) => !userSkillSet.has(s.toLowerCase()));
    const coverage = required.length ? matched.length / required.length : null;

    const textScore = Math.min(1, sim / SIM_FOR_FULL_SCORE);
    const blended = coverage === null ? textScore : TEXT_WEIGHT * textScore + (1 - TEXT_WEIGHT) * coverage;

    const sharedTerms = contributions
      .sort((a, b) => b[1] - a[1])
      .map(([stemmed]) => wordFor.get(stemmed) ?? stemmed)
      .slice(0, 6);

    return {
      jobId: job.id,
      score: Math.round(blended * 100),
      similarity: sim,
      skillCoverage: coverage,
      sharedTerms,
      matchedSkills: matched,
      missingSkills: missing,
    };
  });

  return results.sort((a, b) => b.score - a.score || b.similarity - a.similarity);
}