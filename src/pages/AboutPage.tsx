import { Briefcase, Target, Users, TrendingUp, Award, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To empower every professional with the tools and opportunities they need to build a fulfilling career.',
    },
    {
      icon: Heart,
      title: 'Our Values',
      description:
        'Transparency, fairness, and putting people first in everything we do — from job seekers to employers.',
    },
    {
      icon: TrendingUp,
      title: 'Our Impact',
      description:
        'Over 15,000 professionals and 450+ companies trust HireLink to make meaningful career connections.',
    },
  ];

  const team = [
    { name: 'Sarah Chen', role: 'CEO & Co-Founder', initial: 'S' },
    { name: 'Marcus Johnson', role: 'CTO & Co-Founder', initial: 'M' },
    { name: 'Priya Patel', role: 'Head of Product', initial: 'P' },
    { name: 'David Kim', role: 'Head of Engineering', initial: 'D' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950 py-20">
        <div className="container-app text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            About HireLink
          </h1>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            We're on a mission to connect great talent with great companies,
            making the hiring process simpler, faster, and more human.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-20">
        <div className="container-app max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Our Story
          </h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Founded in 2024, HireLink was born from a simple observation: finding
              the right job — and the right candidate — shouldn't be so complicated.
              Traditional job boards were cluttered, impersonal, and often frustrating
              for both sides of the hiring equation.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
              We set out to build a platform that puts people first. A place where job
              seekers can showcase their true potential and employers can discover the
              talent they need to grow. Today, HireLink serves thousands of
              professionals and companies across industries, and we're just getting
              started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              What Drives Us
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Meet the Team
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">
              The people behind HireLink
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="p-6 text-center">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-2xl font-bold mb-4">
                  {member.initial}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {member.role}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-primary-600 dark:bg-primary-900">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '15K+', label: 'Job Seekers', icon: Users },
              { value: '450+', label: 'Companies', icon: Briefcase },
              { value: '3.2K+', label: 'Hires Made', icon: Award },
              { value: '1.2K+', label: 'Active Jobs', icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="h-8 w-8 mx-auto text-primary-200 mb-2" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-primary-200 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
