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
          answer="Projenda is a personal issue tracker for solo projects. You plan work with tasks and bugs, organize them in projects, move them on a backlog or board, and keep short sticky notes alongside your tickets."
        />

        <FAQItem
          question="Who is Projenda for?"
          answer="It is built for individuals and small personal projects. You manage your own workspace—there are no team invites, shared boards, or complex permission models."
        />

        <FAQItem
          question="How do I create an account?"
          answer="Click Sign Up in the top navigation and register with your email and a password, or sign in with Google."
        />

        <FAQItem
          question="How can I organize my work?"
          answer="Create up to ten projects, each with an abbreviation used in ticket keys (for example WEB-3). Choose Software projects when you need bugs and QA/closed statuses, or Other projects for a simpler workflow without bugs. Review everything in a sortable backlog list or drag active tickets on the board. Tickets can also live without a project."
        />

        <FAQItem
          question="What is the difference between a task and a bug?"
          answer="Tasks are general work items with priority, status, and an optional estimate. Bugs add severity and are available on Software projects. Both can have rich descriptions, attachments, comments, change history, and links to related or blocking tickets."
        />

        <FAQItem
          question="What are paper notes?"
          answer="Notes are short sticky notes (up to 140 characters) on a personal whiteboard. Keep them in a stack or drag them onto the board so ideas stay visible next to your project work."
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
    <div className="rounded-2xl border border-black/[0.1] bg-white p-5 shadow-soft dark:border-white/[0.12] dark:bg-dark-high dark:shadow-none">
      <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
        {question}
      </h4>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {answer}
      </p>
    </div>
  );
}
