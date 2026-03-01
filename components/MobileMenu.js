"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import MenuContent from "./MenuContent";
import Button from "@mui/material/Button";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import Typography from "@mui/material/Typography";
import * as React from "react";
import axios from "axios";
import { SquareArrowRight, LogOut, CircleCheck } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Box from "@mui/material/Box";
import Link from "next/link";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const [coachData, setCoachData] = React.useState(null);
  const toggleMenu = () => setOpen(!open);

  // Improved profile URL generation
  const profileUrl = coachData ? `${BASE_URL}/coach/${coachData.id}` : "#";

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
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

  React.useEffect(() => {
    if (session?.user?.id) {
      axios
        .get(`/api/coach/${session.user.id}`)
        .then((response) => setCoachData(response.data))
        .catch((error) => console.error("Error fetching coach data:", error));
    }
  }, [session?.user?.id]);

  const profileImage = coachData?.image
    ? `${coachData.image}`
    : "/default-profile.png";

  return (
    <div className="md:hidden">
      {/* Hamburger Icon */}
      <button onClick={toggleMenu} className="text-green-700 p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Menu */}
      {open && (
        <div className="fixed w-full inset-0 z-50 bg-white p-4 shadow-lg">
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 text-red-500"
          >
            Close
          </button>
          <div className="">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "10px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "5px",
                  mt: 2,
                }}
              >
                {/* Profile Image */}
                <div
                  style={{
                    backgroundImage: `url(${profileImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    width: "75px",
                    height: "75px",
                    borderRadius: "50%",
                  }}
                />

                {/* Name and Details */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      width: "147px",
                      textAlign: "center",
                      fontFamily: "Kanit, sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "black",
                      mt: 1,
                    }}
                  >
                    {coachData?.firstName}
                  </Typography>
                </Box>

                {/* Edit Profile Button */}
                <Button
                  component={Link}
                  href="/dashboard/profile"
                  sx={{
                    mt: 1,
                    paddingY: 2,
                    paddingX: 4,
                    gap: "10px",
                    borderRadius: "5px",
                    bgcolor: "#037D40",
                    color: "white",
                    display: "flex",
                    fontSize: "14px",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Kanit, sans-serif",
                    "&:hover": { bgcolor: "#036b34" },
                  }}
                  size="medium"
                >
                  Edit Profile
                  <SquareArrowRight sx={{ color: "white", fill: "white" }} />
                </Button>
              </Box>
            </div>

            <div className="bg-secondary p-3 w-full">
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "black",
                  fontFamily: "Kanit, sans-serif",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 14,
                  display: "flex",
                  textAlign: "center",
                }}
              >
                Your Profile URL
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "black",
                  wordBreak: "break-word",
                  marginTop: 1,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {coachData && (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "underline",
                      color: "#036b34",
                      fontFamily: "Kanit, sans-serif",
                      fontWeight: "bold",
                    }}
                  >
                    {`${coachData?.firstName}'s Profile`}
                  </a>
                )}
              </Typography>
              {coachData && (
                <div className="items-center mt-2 justify-center flex">
                  <Button
                    size="small"
                    sx={{
                      bgcolor: "#036b34",
                      color: "white",
                      justify: "end",
                      fontFamily: "Kanit, sans-serif",
                      "&:hover": { bgcolor: "#036b34" },
                    }}
                    startIcon={<FileCopyIcon />}
                    onClick={handleCopy}
                  >
                    Copy Link
                  </Button>
                </div>
              )}
            </div>
          </div>
          <MenuContent session={session} />
          <div className="flex justify-center pl-2 items-center">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hover:text-white text-primary bg-secondary px-10 rounded-md py-3 hover:bg-green-700 font-bold mt-1 md:mt-4"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
