"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CssBaseline from "@mui/material/CssBaseline";
import axios from "axios";
import AppTheme from "../../app/shared-theme/AppTheme";
import DashboardHeader from "../../components/DashboardHeader";
import SideMenu from "../../components/SideMenu";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PhotoCamera } from "@mui/icons-material";
import { SquarePen, Upload, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const ProfileEditComponent = ({ onUpdateSuccess }) => {
  const { data: session, update } = useSession();

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [existingGallery, setExistingGallery] = useState(
    session?.user?.gallery || [],
  );
  const [firstName, setFirstName] = useState(session?.user?.firstName || "");
  const [lastName, setLastName] = useState(session?.user?.lastName || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [username, setUsername] = useState(session?.user?.username || "");
  const [contact, setContact] = useState(session?.user?.contact || "");
  const [location, setLocation] = useState(session?.user?.location || "");
  const [description, setDescription] = useState(
    session?.user?.description || "",
  );
  const [hourlyRate, setHourlyRate] = useState(session?.user?.hourlyRate || "");
  const [statusMessage, setStatusMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(
    session?.user?.profilePhoto || null,
  );
  const [editability, setEditability] = useState({
    firstName: !session?.user?.firstName,
    lastName: !session?.user?.lastName,
    email: !session?.user?.email,
  });

  // Generate unique username
  const generateUsername = (firstName, lastName) => {
    const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z]/g, "");
    const sanitizedLast = lastName.toLowerCase().replace(/[^a-z]/g, "");
    const baseUsername = `${sanitizedFirst}${sanitizedLast}`;
    const randomNumber = Math.floor(10 + Math.random() * 90);
    return `${baseUsername}${randomNumber}`;
  };

  // Generate username when first and last name change
  useEffect(() => {
    if (firstName && lastName && !session?.user?.username) {
      const generatedUsername = generateUsername(firstName, lastName);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(generatedUsername);
    }
  }, [firstName, lastName, session?.user?.username]);

  const handleFieldEdit = (field) => {
    if (!editability[field]) {
      toast.error(`You cannot edit the ${field} as it already exists.`);
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewImage(URL.createObjectURL(file)); // Set preview for the circular image display
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file instanceof File,
    );
    if (files.length) {
      // gallery holds only new File objects to upload; existingGallery holds only remote URL strings.
      // Mixing them caused File objects to be JSON-stringified as {} and double-counted in the API.
      setGallery((prev) => [...prev, ...files]);
    }
  };

  // Remove gallery image
  const removeGalleryImage = (indexToRemove) => {
    const updatedExistingGallery = existingGallery.filter(
      (_, index) => index !== indexToRemove,
    );
    setExistingGallery(updatedExistingGallery);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    const formData = new FormData();

    // Append profile details
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("username", username);
    formData.append("contact", contact);
    formData.append("location", location);
    formData.append("description", description);
    formData.append("hourlyRate", hourlyRate.toString());

    // Append profile photo if changed
    if (profilePhoto) {
      formData.append("profilePhoto", profilePhoto);
    }

    // Append existing gallery URLs
    formData.append("existingGallery", JSON.stringify(existingGallery));

    // Append new gallery files
    gallery.forEach((file) => {
      if (file instanceof File) {
        formData.append(`gallery`, file);
      }
    });

    try {
      const response = await axios.post("/api/coach/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update session with new data
      await update({
        firstName,
        lastName,
        email,
        username,
        contact,
        location,
        description,
        hourlyRate,
        gallery: existingGallery,
        profilePhoto: previewImage,
      });

      setStatusMessage(
        response.status === 200
          ? "Profile updated successfully!"
          : "Failed to update profile.",
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      setStatusMessage("An error occurred.");
    }
  };

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
            paddingTop: "10px",
            paddingLeft: "20px",
            paddingRight: "20px",
            height: "82px",
            zIndex: 10,
            backgroundColor: "white",
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
            marginLeft: "150px",
            overflow: "auto",
            backgroundColor: "#f7f7f7",
            minHeight: "100vh",
          }}
        >
          {/* form */}
          <div className="w-[1236px] h-[1234px] rounded-[5px] pt-40">
            <form onSubmit={handleUpdate} className="p-4 max-w-lg mx-auto ">
              <h2 className=" font-bold text-[22px] landing-[26.4px] text-[#037D40] mb-4">
                Profile Details
              </h2>
              {statusMessage && <p className="mb-4">{statusMessage}</p>}

              {/* Profile Photo Upload */}
              <div className="flex gap-40">
                <div className="flex flex-col items-center mb-4">
                  <label className="font-normal text-[22px] pb-[15px]">
                    Profile Photo
                  </label>
                  <div
                    className="relative w-32 h-32 rounded-full overflow-hidden bg-[#E6F2EC] flex justify-center items-center"
                    style={{
                      backgroundImage: `url(${previewImage})`,
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
                    {!previewImage && (
                      <SquarePen className="text-primary text-4xl absolute " />
                    )}
                  </div>
                </div>

                {/* Gallery Upload Section */}
                <div className="flex flex-col mb-4">
                  <label className="font-normal text-[22px] pb-[15px]">
                    Gallery
                  </label>
                  <div className="flex gap-4 mb-4">
                    {existingGallery.map((image, index) => (
                      <div key={index} className="relative">
                        <div
                          className="w-32 h-32 bg-[#E6F2EC] flex justify-center items-center overflow-hidden rounded"
                          style={{
                            backgroundImage: `url(${image instanceof File ? URL.createObjectURL(image) : image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <label className="w-32 h-32 bg-[#E6F2EC] flex justify-center items-center cursor-pointer rounded">
                      <Upload className="text-primary text-4xl" />
                      <input
                        type="file"
                        onChange={handleGalleryUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pb-5 text-[18px] font-normal">
                <div className="flex flex-col gap-[20px]">
                  <label>First Name</label>
                  <input
                    className={`w-[578px] h-[60px] rounded-[5px] border border-solid padding-[20px] border-[#B0B6D3] px-3 
                      ${editability.firstName ? "" : "bg-gray-100 cursor-not-allowed"}`}
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      if (editability.firstName) setFirstName(e.target.value);
                    }}
                    onClick={() => handleFieldEdit("firstName")}
                    placeholder="First Name"
                    disabled={!editability.firstName}
                  />
                </div>

                <div className="flex flex-col gap-[20px]">
                  <label>Last Name</label>
                  <input
                    className={`w-[578px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3 
                      ${editability.lastName ? "" : "bg-gray-100 cursor-not-allowed"}`}
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      if (editability.lastName) setLastName(e.target.value);
                    }}
                    onClick={() => handleFieldEdit("lastName")}
                    placeholder="Last Name"
                    disabled={!editability.lastName}
                  />
                </div>
              </div>

              <div className="flex gap-6 pb-5 text-[18px] font-normal">
                <div className="flex flex-col gap-[20px]">
                  <label>Email</label>
                  <input
                    className={`w-[578px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3 
                      ${editability.email ? "" : "bg-gray-100 cursor-not-allowed"}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      if (editability.email) setEmail(e.target.value);
                    }}
                    onClick={() => handleFieldEdit("email")}
                    placeholder="Email"
                    disabled={!isEmailEditable}
                  />
                </div>

                <div className="flex flex-col gap-[20px]">
                  <label>Contact Number</label>
                  <input
                    className="w-[578px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Contact Number"
                  />
                </div>
              </div>

              {/* Username Input (read-only) */}
              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px] ">
                <label>Username</label>
                <input
                  className="w-[1176px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3"
                  type="text"
                  value={username}
                  readOnly
                  placeholder="Username"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px] ">
                <label>Locaton</label>
                <input
                  className="w-[1176px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Title"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>Description</label>

                <textarea
                  className="w-[1176px] pt-4 h-[250px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                />
              </div>

              <div className="pb-5 text-[18px] font-normal flex flex-col gap-[20px]">
                <label>Hourly Rate</label>
                <input
                  className="w-[1176px] h-[60px] rounded-[5px] border-1 solid padding-[20px] border-[#B0B6D3] px-3"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
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
          </div>
        </Box>
      </div>
    </AppTheme>
  );
};

export default ProfileEditComponent;
