import {
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';

export function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="group rounded-2xl border border-black/[0.06] bg-white/80 p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-white/[0.08] dark:bg-dark-high/80 dark:shadow-none dark:hover:border-white/[0.14]">
      {Icon ? (
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
          <Icon size={18} />
        </span>
      ) : null}
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
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
      className={cn(
        'rounded-2xl p-6',
        highlighted
          ? 'border-2 border-violet-400/60 bg-violet-50/80 shadow-glow dark:border-violet-700 dark:bg-violet-950/40'
          : 'border border-black/[0.06] bg-white/80 shadow-soft dark:border-white/[0.08] dark:bg-dark-high dark:shadow-none',
      )}
    >
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {price}
        </span>
        {price !== 'Custom' && (
          <span className="text-gray-500 dark:text-gray-400">/month</span>
        )}
      </div>
      <p className="mb-6 text-gray-500 dark:text-gray-400">{description}</p>
      <ul className="mb-6 space-y-3">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start text-gray-600 dark:text-gray-400"
          >
            <CheckCircle2 className="mr-2 h-5 w-5 shrink-0 text-emerald-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={buttonLink}
        className={cn(
          'inline-flex h-10 w-full items-center justify-center rounded-xl px-8 py-2 text-sm font-medium shadow transition-colors',
          highlighted
            ? 'bg-violet-600 text-white hover:bg-violet-700'
            : 'border border-black/[0.08] bg-white text-gray-900 hover:bg-gray-50 dark:border-white/[0.1] dark:bg-dark-high dark:text-white dark:hover:bg-dark-elevated',
        )}
      >
        {buttonText}
      </Link>
    </div>
  );
}
