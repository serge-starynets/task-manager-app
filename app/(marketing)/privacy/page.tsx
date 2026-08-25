const EFFECTIVE_DATE = 'August 25, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article className="space-y-8 text-gray-700 dark:text-gray-300">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </header>

        <p>
          Projenda is a personal project and task management application
          operated by Serhii Starynets (&ldquo;Projenda&rdquo;,
          &ldquo;we&rdquo;, or &ldquo;us&rdquo;).
        </p>

        <PolicySection title="Information we collect">
          <p>When you use Projenda, we may process:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Your email address, name, and profile image.</li>
            <li>
              Authentication information provided through Google or
              email/password sign-in.
            </li>
            <li>
              Projects, tasks, descriptions, priorities, statuses, and related
              content you create.
            </li>
            <li>Files and images you upload.</li>
            <li>Essential session cookies.</li>
            <li>
              Technical logs needed for security, troubleshooting, and service
              operation.
            </li>
          </ul>
          <p>
            Passwords are stored as cryptographic hashes. We do not store your
            Google password.
          </p>
        </PolicySection>

        <PolicySection title="How we use information">
          <p>We use this information to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Create and secure your account.</li>
            <li>Provide project and task management features.</li>
            <li>Store and display content you create.</li>
            <li>Maintain, troubleshoot, and protect the service.</li>
            <li>Respond to support, privacy, and deletion requests.</li>
          </ul>
          <p>
            Where applicable, processing is based on providing the service you
            requested, our legitimate interest in operating it securely, or
            your consent.
          </p>
        </PolicySection>

        <PolicySection title="Service providers">
          <p>Projenda uses third-party providers to operate the service:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Google for optional authentication.</li>
            <li>Vercel for application hosting and file storage.</li>
            <li>Neon for database hosting.</li>
          </ul>
          <p>
            These providers may process information according to their own
            privacy terms and may operate in countries other than yours.
          </p>
        </PolicySection>

        <PolicySection title="Cookies">
          <p>
            Projenda uses essential cookies for authentication, session
            management, and security. These cookies are required for the
            application to work. We do not currently use advertising or
            behavioral tracking cookies.
          </p>
        </PolicySection>

        <PolicySection title="Data sharing">
          <p>We do not sell your personal information.</p>
          <p>Information may be disclosed:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>To service providers needed to operate Projenda.</li>
            <li>When required by law.</li>
            <li>To investigate abuse or protect users and the service.</li>
            <li>With your consent.</li>
          </ul>
          <p>
            Authorized service administrators may access account content when
            reasonably necessary for security, support, or maintenance.
          </p>
        </PolicySection>

        <PolicySection title="Data retention">
          <p>
            We retain account information and user-created content while your
            account remains active. You may request deletion of your account
            and associated content through the contact method below. Some
            information may remain temporarily in backups or logs where needed
            for security, legal compliance, or technical operations.
          </p>
        </PolicySection>

        <PolicySection title="Your rights">
          <p>Depending on your location, you may have rights to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Access or correct your personal information.</li>
            <li>Request deletion or restriction of processing.</li>
            <li>Object to processing.</li>
            <li>Receive a copy of your data.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Submit a complaint to your local data protection authority.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Security">
          <p>
            We use reasonable technical and organizational safeguards to
            protect information. However, no online service can guarantee
            complete security.
          </p>
        </PolicySection>

        <PolicySection title="Children">
          <p>
            Projenda is not intended for children under 16. We do not knowingly
            collect personal information from children.
          </p>
        </PolicySection>

        <PolicySection title="Changes">
          <p>
            We may update this policy as Projenda changes. The updated version
            will be posted here with a revised effective date.
          </p>
        </PolicySection>

        <PolicySection title="Contact">
          <p>
            For privacy questions, data requests, or account deletion, contact
            us through the{' '}
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
        </PolicySection>
      </article>
    </main>
  );
}

function PolicySection({
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
