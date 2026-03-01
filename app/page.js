//app/page.js
"use client";
import Image from "next/image";
import TestimonialSlider from "../components/TestimonialSlider.js";
import { useEffect, useRef } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Pricing from "../components/Pricing.js";

export default function Home() {
  const hasScrolled = useRef(false); // Create a ref to track if the user has clicked to scroll
  const [isMobile, setIsMobile] = useState(false);
  const { status } = useSession();
  const scrollToNextSection = () => {
    const nextSection = document.getElementById("hi");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
      hasScrolled.current = true; // Set to true when user clicks to scroll
    }
  };


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <section>
        <div>
          <div className="h-screen ">
            <video
              className="object-cover h-full w-full absolute"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/homeHeader.mp4" />
            </video>
            <div className="relative h-full  bg-black/50">
              <div className="flex items-center  h-full">
                <div className="container text-center mx-auto px-10 md:px-20 ">
                  <div className="font-bold text-white text-[36px] lg:text-[54px]">
                    Manage Your Coaching
                  </div>
                  <div className="font-[275]  md:leading-[37.2px] text-white mx-auto max-w-4xl mt-4 lg:mt-9 text-[18px] md:text-[24px] lg:text-[31px]">
                    Transform your coaching experience with our all-in-one
                    platform. Seamlessly manage your schedule, set your
                    locations, and showcase your profile to attract more
                    students.
                  </div>
                  <div className="font-[400] text-white mx-auto max-w-4xl mt-4 lg:mt-9   text-[18px] md:text-[24px] lg:text-[31px] pb-4">
                    Get started today and simplify your coaching process.
                  </div>
                  <a
                    href="#pricing"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("pricing").scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="bg-primary font-normal mt-4 lg:mt-9 rounded-[16px] text-white text-[16px] md:text-[18px] lg:text-[26px] py-3 px-5"
                  >
                    Create Your Free Coach Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mt-10 text-center pb-32 container mx-auto px-10 md:px-20 ">
          <div className="text-[26px] md:text-[37px] text-primary font-bold">
            Empowering Coaches to Focus on Coaching, Not Admin Work
          </div>
          <div className="font-normal mt-4 text-[22px] text-primary">
            Scroll Down
          </div>
          <div>
            <div className="w-full mt-4 flex items-center justify-center">
              <div
                className="w-6 cursor-pointer "
                onClick={scrollToNextSection}
              >
                <ChevronsUpDown
                  width={24}
                  height={24}
                  style={{ color: "#037D40" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-32 mx-auto px-10 md:px-20 ">
          <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <div>
              <div className="w-full ">
                <Image
                  src="/images/home/soccer.png"
                  width={1000}
                  height={500}
                  layout="responsive"
                  alt="soccer"
                />
              </div>
            </div>
            <div className="">
              <div className="text-black font-normal text-[37px] leading-[44.4px] mx-auto max-w-2xl text-center">
                Our mission is to earn coaches&apos; trust by helping them
                effortlessly manage their schedules and connect with both
                existing and new students. Join us and watch your coaching
                business thrive!.
              </div>
              <div className="flex justify-center mt-16">
                <Link
                  href="auth/signup"
                  className="bg-primary  rounded-xl font-normal  text-2xl text-white py-4 px-8 "
                >
                  Join with Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-32 mx-auto px-10 md:px-20">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="order-1 lg:order-2">
              <div className="w-full">
                <Image
                  src="/images/home/unsplash.png"
                  width={1000}
                  height={500}
                  layout="responsive"
                  alt="soccer"
                />
              </div>
            </div>

            <div className="order-2 lg:order-1 text-center lg:text-left">
              <div className="text-black font-bold text-[37px]">
                Why Choose Us?
              </div>
              <div className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275] mt-12">
                As a coach, your time is valuable, and your expertise deserves
                to be showcased. Our platform is designed with you in mind,
                providing the tools you need to manage your coaching business
                effortlessly. With our intuitive interface, you can focus on
                what you do best – coaching – while we take care of the rest.
                Here&apos;s why thousands of coaches are choosing us to elevate
                their coaching careers:
              </div>
              <div className="mt-8 text-left">
                <ul className="list-disc text-left list-inside">
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275]">
                    <span className="font-normal">Simplified Scheduling:</span>{" "}
                    Effortlessly manage your coaching schedule and update your
                    availability in real-time.
                  </li>
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275]">
                    <span className="font-normal">Location Flexibility:</span>{" "}
                    Set and manage multiple coaching locations with ease, making
                    it simple for students to find and book you.This feature is
                    under development and will be available soon.
                  </li>
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275]">
                    <span className="font-normal">Boost Your Visibility:</span>{" "}
                    Create a detailed coach profile that showcases your
                    expertise, making it easier for students to discover and
                    book your services.
                  </li>
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275]">
                    <span className="font-normal">
                      Showcase Your Own Booking Link:
                    </span>{" "}
                    Share your unique booking link with students, allowing them
                    to book sessions directly. You can share your own custom
                    profile link with students via social media, website, etc.,
                    making it easy for them to find and book you.
                  </li>
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275]">
                    <span className="font-normal">
                      Full Refund Guarantee - No Questions Asked:
                    </span>{" "}
                    We offer a 100% refund for any unused portion of your fees.
                    If you decide not to use our services, you&apos;re entitled
                    to a refund without needing to provide any reason.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container pb-32 mx-auto px-10 md:px-20 ">
          <div className="grid items-center gap-20 grid-cols-1 lg:grid-cols-2">
            <div className={isMobile ? "order-2" : "order-1"}>
              <div className="w-full ">
                <Image
                  src="/images/home/basket_ball.png"
                  width={1000}
                  height={500}
                  layout="responsive"
                  alt="soccer"
                />
              </div>
            </div>
            <div className={isMobile ? "order-2 mb-8" : "order-1"}>
              <div className="text-[37px] font-bold text-black leading-[44.4px] text-center lg:text-left ">
                Platform Features Tailored for Coaches
              </div>
              <div className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275] mt-12">
                Our platform is packed with features that cater specifically to
                the needs of coaches and their students. Whether you are
                managing multiple locations or ensuring seamless communication
                with your players, weve got everything you need in one place.
                Explore the tools that will revolutionize how you manage your
                coaching business:
              </div>
              <div className="mt-8">
                <ul className="list-disc list-inside ">
                  <li className="text-black  text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      {" "}
                      Customisable Coaching Profiles:
                    </span>{" "}
                    Highlight your skills, certifications, and experience.
                  </li>
                  <li className="text-black  text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      Real-Time Booking System:
                    </span>{" "}
                    Students can see your availability and book sessions
                    instantly.
                  </li>
                  <li className="text-black  text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      {" "}
                      Location Management:
                    </span>{" "}
                    Add and manage different coaching locations from a single
                    dashboard.
                  </li>
                  <li className="text-black text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      Automated Reminders:
                    </span>{" "}
                    Ensure both you and your students never miss a session. This
                    feature is under development and will be available soon.
                  </li>
                  <li className="text-black  text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      Own Dedicated Page with a Customisable URL:{" "}
                    </span>
                    Create a unique page that showcases your coaching services,
                    making it easy for students to find and book you.
                  </li>
                  {/* <li className="text-black  text-lg md:text-[26px] leading-[31.2px] font-[275] ">
                    <span className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal">
                      Payment Integration:{" "}
                    </span>
                    Secure and straightforward payment processing within the
                    platform.
                  </li> */}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <>
        <style jsx global>{`
          @media (max-width: 1023px) {
            .mobile-reverse {
              display: flex;
              flex-direction: column-reverse;
            }
          }
        `}</style>

        {/* Proven Success Section */}
        <section className="hidden">
          <div className="container pb-10 mx-auto px-10 md:px-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              {/* Text Section */}
              <div className="order-2 lg:order-1">
                <div className="text-[37px] font-bold text-black leading-[44.4px] text-center lg:text-left">
                  Proven Success for Coaches Like You
                </div>
                <div className="pl-3 mt-8 space-y-3">
                  <div className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal tracking-widest">
                    98% of coaches report improved scheduling efficiency.
                  </div>
                  <div className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal tracking-widest">
                    85% of coaches have seen an increase in student bookings
                    within the first month.
                  </div>
                  <div className="text-black text-lg md:text-[26px] leading-[31.2px] font-normal tracking-widest">
                    Attend the session and enjoy the experience.
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="w-full lg:w-3/4">
                  <Image
                    src="/images/home/search.png"
                    width={1000}
                    height={500}
                    layout="responsive"
                    alt="Basket ball"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container pb-32 mx-auto px-10 md:px-20 ">
            <Pricing/>
          </div>
        </section>

        <section id="hi" className="hidden">
          <div className="container mb-24 md:mb-0  mx-auto px-10 md:px-20 ">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div className="flex w-full justify-center items-center">
                <div className="w-full  ">
                  <Image
                    src="/images/home/cricketer.png"
                    width={0}
                    height={0}
                    layout="responsive"
                    alt="soccer"
                  />
                </div>
              </div>
              <div className="">
                <div className="text-5xl font-bold text-black ">
                  Testimonials
                </div>
                <div className="mt-4">
                  <div className="w-1/6 ">
                    <Image
                      src="/images/home/ci_double-quotes-l.png"
                      width={0}
                      height={0}
                      layout="responsive"
                      alt="soccer"
                    />
                  </div>
                </div>
                <div className="pb-10">
                  <TestimonialSlider />
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    </>
  );
}
