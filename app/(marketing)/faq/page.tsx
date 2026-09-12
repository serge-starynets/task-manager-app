import React from 'react';

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
          Support
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-3">
        <FAQItem
          question="What is Projenda?"
          answer="Projenda is a simple task and project tracker designed for individuals. It helps you organize ideas, plan small personal projects, and follow tasks from backlog to completion."
        />

        <FAQItem
          question="Who is Projenda for?"
          answer="Projenda is built for solo use and small personal projects. It focuses on the essentials instead of team management, complex permissions, or collaboration features."
        />

        <FAQItem
          question="How do I create an account?"
          answer="Click 'Sign Up' in the top navigation and register with your email and a password. You can also sign in with Google."
        />

        <FAQItem
          question="How can I organize my work?"
          answer="Create projects for larger goals and add tasks with priorities and statuses. You can review tasks in a list or move active work across a visual board. Standalone tasks are available for items that do not need a project."
        />

        <FAQItem
          question="What can I add to a task?"
          answer="Each task can include a formatted description, priority, status, file attachments, and links to related tasks in the same project."
        />

        <FAQItem
          question="Is Projenda free to use?"
          answer="Yes. Projenda is an open-source project, so you can use the hosted app or download the source code and run it yourself."
        />

        <FAQItem
          question="How do I report a bug or suggest an improvement?"
          answer="Open an issue in the Projenda GitHub repository. Bug reports, suggestions, and contributions are welcome."
        />
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-soft dark:border-white/[0.08] dark:bg-dark-high/80 dark:shadow-none">
      <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
        {question}
      </h4>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {answer}
      </p>
    </div>
  );
}
