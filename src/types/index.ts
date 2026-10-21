export type UserRole = 'candidate' | 'employer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_name: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type JobStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  job_type: JobType;
  salary_range: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  employer?: Profile;
}

export type ApplicationStatus = 'submitted' | 'reviewed' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
  candidate?: Profile;
  job?: Job;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export type NotificationType = 'application' | 'message' | 'job_status' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export type BlogCategory = 'career-advice' | 'interview-tips' | 'industry-news' | 'company';
export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category: BlogCategory;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}
