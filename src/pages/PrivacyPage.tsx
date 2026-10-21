import { Card } from '@/components/ui/Card';

export function PrivacyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'Account information: name, email address, password (encrypted), and user type (job seeker or employer).',
        'Profile information: professional headline, bio, location, phone number, skills, education, and work experience.',
        'Application data: cover letters, resumes, and application status information.',
        'Usage data: pages visited, searches performed, and interactions with the platform.',
        'Cookies and similar technologies to maintain sessions and improve user experience.',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To provide and maintain the HireLink service.',
        'To match job seekers with relevant job opportunities.',
        'To allow employers to review applications and communicate with candidates.',
        'To send notifications about application statuses, new job alerts, and platform updates.',
        'To analyze usage patterns and improve our services.',
        'To detect and prevent fraud, abuse, and security incidents.',
      ],
    },
    {
      title: 'Information Sharing',
      content: [
        'We do not sell your personal information to third parties.',
        'Job seeker profile information is visible to employers when you apply to their job postings.',
        'Employer company profiles and job listings are publicly visible on the platform.',
        'We may share information with service providers who help us operate the platform (e.g., hosting, analytics), under strict confidentiality agreements.',
        'We may disclose information when required by law or to protect our legal rights.',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'Passwords are securely hashed using industry-standard algorithms.',
        'All data is transmitted over encrypted connections (HTTPS/TLS).',
        'Access to personal data is restricted to authorized personnel only.',
        'We conduct regular security reviews and vulnerability assessments.',
        'Despite our efforts, no method of transmission over the internet is 100% secure.',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'Access: You can view your personal data at any time from your dashboard.',
        'Correction: You can update your profile information at any time.',
        'Deletion: You can delete your account, which permanently removes your data.',
        'Opt-out: You can disable job alerts and notifications from your settings.',
        'Data export: You can request a copy of your data by contacting us.',
      ],
    },
    {
      title: 'Data Retention',
      content: [
        'We retain your data for as long as your account is active.',
        'When you delete your account, we remove your personal data within 30 days.',
        'Application data may be retained by employers for their records, subject to their own privacy policies.',
        'We may retain certain data longer if required by law or for legitimate business purposes.',
      ],
    },
    {
      title: 'Cookies',
      content: [
        'We use essential cookies to maintain your login session.',
        'We use analytics cookies to understand how the platform is used.',
        'You can control cookies through your browser settings.',
        'Disabling cookies may affect some functionality of the platform.',
      ],
    },
    {
      title: 'Changes to This Policy',
      content: [
        'We may update this Privacy Policy from time to time.',
        'We will notify you of significant changes via email or platform notification.',
        'The "last updated" date at the bottom reflects the most recent revision.',
        'Continued use of HireLink after changes constitutes acceptance of the updated policy.',
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950 py-16">
        <div className="container-app text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-primary-100">
            Your privacy matters to us
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container-app max-w-3xl">
          <Card className="p-6 md:p-8 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This Privacy Policy describes how HireLink collects, uses, and protects
              your personal information when you use our platform. By using HireLink,
              you agree to the practices described in this policy.
            </p>
          </Card>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <Card key={i} className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {i + 1}. {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.content.map((item, j) => (
                    <li
                      key={j}
                      className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-primary-500 mt-1.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>
    </div>
  );
}
