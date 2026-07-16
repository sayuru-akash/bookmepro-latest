import LegalPage from "../../components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of the BookMePro booking platform by coaches and students.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Using BookMePro"
      title="Terms of Service"
      intro="These terms govern access to and use of BookMePro by coaches, students, and visitors. By creating an account or using the platform, you agree to these terms."
      updated="16 July 2026"
    >
      <section>
        <h2>1. About BookMePro</h2>
        <p>
          BookMePro is operated by Rinash Global Booking and provides tools for
          service professionals to publish profiles and availability, receive
          booking requests, manage appointments, communicate with students, and
          optionally synchronize with third-party calendars.
        </p>
      </section>

      <section>
        <h2>2. Accounts and eligibility</h2>
        <p>
          You must provide accurate, current information, protect your login
          credentials, and promptly notify us of suspected unauthorised access.
          You are responsible for activity performed through your account. If
          you use BookMePro for a business or organisation, you confirm that you
          have authority to bind it to these terms.
        </p>
      </section>

      <section>
        <h2>3. Coaches and students</h2>
        <ul>
          <li>Coaches control their services, profile content, availability, pricing, locations, booking approvals, and the professional services they deliver.</li>
          <li>Students must provide accurate booking details and use booking, cancellation, and rescheduling functions reasonably.</li>
          <li>Each party is responsible for confirming service suitability, qualifications, safety, attendance, and any requirements applying to the underlying appointment.</li>
          <li>BookMePro provides the platform and is not the provider of coaching, training, consulting, medical, financial, legal, or other professional services advertised by coaches.</li>
        </ul>
      </section>

      <section>
        <h2>4. Bookings, cancellations, and communications</h2>
        <p>
          A booking request may remain pending until accepted by the coach.
          Status emails, calendar invitations, reminders, and Google Meet links
          are operational aids; users remain responsible for checking their
          booking status and attending at the confirmed time and location.
        </p>
        <p>
          Coach-specific cancellation, refund, and rescheduling terms may apply
          to the underlying service. Nothing in these terms excludes rights or
          remedies that cannot lawfully be excluded under the Australian
          Consumer Law.
        </p>
      </section>

      <section>
        <h2>5. Subscriptions and payments</h2>
        <p>
          Paid BookMePro plans, billing cycles, inclusions, and prices are shown
          at purchase. Payments are handled by our payment provider. Unless
          stated otherwise, subscriptions renew for the selected billing cycle
          until cancelled. Cancellation prevents future renewal but does not
          automatically create a refund for an already-started billing period,
          except where required by law or expressly offered.
        </p>
      </section>

      <section>
        <h2>6. Google Calendar and third-party services</h2>
        <p>
          Google Calendar connection is optional. If connected, you authorise
          BookMePro to perform the calendar actions described during consent and
          in our Privacy Policy. You can disconnect at any time. Google, Stripe,
          Brevo, Cloudinary, analytics tools, and other third-party services are
          governed by their own terms and availability.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>use BookMePro unlawfully, deceptively, fraudulently, or to harass or harm others;</li>
          <li>upload content you do not have the right to use or content that infringes privacy, intellectual-property, or other rights;</li>
          <li>probe, disrupt, bypass, overload, scrape, reverse engineer, or attempt unauthorised access to the platform or another account; or</li>
          <li>send spam, malware, or misleading booking and payment communications.</li>
        </ul>
      </section>

      <section>
        <h2>8. Content and intellectual property</h2>
        <p>
          You retain ownership of content you submit and grant BookMePro a
          non-exclusive licence to host, process, reproduce, and display it only
          as needed to operate, secure, promote, and improve the service. The
          BookMePro platform, branding, software, and original materials remain
          owned by us or our licensors.
        </p>
      </section>

      <section>
        <h2>9. Availability, changes, and liability</h2>
        <p>
          We work to keep BookMePro secure and available, but do not guarantee
          uninterrupted or error-free operation. Features may change to improve
          security, performance, compliance, or product functionality.
        </p>
        <p>
          To the maximum extent permitted by law, BookMePro is not liable for
          indirect or consequential loss, loss caused by a coach or student,
          third-party service interruption, or reliance on an automated reminder.
          Any guarantees, rights, or remedies that cannot lawfully be excluded
          remain unaffected.
        </p>
      </section>

      <section>
        <h2>10. Suspension and termination</h2>
        <p>
          You may stop using BookMePro at any time. We may restrict or terminate
          access where reasonably necessary to address non-payment, material or
          repeated breach, unlawful conduct, security risk, or harm to users or
          the platform. Where appropriate, we will provide notice and a chance
          to remedy the issue.
        </p>
      </section>

      <section>
        <h2>11. General</h2>
        <p>
          These terms are governed by applicable Australian law. If a provision
          is unenforceable, the remaining provisions continue. We may update
          these terms and will publish the revised date; material changes may be
          notified through the service. Questions can be sent to{" "}
          <a href="mailto:info@bookmepro.com.au">info@bookmepro.com.au</a>.
        </p>
      </section>
    </LegalPage>
  );
}
