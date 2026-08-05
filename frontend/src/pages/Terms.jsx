import React from 'react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Nestara ("the Platform"), you agree to be bound by these
    Terms & Conditions. If you do not agree with any part of these terms, please do
    not use the Platform.`,
  },
  {
    title: '2. Who Can Use Nestara',
    body: `You must be at least 18 years old to create an account, post a property, or
    contact another user through the Platform. By registering, you confirm that
    the information you provide (name, email, phone) is accurate and belongs to you.`,
  },
  {
    title: '3. Listings & Content',
    body: `Property owners are solely responsible for the accuracy of the listings they
    submit — including price, images, location, and description. Nestara reviews
    submissions before publishing but does not independently verify ownership or
    legal title of any property. Users should conduct their own due diligence
    before entering into any transaction.`,
  },
  {
    title: '4. No Brokerage, No Transaction Guarantee',
    body: `Nestara is a listings platform that connects property owners with buyers and
    tenants directly. We do not charge brokerage, and we are not a party to any
    sale, rental agreement, or payment made between users. Any dispute arising
    from a transaction is solely between the parties involved.`,
  },
  {
    title: '5. Prohibited Conduct',
    body: `Users may not post fraudulent, duplicate, or misleading listings; use the
    Platform to harass other users; scrape or resell data from the Platform; or
    attempt to bypass the OTP/verification systems. Violating these terms may
    result in account suspension.`,
  },
  {
    title: '6. Account Security',
    body: `You are responsible for maintaining the confidentiality of your login
    credentials. Notify us immediately if you suspect unauthorized use of your
    account.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `Nestara provides the Platform "as is" without warranties of any kind. We are
    not liable for losses arising from reliance on listing information, direct
    dealings between users, or downtime of the service.`,
  },
  {
    title: '8. Changes to These Terms',
    body: `We may update these Terms & Conditions from time to time. Continued use of
    the Platform after changes are posted constitutes acceptance of the revised
    terms.`,
  },
  {
    title: '9. Contact',
    body: `Questions about these terms can be sent to support@nestara.demo.`,
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-800 text-ink">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-700 text-ink">{s.title}</h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/80">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}