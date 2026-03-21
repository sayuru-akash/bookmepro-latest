import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "About BookMePro | Vision, Mission, and Platform Focus",
  description:
    "Learn about BookMePro's mission and vision for helping coaches, trainers, consultants, and instructors run better booking experiences.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About BookMePro",
    description:
      "How BookMePro helps service professionals present and manage their bookings more effectively.",
    url: "/about",
    type: "website",
    images: [
      {
        url: "/images/about/tbltennis.jpg",
        width: 1200,
        height: 630,
        alt: "About BookMePro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About BookMePro",
    description:
      "Vision, mission, and platform focus for service-based businesses.",
    images: ["/images/about/tbltennis.jpg"],
  },
};

export default function About() {
  return (
    <main className="bg-[#f5f1e8] text-[#10311f]">
      <section className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(180,214,189,0.45),transparent_38%),radial-gradient(circle_at_80%_72%,rgba(242,198,109,0.25),transparent_36%)]" />
        <div className="container relative mx-auto px-6 md:px-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-[#cddfcf] bg-[#edf5ef] px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[#4d6f58]">
              About BookMePro
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl lg:text-6xl">
              Built for professionals who want their booking experience to feel
              as credible as their expertise.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#365542] sm:text-xl">
              BookMePro started with a simple idea: service-based businesses
              should not have to choose between delivering great work and
              managing admin chaos. We help coaches, trainers, instructors, and
              consultants look sharper online and run bookings with less
              friction.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid auto-rows-[150px] gap-4 sm:auto-rows-[180px] lg:grid-cols-6 lg:auto-rows-[120px]">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d8e3d8] bg-white shadow-[0_16px_45px_rgba(16,49,31,0.08)] lg:col-span-2 lg:row-span-3">
              <Image
                src="/images/about/tbltennis.jpg"
                alt="BookMePro platform presentation"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d8e3d8] bg-white lg:col-span-2 lg:row-span-2">
              <Image
                src="/images/about/SilderCol31.png"
                alt="Coaching workflow"
                fill
                className="object-cover"
              />
            </div>
            <div className="rounded-[1.5rem] border border-[#d8e3d8] bg-[#10311f] p-6 text-white lg:col-span-2 lg:row-span-2">
              <div className="text-xs uppercase tracking-[0.22em] text-[#b8d6bf]">
                What we focus on
              </div>
              <p className="mt-4 text-lg leading-7">
                Clear service positioning, cleaner booking journeys, and less
                manual scheduling overhead.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d8e3d8] bg-white lg:col-span-2 lg:row-span-2">
              <Image
                src="/images/about/SilderCol21.png"
                alt="Client booking moments"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d8e3d8] bg-white lg:col-span-1 lg:row-span-2">
              <Image
                src="/images/about/SilderCol24.png"
                alt="Service operations"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d8e3d8] bg-white lg:col-span-1 lg:row-span-2">
              <Image
                src="/images/about/SilderCol32.png"
                alt="Professional growth"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid items-center gap-8 rounded-[2rem] border border-[#d8e3d8] bg-white p-6 shadow-[0_20px_60px_rgba(16,49,31,0.08)] md:grid-cols-9 md:p-10">
            <div className="md:col-span-5">
              <h2 className="text-3xl font-semibold text-[#143521] sm:text-4xl">
                Vision
              </h2>
              <p className="mt-5 text-base leading-8 text-[#365542] sm:text-lg">
                To empower professionals across diverse fields by redefining how
                they manage their time, connect with clients, and grow their
                businesses. We envision a world where every coach, trainer,
                consultant, and other service-based professionals can focus on
                their passion and expertise, while BookMePro handles the
                complexity of scheduling, creating seamless interactions that
                elevate both client and professional experiences.
              </p>
            </div>
            <div className="md:col-span-4">
              <Image
                src="/images/about/vission.png"
                width={700}
                height={700}
                alt="Vision"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-4 sm:pb-20 sm:pt-8">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid items-center gap-8 rounded-[2rem] border border-[#d8e3d8] bg-[#fbfaf6] p-6 shadow-[0_20px_60px_rgba(16,49,31,0.07)] md:grid-cols-9 md:p-10">
            <div className="order-2 md:order-1 md:col-span-4">
              <Image
                src="/images/about/Mission.png"
                width={700}
                height={700}
                alt="Mission"
                className="h-auto w-full"
              />
            </div>
            <div className="order-1 md:order-2 md:col-span-5">
              <h2 className="text-3xl font-semibold text-[#143521] sm:text-4xl">
                Mission
              </h2>
              <p className="mt-5 text-base leading-8 text-[#365542] sm:text-lg">
                At BookMePro, our mission is to revolutionise appointment
                management by providing a streamlined, intuitive platform that
                enables professionals to manage their schedules with ease and
                efficiency. We aim to support growth and success for coaches,
                trainers, consultants, and other service providers by removing
                the barriers of time management, simplifying the booking
                process, and delivering a solution that adapts to the unique
                needs of their business.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#10311f_0%,#184e31_50%,#2d6a47_100%)] px-6 py-10 text-white shadow-[0_20px_60px_rgba(9,30,18,0.25)] sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                  Want to see how this fits your business model?
                </h3>
                <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
                  From coaching to consulting, BookMePro is designed to support
                  service businesses that depend on trust, clarity, and reliable
                  bookings.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#f2c66d] px-6 py-3 font-semibold text-[#163322] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Talk to our team
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
