import LegalPage from "../../components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How BookMePro collects, uses, secures, and shares personal information, including Google Calendar data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy at BookMePro"
      title="Privacy Policy"
      intro="This policy explains how BookMePro handles personal information when coaches and students use our website, booking platform, communications, payments, and optional Google Calendar integration."
      updated="16 July 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          BookMePro is operated by Rinash Global Booking. In this policy,
          “BookMePro”, “we”, “us”, and “our” refer to the BookMePro platform and
          its operator. Privacy questions or requests can be sent to{" "}
          <a href="mailto:info@bookmepro.com.au">info@bookmepro.com.au</a>.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>Depending on how you use BookMePro, we may collect:</p>
        <ul>
          <li>account details such as name, email address, phone number, address, profile information, and authentication records;</li>
          <li>booking information such as coach, student, appointment time, location, notes, status, and communications;</li>
          <li>coach business information, availability, services, pricing, images, and public profile content;</li>
          <li>subscription and transaction identifiers from payment providers; BookMePro does not store complete payment-card numbers;</li>
          <li>support inquiries, contact-form messages, and transactional email delivery events; and</li>
          <li>technical information such as IP-derived country, cookies, device and browser information, analytics, and security logs.</li>
        </ul>
      </section>

      <section>
        <h2>3. Optional Google Calendar information</h2>
        <p>
          Connecting Google Calendar is optional and separate from signing in.
          BookMePro requests only the permissions needed for scheduling.
        </p>
        <ul>
          <li>For students, we read the connected Google account email, calendar-list metadata, and free/busy periods to warn about conflicts.</li>
          <li>For coaches, we also create, update, and remove BookMePro booking events on a coach-selected Google Calendar that the coach owns, including attendee invitations and optional Google Meet links.</li>
          <li>We store the selected calendar identifiers, synchronization metadata, and encrypted OAuth access and refresh tokens. We do not store the titles or descriptions of unrelated calendar events when checking availability.</li>
        </ul>
        <p>
          Google user data is used only to provide and secure the Calendar
          features described above. It is not sold, used for advertising, or
          used to train general-purpose AI models. BookMePro&apos;s use of
          information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>4. How we use information</h2>
        <ul>
          <li>provide accounts, profiles, availability, bookings, Calendar synchronization, reminders, and customer support;</li>
          <li>authenticate users, prevent scheduling conflicts, enforce capacity, detect misuse, and protect the platform;</li>
          <li>process subscriptions and maintain transaction and compliance records;</li>
          <li>send requested operational emails, including verification, booking, status, reminder, and account messages; and</li>
          <li>understand and improve platform performance and user experience.</li>
        </ul>
      </section>

      <section>
        <h2>5. When information is shared</h2>
        <p>
          We share information only as needed to operate BookMePro, complete a
          booking, comply with law, protect users, or with your direction. This
          can include the coach or student involved in a booking and service
          providers supporting hosting, databases, email delivery, payments,
          file storage, analytics, and Google Calendar functionality.
        </p>
        <p>
          Current providers may include Vercel, MongoDB, Brevo, Stripe,
          Cloudinary, and Google. These providers process information under
          their own contractual and privacy obligations and may process data
          outside Australia, including in the United States and European Union.
          We do not sell personal information.
        </p>
      </section>

      <section>
        <h2>6. Security and retention</h2>
        <p>
          We use reasonable technical and organisational safeguards, including
          access controls, encrypted connections, password hashing, encrypted
          Google OAuth tokens, secret-managed production systems, and provider
          monitoring. No online service can guarantee absolute security.
        </p>
        <p>
          We retain information for as long as reasonably necessary to provide
          the service, meet legal and accounting obligations, resolve disputes,
          and protect the platform. Retention periods vary by record type.
        </p>
      </section>

      <section>
        <h2>7. Your choices and rights</h2>
        <p>
          You may request access to or correction of your personal information,
          ask us to delete information where applicable, or make a privacy
          complaint by contacting us. You can disconnect Google Calendar in
          BookMePro settings, which removes stored OAuth tokens, and you can
          also revoke access from your Google Account permissions page.
        </p>
        <p>
          We will respond within a reasonable period and may need to verify your
          identity. Some records may need to be retained where required by law
          or for legitimate security, transaction, or dispute purposes.
        </p>
      </section>

      <section>
        <h2>8. Cookies and analytics</h2>
        <p>
          BookMePro uses essential cookies for sessions, preferences, and
          security. We may also use analytics and advertising measurement tools,
          including Google Analytics and Meta Pixel. Browser settings and
          provider controls can be used to manage non-essential tracking.
        </p>
      </section>

      <section>
        <h2>9. Complaints and policy changes</h2>
        <p>
          Send privacy complaints to{" "}
          <a href="mailto:info@bookmepro.com.au">info@bookmepro.com.au</a> with
          enough detail for us to investigate. If you are not satisfied with
          our response, you may be able to contact the Office of the Australian
          Information Commissioner. We may update this policy when our services
          or legal obligations change and will publish the revised date here.
        </p>
      </section>
    </LegalPage>
  );
}
