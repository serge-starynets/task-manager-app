import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
}

export function PlanCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonLink,
  highlighted = false,
}: PlanCardProps) {
  return (
    <div
      className={`rounded-lg p-6 ${
        highlighted
          ? 'bg-purple-900 border-2 border-purple-700 shadow-md'
          : 'bg-gray-800 border border-gray-700 shadow-sm'
      }`}
    >
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        {price !== 'Custom' && <span className="text-gray-400">/month</span>}
      </div>
      <p className="text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-400">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={buttonLink}
        className={`w-full inline-flex h-10 items-center justify-center rounded-md px-8 py-2 text-sm font-medium shadow transition-colors ${
          highlighted
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}
