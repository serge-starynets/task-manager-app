const EFFECTIVE_DATE = 'August 25, 2026';

export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article className="space-y-8 text-gray-700 dark:text-gray-300">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </header>

        <p>
          These Terms govern your use of the hosted Projenda application. By
          creating an account or using Projenda, you agree to these Terms.
        </p>

        <TermsSection title="The service">
          <p>
            Projenda is a simple project and task management application
            intended primarily for individuals and small personal projects.
          </p>
          <p>
            The service is currently provided free of charge. Features,
            availability, and usage limits may change over time.
          </p>
        </TermsSection>

        <TermsSection title="Accounts">
          <p>You are responsible for:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Providing accurate account information.</li>
            <li>Protecting access to your account.</li>
            <li>Activities performed through your account.</li>
            <li>Notifying us if you suspect unauthorized access.</li>
          </ul>
          <p>
            You may not use another person&apos;s email address or account
            without permission.
          </p>
        </TermsSection>

        <TermsSection title="Your content">
          <p>
            You retain ownership of projects, tasks, descriptions, and files
            you create or upload.
          </p>
          <p>
            You grant us limited permission to store, process, display, and
            transmit this content only as necessary to operate and improve
            Projenda.
          </p>
          <p>
            You are responsible for ensuring that your content is lawful and
            that you have permission to upload it.
          </p>
        </TermsSection>

        <TermsSection title="Acceptable use">
          <p>You must not:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Use Projenda for unlawful, fraudulent, or abusive purposes.</li>
            <li>Upload malware or other harmful content.</li>
            <li>Attempt to access another user&apos;s account or data.</li>
            <li>Interfere with the operation or security of the service.</li>
            <li>Circumvent storage, access, or usage limits.</li>
            <li>
              Use automated requests that place an unreasonable load on the
              service.
            </li>
            <li>
              Upload content that infringes intellectual property or privacy
              rights.
            </li>
          </ul>
        </TermsSection>

        <TermsSection title="Files and backups">
          <p>
            Projenda is not intended to be your only backup location. Keep
            independent copies of important information and files.
          </p>
          <p>
            We may apply reasonable limits to file types, file sizes, projects,
            tasks, or storage.
          </p>
        </TermsSection>

        <TermsSection title="Third-party services">
          <p>
            Projenda depends on third-party services such as Google, Vercel,
            and Neon. Their availability and terms are outside our control.
            Links to third-party websites are provided for convenience and do
            not imply endorsement.
          </p>
        </TermsSection>

        <TermsSection title="Suspension and termination">
          <p>We may suspend or terminate access when reasonably necessary to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Prevent abuse or security threats.</li>
            <li>Comply with legal obligations.</li>
            <li>Protect the service or other users.</li>
            <li>Address serious violations of these Terms.</li>
          </ul>
          <p>
            You may stop using Projenda at any time. You may request account
            deletion through the contact method below.
          </p>
        </TermsSection>

        <TermsSection title="Availability and warranties">
          <p>
            Projenda is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;. To the extent permitted by law, we do not
            guarantee that the service will always be available, uninterrupted,
            error-free, or suitable for a particular purpose.
          </p>
        </TermsSection>

        <TermsSection title="Limitation of liability">
          <p>
            To the extent permitted by applicable law, we are not liable for
            indirect, incidental, or consequential losses resulting from use of
            Projenda, including loss of data, files, productivity, or access.
            Nothing in these Terms excludes liability that cannot legally be
            excluded.
          </p>
        </TermsSection>

        <TermsSection title="Changes to the service or Terms">
          <p>
            We may modify the service or these Terms. Material changes will be
            posted with an updated effective date. Continued use after changes
            take effect means you accept the revised Terms.
          </p>
        </TermsSection>

        <TermsSection title="Contact">
          <p>
            Questions about these Terms or account deletion requests can be
            submitted through the{' '}
            <a
              href="https://github.com/serge-starynets/task-manager-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 underline hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Projenda GitHub repository
            </a>
            .
          </p>
        </TermsSection>
      </article>
    </main>
  );
}

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}
