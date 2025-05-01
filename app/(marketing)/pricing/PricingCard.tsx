import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
  badge?: string;
}

function PricingCard({
  title,
  price,
  period = 'per month',
  description,
  features,
  buttonText,
  buttonLink,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-lg p-6 ${
        highlighted
          ? 'bg-blue-900 border-2 border-blue-700 shadow-md relative'
          : 'bg-gray-800 border border-gray-700 shadow-sm'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </div>
      )}
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        {price !== 'Custom' && (
          <span className="text-gray-400 dark:text-gray-300"> {period}</span>
        )}
      </div>
      <p className="text-gray-400 dark:text-gray-300 mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            {feature.included ? (
              <CheckCircle2 className="h-5 w-5 text-green-300 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
            )}
            <span
              className={
                feature.included
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-600'
              }
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={buttonLink}
        className={`w-full inline-flex h-10 items-center justify-center rounded-md px-8 py-2 text-sm font-medium shadow transition-colors ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}

export default PricingCard;
