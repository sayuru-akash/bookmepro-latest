import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  GraduationCap,
  Link2,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Pricing from "../Pricing.js";
import HomeAuthAction from "./HomeAuthAction";

const audienceCards = [
  {
    title: "Coaches",
    description:
      "Run private sessions, recurring programs, and a branded booking page without juggling scattered tools.",
    icon: Sparkles,
  },
  {
    title: "Personal Trainers",
    description:
      "Manage availability across gyms, outdoor sessions, and online coaching from one schedule.",
    icon: Dumbbell,
  },
  {
    title: "Sports Instructors",
    description:
      "Make it easier for athletes and parents to find your profile, understand your offer, and book faster.",
    icon: GraduationCap,
  },
  {
    title: "Consultants",
    description:
      "Turn expertise into a clean client journey with structured bookings, clear service positioning, and less admin.",
    icon: BriefcaseBusiness,
  },
];

const platformHighlights = [
  {
    title: "A polished booking page you can actually share",
    description:
      "Give clients one destination for your profile, offer, availability, and next step.",
    icon: Link2,
  },
  {
    title: "Schedule control without the calendar chaos",
    description:
      "Set the times that work for you and keep your booking flow aligned with real availability.",
    icon: CalendarDays,
  },
  {
    title: "Location management for real-world businesses",
    description:
      "Organise where sessions happen so clients know exactly where to meet you.",
    icon: MapPinned,
  },
  {
    title: "Built to look credible from first click",
    description:
      "Show up with a more professional client experience without hiring a designer or building custom pages.",
    icon: ShieldCheck,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Present your offer clearly",
    description:
      "Profile, service details, and a shareable link all work together so the value is obvious before the client asks.",
  },
  {
    step: "02",
    title: "Let clients self-book",
    description:
      "People choose a time that fits your real schedule instead of waiting on manual replies and DMs.",
  },
  {
    step: "03",
    title: "Keep delivery organised",
    description:
      "Use one operating layer for sessions, locations, and repeat appointments instead of switching systems.",
  },
  {
    step: "04",
    title: "Scale without looking improvised",
    description:
      "As demand grows, your client-facing experience still feels structured, calm, and professional.",
  },
];

const featureTiles = [
  "Custom public profile with a direct booking link",
  "Flexible availability management for changing schedules",
  "Multiple coaching or meeting locations in one setup",
  "Location-aware pricing already connected to the platform",
  "Built for solo operators and growing service businesses",
  "Designed to reduce admin drag so more time goes into delivery",
];

export default function HomePageContent() {
  return (
    <main className="bg-[#f5f1e8] text-[#10311f]">
      <section className="relative isolate overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/home/soccer.png"
          preload="metadata"
        >
          <source src="/homeHeader.mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(1,53,27,0.90)_8%,rgba(1,53,27,0.72)_42%,rgba(1,53,27,0.35)_72%,rgba(1,53,27,0.82)_100%)]" />
        <div className="home-grid-pattern absolute inset-0 opacity-50" />
        <div className="home-radial-glow absolute left-[-10rem] top-[10rem] h-72 w-72 rounded-full bg-[#bfe3cb]/30 blur-3xl" />
        <div className="home-radial-glow absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-[#f0d39d]/20 blur-3xl" />

        <div className="container relative mx-auto flex min-h-screen items-center px-6 pb-16 pt-32 md:px-20 lg:pt-40">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="home-fade-up text-white">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/90 backdrop-blur-md sm:text-sm">
                Booking infrastructure for service-led businesses
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Turn expertise into a booking experience people trust.
              </h1>

              <p className="mt-6 max-w-3xl text-lg font-light leading-8 text-white/88 sm:text-xl">
                BookMePro helps coaches, personal trainers, sports instructors,
                and consultants present their services better, manage
                appointments cleanly, and look far more established from the
                first click.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <HomeAuthAction className="inline-flex items-center gap-2 rounded-full bg-[#f2c66d] px-6 py-3 text-base font-semibold text-[#163322] transition-transform duration-300 hover:-translate-y-0.5" />
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/16"
                >
                  See pricing
                </a>
              </div>

              <div className="mt-10 hidden max-w-4xl flex-wrap gap-3 text-sm text-white/84 sm:flex sm:text-base">
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                  Share one direct booking link
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                  Manage multiple locations
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                  Keep availability under control
                </div>
              </div>
            </div>

            <div className="relative home-fade-up-delayed">
              <div className="absolute -inset-6 rounded-[2rem] bg-[#8ab89a]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/12 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-white/15 bg-[#0c281a]/55 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="mt-2 text-2xl font-semibold">
                        Cleaner bookings. Stronger first impression.
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f5f1e8]">
                    <Image
                      src="/images/about/SliderMain.png"
                      width={1400}
                      height={980}
                      alt="Professionals using BookMePro to present and run their services"
                      className="h-auto w-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-40 -left-3 hidden max-w-xs rounded-[1.5rem] border border-[#dfe7da] bg-[#f7f4ec] p-4 text-[#163322] shadow-[0_20px_60px_rgba(12,37,22,0.18)] lg:block">
                <div className="text-xs uppercase tracking-[0.22em] text-[#53745f]">
                  Built for
                </div>
                <div className="mt-3 space-y-2 text-sm font-medium">
                  <div>1:1 coaching and advisory sessions</div>
                  <div>Recurring training programs</div>
                  <div>In-person and multi-location services</div>
                </div>
              </div>
            </div>
          </div>

          <a
            href="#explore"
            className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md md:inline-flex"
          >
            Explore the platform
            <ChevronDown size={16} />
          </a>
        </div>
      </section>

      <section id="explore" className="relative overflow-hidden py-20 sm:py-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="max-w-3xl">
            <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#53745f]">
              Broader than coaching software
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl">
              The same booking problem shows up across more industries than most platforms admit.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#365542]">
              If your business depends on sessions, appointments, or recurring
              client time, the challenge is the same: look credible, stay easy
              to book, and keep the admin load from swallowing your week.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {audienceCards.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[1.75rem] border border-[#d8e3d8] bg-[#fbfaf6] p-6 shadow-[0_18px_60px_rgba(16,49,31,0.07)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2efe5] text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-[#143521]">
                  {title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#486651]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="relative lg:self-end">
              <div className="absolute -inset-6 rounded-[2rem] bg-[#b9d8c0]/35 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[#dce6da] bg-white p-4 shadow-[0_20px_70px_rgba(16,49,31,0.10)]">
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/home/sitting-table-working-cafe.jpg"
                    width={1200}
                    height={900}
                    alt="Coach presenting services in a more professional way"
                    className="h-96 w-full object-cover"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-[#10311f] p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#b2ceb9]">
                      Positioning
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      Show what you do without sending six follow-up messages.
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#eef5ef] p-4 text-[#163322]">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#587261]">
                      Operations
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      Keep bookings and locations in sync with real delivery.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl">
                A System That Works With Your Business
              </h2>
              <div className="mt-8 grid gap-4">
                {platformHighlights.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-[1.5rem] border border-[#d8e3d8] bg-[#fbfaf6] p-5"
                  >
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e2efe5] text-primary">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#143521]">
                        {title}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-[#486651]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#10311f] py-20 text-white sm:py-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#b8d6bf]">
                How the flow should feel
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                From discovery to repeat bookings, the experience should stay calm and obvious.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/76">
                Most service businesses do not need more tools. They need one
                coherent path that helps prospects understand the offer and book
                without friction.
              </p>

              <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4">
                <Image
                  src="/images/home/unsplash.png"
                  width={1200}
                  height={900}
                  alt="Client-friendly booking experience"
                  className="h-auto w-full rounded-[1.4rem] object-cover"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workflowSteps.map(({ step, title, description }) => (
                <article
                  key={step}
                  className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur-sm"
                >
                  <div className="text-sm font-semibold tracking-[0.24em] text-[#f2c66d]">
                    {step}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-white/75">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#53745f]">
                Designed around real use cases
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl">
                Why the booking experience should be more than a calendar view.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#365542]">
              This is the operational layer behind a more credible front door.
              It should help you book faster now and still hold up when demand
              becomes less predictable.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-[#d8e3d8] bg-white p-4 shadow-[0_20px_70px_rgba(16,49,31,0.09)]">
              <Image
                src="/images/home/booking-graphic-vec.jpg"
                width={1400}
                height={960}
                alt="Flexible service scheduling"
                className="h-auto w-full rounded-[1.5rem] object-cover"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featureTiles.map((feature) => (
                <div
                  key={feature}
                  className="rounded-[1.5rem] border border-[#d8e3d8] bg-[#fbfaf6] px-5 py-5 text-lg font-medium leading-7 text-[#163322] shadow-[0_14px_40px_rgba(16,49,31,0.05)]"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pb-20 sm:pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="overflow-hidden rounded-[2.25rem] border border-[#d8e3d8] bg-[linear-gradient(135deg,#f8f5ee_0%,#edf5ef_100%)] p-6 shadow-[0_24px_80px_rgba(16,49,31,0.08)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl">
                Start lean, then expand when the business demands it.
              </h2>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/90">
              <Pricing />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#10311f_0%,#184e31_50%,#2d6a47_100%)] px-6 py-10 text-white shadow-[0_24px_80px_rgba(9,30,18,0.28)] sm:px-8 lg:px-12 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#b8d6bf]">
                  Final thought
                </div>
                <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                  If the business already runs on relationships, the booking experience should reflect that level of professionalism.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
                  Use BookMePro to replace improvised scheduling with something
                  clients can trust at a glance.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 lg:justify-end">
                <HomeAuthAction className="inline-flex items-center gap-2 rounded-full bg-[#f2c66d] px-6 py-3 text-base font-semibold text-[#163322] transition-transform duration-300 hover:-translate-y-0.5" />
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-base font-medium text-white/92 transition-colors duration-300 hover:bg-white/10"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}