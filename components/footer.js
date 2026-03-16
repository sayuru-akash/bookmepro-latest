import Link from "next/link";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import Image from "next/image";

export default function Footer() {
  return (
    <section>
      <div className="bg-footer z-10">
        <div className="container mx-auto px-4 sm:px-8 lg:px-20 py-6 sm:py-10">
          {/* Top Section */}
          <div className="flex flex-col  md:flex-row items-center justify-between mb-6 md:mb-10 gap-6 md:gap-0">
            {/* Logo and Navigation */}
            <div className="">
              {/* Logo */}
              <div className="flex justify-center md:justify-normal ">
                <div className="w-36  sm:w-40 lg:w-48">
                  <Link href="/">
                    <Image
                      src="/images/home/logo 2.png"
                      width={1000}
                      height={500}
                      
                      alt="logo"
                    />
                  </Link>
                </div>
              </div>
              {/* Navigation Links */}
              <div className="flex flex-wrap  text-sm sm:text-base md:text-lg lg:text-xl font-normal text-white mt-4 gap-4 sm:gap-6">
                <Link href="/" className="hover:text-gray-400">
                  Home
                </Link>
                <Link href="/about" className="hover:text-gray-400">
                  About
                </Link>
                {/* <Link href="/features" className="hover:text-gray-400">
                  Features
                </Link> */}
                <Link href="/contact" className="hover:text-gray-400">
                  Contact
                </Link>
              </div>
            </div>

            {/* Newsletter Section */}
            {/* <div className="text-center md:text-left">
              <div className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                Subscribe to the newsletter
              </div>
              <div className="mt-4">
                <SubscribeSection />
              </div>
            </div> */}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-400 mb-4 md:mb-6"></div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center font-light text-white text-xs sm:text-sm md:text-base lg:text-lg">
            {/* Left Side */}
            <div className="mb-4 sm:mb-0">
              © 2026 Rinash Global Booking. All rights reserved.
            </div>

            {/* Right Side - Social Media Icons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="https://facebook.com/bookmepro.au"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BookMePro Australia on Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f2c66d] hover:bg-[#f2c66d] hover:text-[#163322]"
              >
                <FaFacebookF className="h-4 w-4" />
              </a>
              {/* <a
                href="https://your-custom-link.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </a> */}
              <a
                href="https://facebook.com/bookmeprosl/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BookMePro Sri Lanka on Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f2c66d] hover:bg-[#f2c66d] hover:text-[#163322]"
              >
                <FaFacebookF className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/rizvi-wahid-3ba6b332/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BookMePro on LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f2c66d] hover:bg-[#f2c66d] hover:text-[#163322]"
              >
                <FaLinkedinIn className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
