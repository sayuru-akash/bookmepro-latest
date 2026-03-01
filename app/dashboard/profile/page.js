"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import axios from "axios";
import dynamic from "next/dynamic";
import AppTheme from "../../../app/shared-theme/AppTheme";
import DashboardHeader from "../../../components/DashboardHeader";
import SideMenu from "../../../components/SideMenu";
import Box from "@mui/material/Box";
import { SquarePen, Upload } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircleCheck } from "lucide-react";
import * as React from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Dynamically import components that use browser APIs
const DynamicToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false },
);

const ProfileEditComponent = () => {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [coachData, setCoachData] = React.useState({
    gallery: [], // Initialize gallery as an empty array
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN;
  const { status } = useSession();
  const [isAvailable, setIsAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isVideoLinkValid, setIsVideoLinkValid] = useState(false);
  // Track the username that was last saved to DB so we can skip re-checking it
  const originalUsername = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const validateForm = useCallback(() => {
    return coachData?.firstName && coachData?.lastName;
  }, [coachData]);

  const handleProfilePhotoChange = (e) => {
    if (!isClient) return;
    const file = e.target.files[0];
    if (file) {
      // Check file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Profile photo must be less than 5MB");
        return;
      }

      // Check file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
        );
        return;
      }
      setProfilePhoto(file);
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      // Update coachData to show preview immediately
      setCoachData((prev) => ({
        ...prev,
        profilePhoto: previewUrl,
      }));
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto(null);
    setPreviewImage(null);
    setCoachData((prev) => ({
      ...prev,
      profilePhoto: null,
    }));
  };

  const MAX_GALLERY_IMAGES = 3; // Set maximum gallery images to 3

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to an array

    const totalImages =
      (coachData?.gallery?.length || 0) + newGalleryImages.length;

    if (files.length + totalImages > MAX_GALLERY_IMAGES) {
      toast.error(`Maximum ${MAX_GALLERY_IMAGES} images allowed in gallery`);
      return;
    }

    // Validate each file
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds the 5MB size limit`);
        return false;
      }

      // Validate image type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(`Image ${file.name} must be JPEG, PNG, GIF, or WebP`);
        return false;
      }

      return true;
    });
    // Append valid files to newGalleryImages
    setNewGalleryImages((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveGalleryImage = (index) => {
    const updatedGallery = [...(coachData.gallery || [])];
    updatedGallery.splice(index, 1);
    setCoachData({
      ...coachData,
      gallery: updatedGallery,
    });
  };

  const handleRemoveNewImage = (index) => {
    const updatedImages = [...newGalleryImages];
    updatedImages.splice(index, 1);
    setNewGalleryImages(updatedImages);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.trim();

    if (value.includes(" ")) {
      setUsernameError("Username cannot contain spaces");
    } else if (value.length < 1) {
      setUsernameError("Username cannot be empty");
    } else {
      setUsernameError(""); // Clear error if valid
    }

    setCoachData((prev) => ({ ...prev, username: value }));
  };

  const validatePhone = (phone) => {
    if (!phone) {
      setPhoneError("Phone number is required");
      setIsPhoneValid(false);
      return false;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        setPhoneError("Please enter a valid phone number");
        setIsPhoneValid(false);
        return false;
      }

      setPhoneError("");
      setIsPhoneValid(true);
      return true;
    } catch (error) {
      setPhoneError("Invalid phone number format");
      setIsPhoneValid(false);
      return false;
    }
  };

  const handlePhoneChange = (value) => {
    setCoachData((prev) => ({
      ...prev,
      displayContact: value,
    }));
    validatePhone(value);
  };

  const validateVideoLink = (link) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (youtubeRegex.test(link)) {
      setIsVideoLinkValid(true);
      setStatusMessage("");
    } else {
      setIsVideoLinkValid(false);
      setStatusMessage("Please enter a valid YouTube link");
    }
  };
  const handleVideoLinkChange = (e) => {
    const value = e.target.value.trim();
    validateVideoLink(value);

    setCoachData((prev) => ({ ...prev, videoLink: value }));
    if (value.length > 0 && !isVideoLinkValid) {
      setStatusMessage("Please enter a valid YouTube link");
    } else {
      setStatusMessage("");
    }
  };

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      const username = coachData?.username;

      // Skip check if username is empty or invalid
      if (!username || username.length < 3 || usernameError) {
        setIsAvailable(null);
        return;
      }

      // Skip check if username matches the one already saved in DB (fetched on mount)
      if (username === originalUsername.current) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      try {
        const response = await axios.get(
          `/api/coach/check-username?username=${username}`,
        );
        setIsAvailable(response.data.available);
      } catch (error) {
        console.error("Username check failed", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [coachData?.username, usernameError]);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (session?.user?.id) {
        try {
          const response = await axios.get(`/api/coach/${session.user.id}`);
          const userData = response.data;

          // Transform data to match expected format
          const transformedData = {
            ...userData,
            profilePhoto:
              userData.profilePhoto ||
              userData.image ||
              "/images/coach/defaultprofile.jpg",
            gallery: Array.isArray(userData.gallery) ? userData.gallery : [],
            username: userData.username ?? null,
            hourlyRate: userData.hourlyRate ?? null,
            displayContact: userData.displayContact ?? null,
            displayEmail: userData.displayEmail ?? null,
            location: userData.location ?? null,
            videoLink: userData.videoLink ?? null,
            description: userData.description ?? null,
          };

          setCoachData(transformedData);
          // Store original username so we can skip the availability check when it hasn't changed
          originalUsername.current = transformedData.username ?? null;
        } catch (error) {
          console.error("Error fetching coach data:", error);
          // toast.error("Failed to load profile data");
        }
      }
    };

    fetchCoachData();
  }, [session?.user?.id]);

  if (!coachData) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCoachData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validate username only when it has actually changed from the saved DB value
    const usernameChanged =
      coachData.username && coachData.username !== originalUsername.current;
    if (usernameChanged) {
      if (usernameError) {
        toast.error("Please fix username errors before submitting");
        return;
      }

      if (isAvailable === false) {
        toast.error("Please choose an available username");
        return;
      }

      if (isAvailable === null) {
        toast.error("Please wait for username availability check");
        return;
      }
    }

    try {
      const formData = new FormData();
      const coachId = session?.user?.id;

      if (!coachId) {
        toast.error("User session not found");
        return;
      }

      formData.append("firstName", coachData.firstName || "");
      formData.append("lastName", coachData.lastName || "");
      formData.append("displayEmail", coachData.displayEmail || "");

      // Always append username — use the existing one if unchanged, or the new one if changed
      if (coachData.username) {
        formData.append("username", coachData.username);
      }

      // Append profile photo
      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      } else if (coachData?.profilePhoto === null) {
        formData.append("removeProfilePhoto", "true");
      }

      // Append new gallery images
      newGalleryImages.forEach((image) => {
        formData.append("gallery", image);
      });

      // Append existing gallery
      if (coachData?.gallery) {
        formData.append("existingGallery", JSON.stringify(coachData.gallery));
      }

      // Always append optional fields — sending empty string is intentional (user cleared the field)
      formData.append("displayContact", coachData.displayContact || "");
      formData.append("location", coachData.location || "");
      formData.append("description", coachData.description || "");
      formData.append("videoLink", coachData.videoLink || "");
      formData.append(
        "hourlyRate",
        coachData.hourlyRate != null ? String(coachData.hourlyRate) : "",
      );

      const response = await axios.post(
        `/api/coach/update?coachId=${coachId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.status === 200) {
        toast.success("Profile updated successfully!", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          theme: "light",
          icon: <CircleCheck color="#037D40" />,
        });

        // Clear temporary states
        setNewGalleryImages([]);
        setProfilePhoto(null);
        setPreviewImage(null);

        // Fetch updated data and sync the original username ref
        const updatedData = await axios.get(`/api/coach/${coachId}`);
        setCoachData(updatedData.data);
        originalUsername.current = updatedData.data.username ?? null;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: "light",
      });
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col justify-center items-center">
          <div className="w-16 h-16 border-4 border-t-primary border-gray-300 rounded-full animate-spin"></div>
          <div className="mt-4 text-primary text-xl font-semibold">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <div className="h-full w-full m-0 p-0">
        {/* Top Header */}
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            paddingTop: "25px",
            paddingLeft: "20px",
            paddingRight: "20px",
            height: "82px",
            zIndex: 10,
            backgroundColor: "white",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <DashboardHeader />
        </Box>

        {/* Sidebar */}
        <Box
          sx={{
            width: "250px",
            position: "fixed",
            top: "92px",
            left: 0,
            bottom: 0,
            overflowY: "auto",
            zIndex: 5,
            backgroundColor: "#f4f4f4",
            borderRight: "1px solid #ddd",
          }}
        >
          <SideMenu session={session} />
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            paddingLeft: { md: "400px" },
            paddingTop: "20px",
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {/* form */}
          <div className="w-full h-auto  rounded-[5px] pt-40 sm:pt-32 px-4 sm:px-0">
            <form
              onSubmit={handleUpdate}
              className="p-4 max-w-full sm:max-w-lg  pb-10 "
            >
              <h2 className=" font-bold text-[22px] landing-[26.4px] text-[#037D40] mb-4">
                Profile Details
              </h2>
              {statusMessage && <p className="mb-4">{statusMessage}</p>}

              {/* Profile Photo Upload */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-40">
                <div className="flex flex-col items-center mb-4">
                  <label className="font-normal text-[22px] pb-[15px]">
                    Profile Photo
                  </label>

                  <div
                    className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[#E6F2EC] flex justify-center items-center"
                    style={{
                      backgroundImage: `url(${
                        previewImage || coachData?.profilePhoto
                      })`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <input
                      type="file"
                      onChange={handleProfilePhotoChange}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {!previewImage && !coachData?.profilePhoto && (
                      <SquarePen className="text-primary text-3xl sm:text-4xl absolute" />
                    )}
                  </div>

                  {/* Remove button - only show if there's a photo */}
                  {(previewImage || coachData?.profilePhoto) && (
                    <button
                      onClick={handleRemoveProfilePhoto}
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transform translate-x-1/2 -translate-y-1/2"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Gallery Upload Section */}
                <div className="flex flex-col mb-4">
                  <label className="font-normal text-[22px] pb-[15px]">
                    Gallery (Max {MAX_GALLERY_IMAGES} images)
                  </label>
                  <div className="flex gap-4 mb-4 ">
                    {/* Display existing images */}
                    {Array.isArray(coachData?.gallery) &&
                      coachData.gallery.length > 0 &&
                      coachData.gallery.map((imageUrl, index) => (
                        <div
                          key={`existing-${index}`}
                          className="relative flex flex-col items-center"
                        >
                          <div
                            className="w-24 h-24 sm:w-32 sm:h-32 bg-[#E6F2EC] flex justify-center items-center overflow-hidden rounded"
                            style={{
                              backgroundImage: `url(${imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            <button
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                          {index === 0 && (
                            <span className="text-primary text-xs sm:text-sm mt-1">
                              Primary Image
                            </span>
                          )}
                        </div>
                      ))}

                    {/* Display new images */}
                    {newGalleryImages.map((image, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative flex flex-col items-center"
                      >
                        <div
                          className="w-24 h-24 sm:w-32 sm:h-32 bg-[#E6F2EC] flex justify-center items-center overflow-hidden rounded"
                          style={{
                            backgroundImage: `url(${URL.createObjectURL(
                              image,
                            )})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <button
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Upload button - show if total images is less than max */}
                    {(coachData?.gallery?.length || 0) +
                      newGalleryImages.length <
                      MAX_GALLERY_IMAGES && (
                      <label className="w-24 h-24 sm:w-32 sm:h-32 bg-[#E6F2EC] flex justify-center items-center cursor-pointer rounded">
                        <Upload className="text-primary text-3xl sm:text-4xl" />
                        <input
                          type="file"
                          onChange={handleGalleryChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-5 text-[18px] font-normal">
                <div className="flex flex-col gap-[20px]">
                  <label>First Name</label>
                  <input
                    className="w-full lg:w-[300px] xl:w-[460px] 2xl:w-[560px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] px-3"
                    type="text"
                    name="firstName"
                    value={coachData?.firstName || ""}
                    onChange={handleChange}
                    placeholder="First Name"
                  />
                </div>

                <div className="flex flex-col gap-[20px]">
                  <label>Last Name</label>
                  <input
                    className="w-full lg:w-[300px] xl:w-[460px] 2xl:w-[560px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] px-3"
                    type="text"
                    name="lastName"
                    value={coachData?.lastName || ""}
                    onChange={handleChange}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-5 text-[18px] font-normal">
                <div className="flex flex-col gap-[20px]">
                  <label>Email</label>
                  <input
                    className="w-full lg:w-[300px] xl:w-[460px] 2xl:w-[560px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] px-3"
                    type="email"
                    name="displayEmail"
                    value={coachData?.displayEmail || ""}
                    onChange={handleChange}
                    placeholder="Email"
                  />
                </div>

                <div className="flex flex-col gap-[20px]">
                  <label>Contact Number</label>
                  <PhoneInput
                    international
                    value={coachData?.displayContact || ""}
                    onChange={handlePhoneChange}
                    defaultCountry="au"
                    placeholder="Enter your phone number"
                    className={`w-full lg:w-[300px] xl:w-[460px] 2xl:w-[560px] rounded-[5px] border padding-[20px] border-[#B0B6D3] px-3 ${
                      phoneError
                        ? "border-red-500"
                        : isPhoneValid
                          ? "border-[#037D40]"
                          : "border-[#B0B6D3]"
                    }`}
                    inputStyle={{
                      backgroundColor: "#fff",
                      width: "100%",
                      height: "60px",
                      border: "none",
                      fontSize: "18px",
                      paddingLeft: "8px",
                    }}
                    buttonStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                    }}
                    style={{
                      "--react-international-phone-border-radius": "0.5rem",
                      "--react-international-phone-border-color": "transparent",
                      "--react-international-phone-background-color": "#fff",
                      "--react-international-phone-height": "60px",
                    }}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm">{phoneError}</p>
                  )}
                </div>
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>Username</label>
                <div className="relative">
                  <input
                    className={`w-full lg:w-[628px] xl:w-[944px] 2xl:w-[1144px] h-[60px] rounded-[5px] border padding-[20px] 
                      ${
                        isAvailable === false
                          ? "border-red-500"
                          : isAvailable === true
                            ? "border-green-500"
                            : "border-[#B0B6D3]"
                      } px-3`}
                    type="text"
                    name="username"
                    value={coachData?.username || ""}
                    onChange={handleUsernameChange}
                    placeholder="Choose a username"
                  />
                  {isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-t-primary border-gray-300 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!isChecking && isAvailable === true && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <CircleCheck size={20} />
                    </div>
                  )}
                  {!isChecking && isAvailable === false && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {usernameError && (
                  <p className="text-red-500 text-sm">{usernameError}</p>
                )}
                {isChecking && (
                  <p className="text-sm text-gray-500">
                    Checking availability...
                  </p>
                )}
                {!isChecking && isAvailable === true && (
                  <p className="text-sm text-green-500">
                    Username is available!
                  </p>
                )}
                {!isChecking && isAvailable === false && (
                  <p className="text-sm text-red-500">
                    Username is already taken.
                  </p>
                )}
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px] ">
                <label>Location</label>
                <input
                  className="w-full lg:w-[628px] xl:w-[944px] 2xl:w-[1144px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] text-[#B2B2B2] px-3"
                  type="text"
                  name="location"
                  value={coachData?.location || ""}
                  onChange={handleChange}
                  placeholder="Location"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>Description</label>
                <textarea
                  className="w-full lg:w-[628px] xl:w-[944px] 2xl:w-[1144px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] text-[#B2B2B2] px-3"
                  name="description"
                  value={coachData?.description || ""}
                  onChange={handleChange}
                  placeholder="Description"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>
                  Video Link (Please enter a valid YouTube video link)
                </label>
                <input
                  className="w-full lg:w-[628px] xl:w-[944px] 2xl:w-[1144px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] text-[#B2B2B2] px-3"
                  type="text"
                  name="videoLink"
                  value={coachData?.videoLink || ""}
                  onChange={handleVideoLinkChange}
                  placeholder="Video Link"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>Hourly Rate</label>
                <input
                  className="w-full lg:w-[628px] xl:w-[944px] 2xl:w-[1144px] h-[60px] rounded-[5px] border padding-[20px] border-[#B0B6D3] text-[#B2B2B2] px-3"
                  type="number"
                  name="hourlyRate"
                  value={coachData?.hourlyRate || ""}
                  onChange={handleChange}
                  placeholder="Hourly Rate"
                />
              </div>

              <button
                type="submit"
                className="bg-primary w-[90px] h-[34px] pt-[8px] pl-[20px] pr-[20px] pb-[8px] rounded mt-4  text-white"
              >
                Update
              </button>
            </form>
            <DynamicToastContainer />
          </div>
        </Box>
      </div>
    </AppTheme>
  );
};
export default dynamic(() => Promise.resolve(ProfileEditComponent), {
  ssr: false,
});
