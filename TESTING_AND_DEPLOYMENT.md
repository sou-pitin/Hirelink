# HireLink — Testing Checklist & Deployment Guide

## Final Testing Checklist

### 1. Authentication
- [ ] Sign up as a candidate — verify account is created and you land on the dashboard
- [ ] Sign up as an employer — verify company name field appears and is saved
- [ ] Sign in with valid credentials — verify redirect to dashboard
- [ ] Sign in with invalid credentials — verify error message shows
- [ ] Sign out — verify redirect to landing page
- [ ] Password validation: reject passwords under 8 chars, without uppercase, lowercase, or a number
- [ ] Email validation: reject invalid email formats
- [ ] Protected routes redirect to sign-in when not logged in
- [ ] Role-restricted pages (employer/admin) block unauthorized roles

### 2. Job Board (Public)
- [ ] Browse jobs page loads with approved jobs
- [ ] Search by title/company/keyword works
- [ ] Filter by job type works
- [ ] Filter by location works
- [ ] Job detail page shows full description, company, type, salary
- [ ] Non-logged-in users see "Sign in to apply" prompt

### 3. Candidate Features
- [ ] Apply for a job with a cover letter — verify success message
- [ ] Apply for the same job twice — verify "already applied" state
- [ ] View applications page — verify list of applied jobs with statuses
- [ ] Application status updates (submitted/reviewed/accepted/rejected) display correctly
- [ ] Edit profile — verify changes save and persist across reloads

### 4. Employer Features
- [ ] Post a new job — verify it goes to "pending" status
- [ ] View "My Job Postings" — verify all posted jobs appear
- [ ] Edit a job — verify changes save
- [ ] Delete a job — verify it's removed from the list
- [ ] View applicants on a job — verify list of candidates with cover letters
- [ ] Update applicant status — verify status changes and candidate gets notified
- [ ] Cannot access /admin routes (access restricted)

### 5. Admin Dashboard
- [ ] Overview tab shows correct stats (user count, job count, applications, blog posts)
- [ ] User distribution chart renders with correct proportions
- [ ] Job status chart renders with correct proportions
- [ ] Recent users section shows latest signups
- [ ] Pending job approvals appear in overview with approve/reject buttons
- [ ] Users tab — verify all users listed with roles
- [ ] Change a user's role — verify it updates
- [ ] Jobs tab — approve a pending job — verify it becomes visible on job board
- [ ] Jobs tab — reject a pending job — verify employer gets notification
- [ ] Jobs tab — remove a job — verify it's marked as removed
- [ ] Blog tab — verify list of blog posts with edit/delete buttons

### 6. Messaging
- [ ] Compose a new message to another user — verify it sends
- [ ] Inbox shows received messages
- [ ] Sent tab shows sent messages
- [ ] Click a message to read it — verify it marks as read
- [ ] Reply to a received message — verify subject is pre-filled with "Re:"
- [ ] Receiver gets a notification when a message is sent
- [ ] Cannot message yourself

### 7. Notification System
- [ ] Notification bell shows unread count badge
- [ ] Notifications dropdown lists recent notifications
- [ ] Click a notification — verify it marks as read and navigates to link
- [ ] "Mark all read" button clears all unread badges
- [ ] Delete a notification — verify it's removed
- [ ] Real-time: new notifications appear without page refresh

### 8. Blog / Career Advice
- [ ] Blog page lists published posts
- [ ] Category filter works (Career Advice, Interview Tips, Industry News, Company)
- [ ] Click a blog post — verify full content displays
- [ ] Admin can create a new blog post — save as draft
- [ ] Admin can publish a blog post — verify it appears on public blog
- [ ] Admin can edit an existing blog post
- [ ] Admin can delete a blog post
- [ ] Slug auto-generates from title
- [ ] Draft posts don't appear on public blog

### 9. Security
- [ ] Row Level Security: candidates cannot see other candidates' applications
- [ ] Employers can only see applications for their own jobs
- [ ] Employers cannot change job status (only admins can approve/reject)
- [ ] Users cannot edit other users' profiles
- [ ] Users can only delete their own messages and notifications
- [ ] Only admins can create/edit/delete blog posts
- [ ] Input validation: max length limits enforced on all text fields
- [ ] Rate limiting: rapid form submissions are blocked
- [ ] Null bytes are stripped from all text inputs (sanitizeText)
- [ ] Role-based route protection prevents unauthorized page access

### 10. Responsive Design
- [ ] Mobile layout: hamburger menu works
- [ ] Mobile layout: navigation collapses correctly
- [ ] Tablet layout: grids adjust to 2 columns
- [ ] Desktop layout: full 3-4 column layouts display correctly
- [ ] All text is readable with sufficient contrast on all backgrounds

## Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase project (already provisioned in this environment)

### Step 1: Environment Variables
The following are pre-configured in `.env`:
- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon key

### Step 2: Database Migration
The core schema migration has already been applied via the Supabase MCP tool. All tables (profiles, jobs, applications, messages, notifications, blog_posts) are created with RLS policies and indexes.

### Step 3: Edge Function Deployment
The `send-email-notification` edge function has been deployed. It handles:
- Creating in-site notifications
- Logging email notifications (ready for integration with an email service like Resend/SendGrid)

To trigger it from the frontend:
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-notification`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'target-user-id',
    type: 'application',
    title: 'Notification title',
    body: 'Notification body',
    link: '/dashboard',
  }),
});
```

### Step 4: Build and Deploy
```bash
npm install      # Install dependencies
npm run build    # Build for production (outputs to /dist)
```

Deploy the `dist/` folder to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

### Step 5: Create an Admin User
1. Sign up for an account normally
2. Use the Supabase dashboard SQL editor to promote your account:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Sign out and sign back in — you'll now see the Admin tab

## Architecture Summary

### Frontend Stack
- **React 18** with TypeScript
- **Vite** as the build tool
- **Tailwind CSS** for styling with a custom color system
- **React Router v7** for client-side routing
- **Lucide React** for icons

### Backend Stack
- **Supabase** for database, auth, and edge functions
- **PostgreSQL** with Row Level Security on every table
- **Supabase Auth** for email/password authentication
- **Edge Functions** (Deno) for server-side notification processing

### How All Parts Connect

**Part 1 (Foundation):**
- User authentication with three roles: candidate, employer, admin
- Profile system that extends Supabase Auth with role-based metadata
- Job board with search, filter, and detail views
- Job posting workflow: employer creates → admin approves → visible on board

**Part 2 (Employer & Candidate):**
- Employer dashboard: post jobs, manage listings, view applicants
- Candidate dashboard: browse jobs, apply with cover letters, track applications
- Application status workflow: submitted → reviewed → accepted/rejected

**Part 3 (Communication):**
- In-site messaging system between any two users
- Real-time notifications via Supabase channels
- Notification types: application, message, job_status, system

**Part 4 (Admin, Blog, Security):**
- Admin dashboard with site statistics, user management, and job approval
- Visual charts for user distribution and job status breakdown
- Blog system with admin editor, categories, drafts, and publishing
- Edge function for email notification processing
- Input validation (email, password, max length, sanitization)
- Client-side rate limiting (5 sign-in attempts/min, 3 job posts/min, 10 messages/min)
- Role-based access control enforced both client-side (route guards) and server-side (RLS policies)

### Database Schema Overview
```
auth.users (Supabase managed)
    ↓ (1:1 trigger)
profiles (id, email, full_name, role, company_name, bio, location, phone)
    ↓ (1:many)
jobs (employer_id, title, description, company, location, job_type, salary_range, status)
    ↓ (1:many)
applications (job_id, candidate_id, cover_letter, status)

messages (sender_id, receiver_id, subject, body, read)
notifications (user_id, type, title, body, link, read)
blog_posts (author_id, title, slug, excerpt, body, category, status, published_at)
```

### Security Layers
1. **Row Level Security (RLS):** Every table has 4 CRUD policies scoped by role and ownership
2. **Role-based route guards:** Client-side ProtectedRoute component checks role before rendering
3. **Input validation:** Email format, password strength, required fields, max lengths
4. **Text sanitization:** Null bytes stripped, whitespace trimmed on all text inputs
5. **Rate limiting:** Client-side per-action limits prevent rapid-fire form submissions
6. **Server-side validation:** Edge function validates all notification inputs before processing
