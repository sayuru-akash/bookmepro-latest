"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HomeIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { PhoneIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/solid';


const pages = [
  { name: "Home", id: "/", icon: <HomeIcon className="w-5 h-5 mr-2" />  },
  { name: "About", id: "/about", icon: <InformationCircleIcon className="w-5 h-5 mr-2" />  },
  { name: "Contact", id: "/contact", id: "/contact", icon: <PhoneIcon className="w-5 h-5 mr-2" />  },
  { name: "Dashboard", id: "/dashboard", id: "/dashboard", icon: <UserCircleIcon className="w-5 h-5 mr-2" />  },
];

const Nav = () => {
  const [open, setOpen] = useState(false);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleDrawer(true)}
        className="text-green-600 md:hidden absolute left-0 top-1/2 -translate-y-1/2"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex justify-end p-4">
            <button 
              onClick={toggleDrawer(false)} 
              className="text-green-600"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          <NavList isMobile={true} />
        </div>
      )}

      {/* Desktop Navigation */}
      <NavList isMobile={false} />
    </>
  );
};

const NavList = ({ isMobile }) => {
  const navClasses = isMobile 
    ? "flex flex-col items-center space-y-4 text-2xl" 
    : "hidden md:flex space-x-4 items-center";

  return (
    <nav className={navClasses}>
      {pages.map((page) => (
        <Link 
          key={page.id} 
          href={page.id}
          className="text-green-600 hover:text-green-800 transition-colors duration-300  flex items-center"
        >
          {page.icon}
          <span className="ml-2">{page.name}</span>
        </Link>
      ))}
    </nav>
  );
};

const MobileHeader = () => {
  return (
    <header className="fixed w-full bg-white text-green-600 shadow-md z-40">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          <Nav />
          
          {/* Logo - Centered and Optimized */}
          <Link 
            href="/" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <Image 
              src="/images/home/logo 2.png" 
              alt="logo" 
              width={160} 
              height={40}
              priority
              className="object-contain max-w-full max-h-full"
            />
          </Link>

          {/* Add a subtle decorative element to fill empty space */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            {/* You can add a small icon, notification, or action button here */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-green-600 opacity-50" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" 
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;