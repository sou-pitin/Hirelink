/**
 * Evaluates the matcher against hand-labelled candidates (for the report).
 * Run:  npx tsx scripts/evaluate-matcher.ts
 *
 * Each candidate is written in natural language (not copied from the job text).
 * `correct` lists the job titles a human would accept as a good match.
 */
import { readFileSync } from 'node:fs';
import { matchJobs, type MatchJob } from '../src/lib/matcher';

const jobs: MatchJob[] = JSON.parse(readFileSync(new URL('./seed-jobs.json', import.meta.url), 'utf8'));
const title = (id: string) => jobs.find((j) => j.id === id)!.title;

interface Case { name: string; text: string; skills?: string[]; correct: string[] }

const cases: Case[] = [
  { name: 'Front-end developer', correct: ['Senior Frontend Developer'],
    text: 'Six years building web interfaces. I write components in React and TypeScript, style with Tailwind and care about accessibility and fast page loads.' },
  { name: 'Back-end developer', correct: ['Backend Engineer'],
    text: 'I design REST services in Node and Express backed by PostgreSQL, ship them in Docker containers and care about scaling APIs.' },
  { name: 'Data analyst', correct: ['Data Analyst'],
    text: 'I query large datasets with SQL, clean them in Python with pandas and publish dashboards in Tableau for business stakeholders.' },
  { name: 'ML engineer', correct: ['ML Engineer'],
    text: 'Master\'s in computer science. I train deep learning models in PyTorch for language and image tasks and put them into production.' },
  { name: 'Product designer', correct: ['Product Designer'],
    text: 'I turn ideas into wireframes and clickable prototypes in Figma and maintain a shared design system for a B2B product.' },
  { name: 'DevOps engineer', correct: ['DevOps Engineer'],
    text: 'I automate cloud infrastructure on AWS with Terraform, run Kubernetes clusters, build CI/CD pipelines and set up Prometheus alerts.' },
  { name: 'UX researcher', correct: ['UX Researcher'],
    text: 'I plan usability tests, run user interviews and surveys, and present what I learn to product teams so they can improve the experience.' },
  { name: 'Marketer', correct: ['Marketing Manager'],
    text: 'I grow brands through SEO, content marketing and social media campaigns, and report on results with analytics tools.' },
  { name: 'Full-stack developer (ambiguous)', correct: ['Senior Frontend Developer', 'Backend Engineer'],
    text: 'Full-stack: React and TypeScript on the front end, Node.js and PostgreSQL on the back end.' },
  { name: 'Skills-only profile', correct: ['Data Analyst'], text: '', skills: ['SQL', 'Python', 'Tableau'] },
  { name: 'Career changer (hard)', correct: ['Marketing Manager'],
    text: 'Former journalist who wrote articles and ran the newsletter and social accounts for a magazine. Interested in the business side of media.' },
  { name: 'Vague profile (expected failure)', correct: [],
    text: 'I like computers and working with people. Hard working and a fast learner.' },
];

let top1 = 0, top3 = 0, rr = 0, scored = 0;
console.log('Candidate'.padEnd(36), 'Top match'.padEnd(28), 'Score', ' Rank of correct');
for (const c of cases) {
  const ranked = matchJobs({ text: c.text, skills: c.skills }, jobs);
  const titles = ranked.map((r) => title(r.jobId));
  const rank = c.correct.length ? Math.min(...c.correct.map((t) => titles.indexOf(t) + 1)) : 0;
  if (c.correct.length) {
    scored++; if (rank === 1) top1++; if (rank <= 3) top3++; rr += 1 / rank;
  }
  console.log(c.name.padEnd(36), titles[0].padEnd(28), String(ranked[0].score).padStart(3), '  ', c.correct.length ? `#${rank}` : 'n/a (no correct answer)');
}
console.log(`\nLabelled cases: ${scored}`);
console.log(`Top-1 accuracy : ${top1}/${scored} = ${((top1 / scored) * 100).toFixed(0)}%`);
console.log(`Top-3 accuracy : ${top3}/${scored} = ${((top3 / scored) * 100).toFixed(0)}%`);
console.log(`Mean reciprocal rank: ${(rr / scored).toFixed(2)}`);
console.log(`Random guess would be top-1 ≈ ${(100 / jobs.length).toFixed(0)}%, top-3 ≈ ${((3 / jobs.length) * 100).toFixed(0)}%`);