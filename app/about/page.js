"use client";
import Image from "next/image";
import TeamMemberCard from "../../components/TeamMemberCard";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Header from "../../components/header";
import LoginForm from "../../components/LoginForm";

export default function About() {
  const { status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const teamMembers = [
    {
      name: "Guy Hawkins",
      quote:
        "We strive to challenge ourselves for a better tomorrow by creating meaningful designs that enrich lives and maintain lasting relevance.",
      image: "/images/about/teamMember.png",
    },
    // Add more team members here...
  ];

  // Define pricing plans
  const plans = [
    {
      name: "Starter",
      description: "For 1-25 Students",
      prices: {
        monthly: { amount: 10, label: "/mo" },
        quarterly: { amount: 25, label: "Quarterly" },
        yearly: { amount: 90, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=starter", // legacy link, now replaced by dynamic query params
    },
    {
      name: "Growth",
      description: "For 26-50 Students",
      prices: {
        monthly: { amount: 15, label: "/mo" },
        quarterly: { amount: 40, label: "Quarterly" },
        yearly: { amount: 120, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=growth",
    },
    {
      name: "Pro",
      description: "For 51-100 Students",
      prices: {
        monthly: { amount: 20, label: "/mo" },
        quarterly: { amount: 50, label: "Quarterly" },
        yearly: { amount: 150, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=pro",
    },
    {
      name: "Enterprise",
      description: "For 100+ Students",
      prices: {
        monthly: { amount: 25, label: "/mo" },
        quarterly: { amount: 60, label: "Quarterly" },
        yearly: { amount: 200, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=enterprise",
    },
  ];

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="flex flex-col justify-center items-center">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-t-primary border-gray-300 rounded-full animate-spin"></div>
          <div className="mt-4 text-primary text-xl font-semibold">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header openPlanModal={() => setPlanModalOpen(true)} />
      <section>
        <div className="flex items-center pt-40 h-full">
          <div className="container text-center mx-auto px-10 md:px-20">
            <h1 className="text-black font-bold text-3xl md:text-5xl">
              Booking Your Coaching Sessions{" "}
            </h1>
            <h1 className="mt-4 font-bold text-black text-3xl md:text-5xl">
              Just Got Easier
            </h1>
            <p className="text-black font-light mx-auto max-w-3xl md:max-w-5xl mt-6 md:mt-9 text-lg md:text-2xl">
              Effortlessly schedule and manage your coaching sessions with a
              seamless, hassle-free booking experience. Clients can book their
              sessions in just a few clicks, keeping your calendar organised and
              accessible.
            </p>
          </div>
        </div>
      </section>
      <section>
        <div className="container pb-12 md:pb-20 text-center mx-auto px-10 md:px-20">
          <div className="flex justify-center mt-8 md:mt-16 items-center">
            <div className="grid items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
              <div className="col-span-1 flex flex-col gap-4">
                <Image
                  src="/images/about/SilderCol31.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 1"
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-4">
                <Image
                  src="/images/about/SilderCol21.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 2"
                  className="rounded-lg object-cover"
                />
                <Image
                  src="/images/about/SilderCol22.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 3"
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="col-span-1">
                <Image
                  src="/images/about/SliderMain.png"
                  width={1000}
                  height={600}
                  layout="responsive"
                  alt="Main Image"
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-4">
                <Image
                  src="/images/about/SilderCol23.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 4"
                  className="rounded-lg object-cover"
                />
                <Image
                  src="/images/about/SilderCol24.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 5"
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-4">
                <Image
                  src="/images/about/SilderCol32.png"
                  width={500}
                  height={300}
                  layout="responsive"
                  alt="Image 6"
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="container pt-12 md:pt-24 mx-auto px-10 md:px-20">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-5 items-center">
            <div className="md:col-span-5">
              <h2 className="text-2xl md:text-4xl font-bold text-black">
                Vision
              </h2>
              <p className="text-black mt-4 md:mt-6 max-w-3xl md:max-w-7xl font-light text-base md:text-2xl">
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
                width={50}
                height={100}
                layout="responsive"
                alt="Vision"
              />
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="container py-12 md:py-24 mx-auto px-10 md:px-20">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-5 items-center">
            <div className="md:col-span-4">
              <Image
                src="/images/about/Mission.png"
                width={50}
                height={100}
                layout="responsive"
                alt="Mission"
              />
            </div>
            <div className="md:col-span-5">
              <h2 className="text-2xl md:text-4xl font-bold text-black">
                Mission
              </h2>
              <p className="text-black mt-4 md:mt-6 max-w-3xl md:max-w-7xl font-light text-base md:text-2xl">
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
    </>
  );
}
