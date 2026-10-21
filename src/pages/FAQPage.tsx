import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is HireLink?',
          a: 'HireLink is a job application platform that connects job seekers with employers. You can search for jobs, create a professional profile, apply with one click, and manage your applications all in one place.',
        },
        {
          q: 'Is HireLink free to use?',
          a: 'Yes, HireLink is completely free for job seekers. You can create an account, search for jobs, and apply at no cost. Employers have both free and premium plans available.',
        },
        {
          q: 'Do I need to create an account to browse jobs?',
          a: 'You can browse job listings without an account, but you\'ll need to sign up to apply for jobs, save listings, or receive job alerts.',
        },
      ],
    },
    {
      category: 'For Job Seekers',
      questions: [
        {
          q: 'How do I apply for a job?',
          a: 'Once you\'ve created an account and completed your profile, simply click the "Apply" button on any job listing. You can include a cover letter and your resume will be automatically attached.',
        },
        {
          q: 'Can I save jobs to apply later?',
          a: 'Yes! Click the bookmark icon on any job listing to save it. You can view all your saved jobs from your dashboard at any time.',
        },
        {
          q: 'How will I know if an employer views my application?',
          a: 'You\'ll receive a notification in your HireLink inbox whenever an employer views your application, shortlists you, or sends you a message.',
        },
        {
          q: 'Can I withdraw an application?',
          a: 'Yes, you can withdraw your application at any time from your dashboard. The employer will be notified that you\'ve withdrawn.',
        },
      ],
    },
    {
      category: 'For Employers',
      questions: [
        {
          q: 'How do I post a job?',
          a: 'Create an employer account, set up your company profile, then click "Post a Job" from your employer dashboard. Fill in the job details and publish — it\'s that simple.',
        },
        {
          q: 'Can I manage multiple job postings?',
          a: 'Yes, your employer dashboard shows all your active, draft, and closed job postings. You can edit, duplicate, or close listings at any time.',
        },
        {
          q: 'How do I review applications?',
          a: 'All applications for your jobs appear in your employer dashboard. You can review cover letters, profiles, update application statuses, and message candidates directly.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot password?" on the login page and enter your email. We\'ll send you a link to reset your password.',
        },
        {
          q: 'Is my information secure?',
          a: 'We take security seriously. Your password is hashed and encrypted, and we never share your personal information with third parties without your consent. See our Privacy Policy for details.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can delete your account from your dashboard settings. This will permanently remove your profile and all associated data.',
        },
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950 py-16">
        <div className="container-app text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-primary-100 max-w-xl mx-auto">
            Everything you need to know about using HireLink
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-16">
        <div className="container-app max-w-3xl">
          {faqs.map((section) => (
            <div key={section.category} className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.questions.map((faq, i) => {
                  const globalIndex = faqs
                    .flatMap((s) => s.questions)
                    .indexOf(faq);
                  const isOpen = openIndex === globalIndex;
                  return (
                    <Card key={i} className="overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="flex w-full items-center justify-between p-5 text-left"
                      >
                        <span className="font-medium text-gray-900 dark:text-white pr-4">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ${
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
