//app/coach/[coachId]/page.js
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Calendar from "../../../components/Calendar";
import { useSession } from "next-auth/react";
import { YouTubeEmbed } from "@next/third-parties/google";

export default function CoachProfilePage() {
  const { coachId } = useParams();
  const [coach, setCoach] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const response = await axios.get(`/api/coach/${coachId}`);
        setCoach(response.data);
        setSelectedImage(response.data.gallery?.[0] || "/default-image.jpg");
      } catch (error) {
        console.error("Error loading coach data:", error);
        setError("Unable to load coach profile.");
      } finally {
        setLoading(false);
      }
    };

    if (coachId) {
      fetchCoachData();
    }
  }, [coachId]);

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

  if (error) return <p>{error}</p>;
  if (!coach) return <p>Coach not found.</p>;
  const profileImage = coach?.image ? `${coach.image}` : "/default-profile.png";

  // Function to extract YouTube video ID from various URL formats
  const extractYoutubeId = (url) => {
    if (!url) return null;
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = coach.videoLink ? extractYoutubeId(coach.videoLink) : null;

  return (
    <section>
      <div className="container pt-24 mx-auto px-10 md:px-20">
        <div className="grid py-24 justify-center gap-10 grid-cols-1 lg:grid-cols-2 items-center">
          <div>
            <div
              style={{
                backgroundImage: `url(${profileImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
              }}
            />
            <div className="text-[64px] text-black font-bold">
              {coach.firstName} {coach.lastName}
            </div>
            {coach.location && coach.location.trim() !== "" ? (
              <div className="text-[44px] font-normal text-black">
                {coach.location}
              </div>
            ) : null}

            {coach.hourlyRate &&
            coach.hourlyRate !== "0" &&
            coach.hourlyRate !== 0 ? (
              <div className="text-black font-semibold mt-2 text-[30px]">
                ${coach.hourlyRate} per hour
              </div>
            ) : null}
            <div className="flex lg:flex-row flex-col lg:gap-5 xl:gap-10 text-2xl text-black mt-2">
              {coach.contact && coach.contact.trim() !== "" ? (
                <p>Contact: {coach.contact} </p>
              ) : null}
              {coach.email && coach.email.trim() !== "" ? (
                <p>
                  Email:
                  <Link
                    href={`mailto:${coach.email || ""}`}
                    className="text-blue-600 underline"
                  >
                    {coach.email || "Not Provided"}
                  </Link>
                </p>
              ) : null}
            </div>
            <div className="flex mt-4 items-center mb-6 space-x-8">
              {session?.user?.role === "coach" ? (
                <div className="bg-red-100 text-black p-4 rounded-lg border-2 border-red-400 flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    You are currently logged in as a coach and unable to place a
                    booking.{" "}
                    <span className="font-semibold">
                      Please log out from your coach profile to place a booking.
                    </span>
                  </div>
                </div>
              ) : (
                <Calendar />
              )}
            </div>

            <div className="flex mt-4 items-center mb-6 space-x-8"></div>
          </div>
          <div>
            <div className="flex flex-col gap-4">
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="w-full"
                  style={{
                    backgroundImage: `url(${selectedImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: "400px",
                  }}
                  aria-label="Main coach image"
                />
              </div>
              <div className="flex flex-row gap-3">
                {Array.isArray(coach.gallery) && coach.gallery.length > 0 && (
                  <div className="flex flex-row gap-3">
                    {coach.gallery.map((img, index) => (
                      <div
                        key={index}
                        className={`rounded-[8px] cursor-pointer`}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          backgroundImage: `url(${img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          width: "100px",
                          height: "100px",
                          borderRadius: "8px",
                          border:
                            selectedImage === img
                              ? "4px solid #0066FF"
                              : "none",
                        }}
                        aria-label={`Gallery image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {coach.description && coach.description.trim() !== "" ? (
        <div className="container pb-24 mx-auto px-10 md:px-20">
          <div className="text-3xl text-black font-extrabold mb-6">
            Description
          </div>
          <div className="text-[26px] font-[275] mb-4 text-black">
            {coach.description}
          </div>
        </div>
      ) : null}
      {coach.videoLink && coach.videoLink.trim() !== "" ? (
        <div className="container pb-24 mx-auto px-10 md:px-20">
          <div className="text-3xl text-black font-extrabold mb-6">
            Video Introduction
          </div>
          <YouTubeEmbed videoid={videoId} height={400} />
        </div>
      ) : null}
    </section>
  );
}
