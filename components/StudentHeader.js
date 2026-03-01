// components/Header.js
"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";

export default function StudentHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const getActiveStyle = (linkPath) => {
    const isActive = pathname === linkPath;
    return isActive
      ? `border-b-2 ${linkPath === "/" ? "border-white" : "border-[#037D40]"}`
      : "";
  };

  return (
    <section>
      <div
        className={`${
          isHomePage && !menuOpen
            ? "bg-transparent absolute"
            : `${
                isScrolled
                  ? "bg-white/70 backdrop-blur-md shadow-md"
                  : "bg-white shadow-md"
              }`
        } w-full fixed top-0 z-10 transition duration-300 ease-in-out`}
      >
        <div className="container mx-auto px-6 md:px-20">
          <div className="flex justify-between items-center py-4">
            {/* Company Logo */}
            <div
              className={`text-3xl font-extrabold ${
                isHomePage ? "text-white" : "text-primary"
              }`}
            >
              <Link href="/">
                <div className="w-36 md:w-48">
                  <Image
                    src={
                      isHomePage
                        ? "/images/home/logo 2.png"
                        : "/images/home/logo 1.png"
                    }
                    width={1000}
                    height={500}
                    
                    alt="logo"
                  />
                </div>
              </Link>
            </div>

            {/* Hamburger Menu for Mobile */}
            <div className="lg:hidden">
              <button onClick={toggleMenu} aria-label="Toggle menu">
                {menuOpen ? (
                  <HiX className="text-3xl text-primary" />
                ) : (
                  <HiOutlineMenuAlt3 className="text-3xl text-primary" />
                )}
              </button>
            </div>

            {/* Navigation Links for Desktop */}
            <div
              className={`hidden lg:flex items-center gap-12 text-lg ${
                isHomePage ? "text-white" : "text-primary"
              }`}
            >
              <Link
                className={`text-xl font-normal ${getActiveStyle("/")}`}
                href="/"
              >
                Home
              </Link>
              <Link
                className={`text-xl font-normal ${getActiveStyle("/about")}`}
                href="/about"
              >
                About
              </Link>
              <Link
                className={`text-xl font-normal ${getActiveStyle("/contact")}`}
                href="/contact"
              >
                Contact
              </Link>

              { status === "loading" ? (
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
              ):session ? (
                <button className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded">
                  <div className="w-5">
                    <Image
                      src="/images/home/profile.png"
                      width={1000}
                      height={500}
                      
                      alt="profile"
                    />
                  </div>
                  <Link href="/dashboard/student">Dashboard</Link>
                </button>
              ) : (
                <Link 
                  href="/auth/student/signup"
                  className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                >
                  <div className="w-5">
                    <Image
                      src="/images/home/profile.png"
                      width={1000}
                      height={500}
                      
                      alt="profile"
                    />
                  </div>
                  <span className="text-xl font-normal">Login / Signup</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="flex flex-col items-center gap-6 text-lg mt-4 pb-4 lg:hidden text-primary">
              <Link
                href="/"
                onClick={toggleMenu}
                className={`text-xl font-normal ${getActiveStyle("/")}`}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={toggleMenu}
                className={`text-xl font-normal ${getActiveStyle("/about")}`}
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={toggleMenu}
                className={`text-xl font-normal ${getActiveStyle("/contact")}`}
              >
                Contact
              </Link>
              {status === "loading" ? (
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>

              ):session ? (
                <button
                  className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                  onClick={toggleMenu}
                >
                  <div className="w-5">
                    <Image
                      src="/images/home/profile.png"
                      width={1000}
                      height={500}
                      
                      alt="profile"
                    />
                  </div>
                  <Link href="/dashboard/student">Dashboard</Link>
                </button>
              ) : (
                <Link 
                  href="/auth/student/signup"
                  onClick={toggleMenu}
                  className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                >
                  <div className="w-5">
                    <Image
                      src="/images/home/profile.png"
                      width={1000}
                      height={500}
                      
                      alt="profile"
                    />
                  </div>
                  <span className="text-xl font-normal">Login / Signup</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}