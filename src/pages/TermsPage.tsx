import { Card } from '@/components/ui/Card';

export function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content:
        'By creating an account or using HireLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. These terms constitute a legally binding agreement between you and HireLink.',
    },
    {
      title: 'Eligibility',
      content:
        'You must be at least 18 years old to use HireLink. By registering, you represent that you meet this age requirement and have the legal capacity to enter into this agreement. Employers must have the authority to act on behalf of their company.',
    },
    {
      title: 'User Accounts',
      content:
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information during registration and keep your profile information up to date. You may not share your account with others or create multiple accounts.',
    },
    {
      title: 'Job Seeker Guidelines',
      content:
        'Job seekers must provide truthful information in their profiles and applications. You may not misrepresent your qualifications, experience, or identity. You are responsible for the accuracy of your resume and cover letter content. You may not apply to jobs using automated scripts or bots.',
    },
    {
      title: 'Employer Guidelines',
      content:
        'Employers must provide accurate job descriptions and company information. You may not post discriminatory, misleading, or fraudulent job listings. You must comply with all applicable labor laws and hiring regulations. HireLink reserves the right to remove any job posting that violates these terms.',
    },
    {
      title: 'Prohibited Conduct',
      content:
        'Users may not: (1) harass or discriminate against other users, (2) post false or misleading content, (3) use the platform for illegal activities, (4) attempt to access unauthorized data, (5) interfere with platform operations, (6) scrape or copy content without permission, or (7) send unsolicited communications.',
    },
    {
      title: 'Intellectual Property',
      content:
        'HireLink and its content (design, logos, text, graphics) are owned by HireLink and protected by intellectual property laws. User-generated content remains the property of the user. By posting content, you grant HireLink a license to display it on the platform. Company logos and job descriptions remain the property of the respective employers.',
    },
    {
      title: 'Disclaimers',
      content:
        'HireLink is provided "as is" without warranties of any kind. We do not guarantee that job listings are accurate, available, or that you will find employment through the platform. We are not responsible for the conduct of employers or job seekers using the platform. Hiring decisions are made solely by employers.',
    },
    {
      title: 'Limitation of Liability',
      content:
        'To the maximum extent permitted by law, HireLink shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid us in the preceding 12 months (which for free accounts is zero).',
    },
    {
      title: 'Termination',
      content:
        'We may suspend or terminate your account at any time for violations of these terms. You may delete your account at any time. Upon termination, your right to use the platform ceases immediately. Provisions that by their nature should survive termination shall remain in effect.',
    },
    {
      title: 'Changes to Terms',
      content:
        'We may update these Terms of Service at any time. We will notify users of material changes via email or platform notification. Your continued use of HireLink after changes are posted constitutes acceptance of the updated terms.',
    },
    {
      title: 'Governing Law',
      content:
        'These terms are governed by the laws of the State of California, USA, without regard to conflict of law provisions. Any disputes shall be resolved in the courts located in San Francisco County, California.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950 py-16">
        <div className="container-app text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Terms of Service
          </h1>
          <p className="mt-3 text-primary-100">
            The rules and guidelines for using HireLink
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container-app max-w-3xl">
          <Card className="p-6 md:p-8 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Please read these Terms of Service carefully before using HireLink.
              These terms govern your use of the platform and define the rights and
              responsibilities of all users.
            </p>
          </Card>

          <div className="space-y-4">
            {sections.map((section, i) => (
              <Card key={i} className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {i + 1}. {section.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {section.content}
                </p>
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
