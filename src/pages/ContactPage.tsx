import { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'hello@hirelink.com',
      subtitle: 'We reply within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+1 (555) 123-4567',
      subtitle: 'Mon-Fri, 9am - 6pm EST',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: '123 Market Street, San Francisco, CA 94103',
      subtitle: 'Our headquarters',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-700 dark:from-primary-800 dark:to-slate-950 py-16">
        <div className="container-app text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Get in Touch</h1>
          <p className="mt-3 text-primary-100 max-w-xl mx-auto">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12">
        <div className="container-app">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactInfo.map((info) => (
              <Card key={info.title} className="p-6 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <info.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {info.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {info.value}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {info.subtitle}
                </p>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Send us a message
                </h2>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 mb-4">
                    <Send className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Message Sent!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Thanks for reaching out. We'll get back to you soon.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                      required
                    />
                    <Input
                      type="email"
                      label="Email Address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <Input
                    label="Subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="How can we help?"
                    required
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us more..."
                      required
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <Button type="submit" fullWidth size="lg">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
