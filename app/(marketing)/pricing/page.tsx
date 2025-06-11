import React from 'react';
import PricingCard from './PricingCard';

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <div className="max-w-2xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-400 dark:text-gray-300">
          Choose the plan that&apos;s right for you and your team
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Free Plan */}
        <PricingCard
          title="Free"
          price="$0"
          description="Perfect for individuals and small teams getting started."
          features={[
            { name: 'Up to 3 team members', included: true },
            { name: 'Unlimited issues', included: true },
            { name: 'Basic issues tracking', included: true },
            { name: 'Email support', included: true },
            { name: 'API access', included: false },
            { name: 'Custom fields', included: false },
            { name: 'Advanced integrations', included: false },
          ]}
          buttonText="Sign Up Free"
          buttonLink="/auth/signup"
        />

        {/* Pro Plan */}
        <PricingCard
          title="Pro"
          price="$10"
          period="per user / month"
          description="For growing teams that need more features and flexibility."
          features={[
            { name: 'Unlimited team members', included: true },
            { name: 'Unlimited issues', included: true },
            { name: 'Advanced issues tracking', included: true },
            { name: 'Priority support', included: true },
            { name: 'API access', included: true },
            { name: 'Custom fields', included: true },
            { name: 'Advanced integrations', included: false },
          ]}
          buttonText="Coming Soon"
          buttonLink="#"
          highlighted
          badge="Popular"
        />

        {/* Enterprise Plan */}
        <PricingCard
          title="Enterprise"
          price="Custom"
          description="For organizations that need advanced security and support."
          features={[
            { name: 'Unlimited team members', included: true },
            { name: 'Unlimited issues', included: true },
            { name: 'Advanced issues tracking', included: true },
            { name: 'Dedicated support', included: true },
            { name: 'API access', included: true },
            { name: 'Custom fields', included: true },
            { name: 'Advanced integrations', included: true },
          ]}
          buttonText="Contact Sales"
          buttonLink="mailto:sales@taskmanagerapp.com"
        />
      </div>

      <div className="max-w-3xl mx-auto mt-16 text-center bg-gray-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Need a custom solution?
        </h2>
        <p className="text-lg text-gray-400 dark:text-gray-300 mb-8">
          Contact our sales team to discuss your specific requirements.
        </p>
        <a
          href="mailto:sales@taskmanagerapp.com"
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
        >
          Contact Sales
        </a>
      </div>
    </div>
  );
}
