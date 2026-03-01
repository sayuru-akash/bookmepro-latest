"use client";
import Link from "next/link";
import Image from "next/image";

export default function StudentDashboardHeader() {
  return (
    <section>
      <div
        className={`mx-auto px-10 fixed w-full border-b py-3 border-gray bg-white z-50`}
      >
        <div className="justify-between items-center flex">
          {/* Company Logo */}
          <div>
            <Link href="/">
              <div className="w-32">
                <Image
                  src="/images/home/logo 1.png"
                  width={230.05}
                  height={64}
                  
                  alt="logo"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}