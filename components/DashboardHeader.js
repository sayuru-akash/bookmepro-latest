// components/DashboardHeader.js
"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import UpgradeIcon from "@mui/icons-material/TrendingUp";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MobileMenu from "./MobileMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircleCheck } from "lucide-react";

export default function DashboardHeader() {
  const { data: session } = useSession();
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const [coachData, setCoachData] = React.useState(null);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const profileUrl = coachData ? `${BASE_URL}/coach/${coachData.id}` : "#";
  const displayUrl =
    coachData && coachData.username
      ? `${BASE_URL}/coach/${coachData.username}`
      : profileUrl;
  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    toast.success("Profile URL copied to clipboard!", {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: "light",
      icon: <CircleCheck color="#037D40" />,
    });
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  React.useEffect(() => {
    if (session?.user?.id) {
      setIsLoading(true);
      setError(null);

      axios
        .get(`/api/coach/${session.user.id}`)
        .then((response) => {
          if (!response.data) {
            throw new Error("No coach data received");
          }
          setCoachData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching coach data:", error);
          setError("Failed to load profile data");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section>
      <div
        className={`mx-auto px-10 fixed w-full border-b py-3 border-gray
           bg-white z-50`}
      >
        <div className="justify-between  items-center flex ">
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
          <MobileMenu session={session} /> {/* Mobile menu */}
          {coachData && (
            <div className="md:flex hidden mr-5 items-center ">
              <div className="flex  justify-end items-center gap-0">
                <div className="gap-5 flex  ">
                  <div className="flex justify-center items-center gap-2">
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        color: "black",
                        fontFamily: "Kanit, sans-serif",

                        fontSize: 14,
                      }}
                    >
                      Your Profile URL :
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "black",
                        wordBreak: "break-word",

                        fontSize: 14,
                      }}
                    >
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "underline",
                          color: "#036b34",
                          fontFamily: "Kanit, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        {`${
                          coachData?.username || coachData?.firstName
                        }'s Profile`}
                      </a>
                    </Typography>
                  </div>

                  <div className="justify-end flex gap-3">
                    <Button
                      size="small"
                      sx={{
                        bgcolor: "#036b34",
                        color: "white",
                        justify: "end",
                        fontFamily: "Kanit, sans-serif",
                        "&:hover": { bgcolor: "#025a2b" },
                      }}
                      startIcon={<FileCopyIcon />}
                      onClick={handleCopy}
                    >
                      Copy Link
                    </Button>

                    <Link href="/dashboard/upgrade-plan" passHref>
                      <Button
                        size="small"
                        sx={{
                          bgcolor: "#036b34",
                          color: "white",
                          justify: "end",
                          fontFamily: "Kanit, sans-serif",
                          "&:hover": { bgcolor: "#025a2b" },
                        }}
                        startIcon={<UpgradeIcon />}
                      >
                        Upgrade
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </section>
  );
}
