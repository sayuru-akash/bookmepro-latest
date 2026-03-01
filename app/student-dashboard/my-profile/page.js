"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircleCheck } from "lucide-react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const StudentProfileEditComponent = () => {
  const { data: session } = useSession();
  const [studentData, setStudentData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  useEffect(() => {
    const getStudentId = () => {
      try {
        // Check multiple possible storage locations
        const storedStudentData = localStorage.getItem("studentData");
        const id = storedStudentData 
          ? JSON.parse(storedStudentData)?.id 
          : session?.user?.id 
            || session?.user?._id 
            || session?.user?.sub;

        // console.log("Retrieved student ID:", id);
        
        if (!id) {
          console.error("No student ID found");
          toast.error("User identification failed. Please log in again.");
          setIsLoading(false);
          return null;
        }
        
        setStudentId(id);
        return id;
      } catch (error) {
        console.error("Error retrieving student ID:", error);
        toast.error("Error retrieving user data. Please log in again.");
        setIsLoading(false);
        return null;
      }
    };

    const id = getStudentId();
    if (!id) return;
  }, [session]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
  
      try {
        // console.log("Attempting to fetch student with ID:", studentId);
        // console.log("Full URL:", `/api/student-profile/${studentId}`);
        
        const response = await fetch(`/api/student-profile/${studentId}`);
        // console.log("Response status:", response.status);
        
        if (response.status === 404) {
          throw new Error(`Student with ID ${studentId} not found`);
        }
        
        const data = await response.json();
        // console.log("Response data:", data);
        
        if (data.student) {
          setStudentData(data.student);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchStudentData();
  }, [studentId]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value) => {
    setStudentData((prev) => ({
      ...prev,
      phone: value,
    }));
    validatePhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!studentId) {
      toast.error("User identification failed. Please log in again.");
      return;
    }

    // Validate phone before submission
    if (!validatePhone(studentData.phone)) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // console.log("Submitting update for student ID:", studentId);
      const response = await fetch(`/api/student-profile/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      // console.log("Update response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to update: ${response.status}`);
      }
      
      const data = await response.json();
      // console.log("Update response data:", data);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col justify-center items-center">
          <div className="w-16 h-16 border-4 border-t-primary border-gray-300 rounded-full animate-spin"></div>
          <div className="mt-4 text-primary text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mt-24">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#037D40] px-6 py-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Profile</h1>
            <p className="text-white/90 mt-2">Update your personal information</p>
          </div>

          {/* Form Container */}
          <div className="px-6 py-8 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={studentData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#037D40] focus:border-[#037D40]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={studentData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#037D40] bg-gray-100 cursor-not-allowed"
                  required
                  disabled
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">Phone Number</label>
                <PhoneInput
                  international
                  value={studentData.phone}
                  onChange={handlePhoneChange}
                  defaultCountry="au"
                  placeholder="Enter your phone number"
                  className={`border rounded-lg w-full ${
                    phoneError
                      ? "border-red-500"
                      : isPhoneValid
                      ? "border-[#037D40]"
                      : "border-gray-300"
                  }`}
                  inputStyle={{
                    backgroundColor: "#fff",
                    width: "100%",
                    height: "48px",
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
                    "--react-international-phone-height": "48px",
                  }}
                  required
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={studentData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#037D40] focus:border-[#037D40]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#037D40] hover:bg-[#036635] text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#037D40] focus:ring-offset-2 disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default StudentProfileEditComponent;