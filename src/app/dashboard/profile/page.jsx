"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useUser } from "../../../context/userContext";
import {
  fetchDoctorByUserId,
  fetchLabUserByUserId,
  fetchPatientByUserId,
  fetchUserProfile,
  updateUserProfile,
  uploadProfilePicture,
} from "../../../lib/supabaseHelpers";
import { useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { Spinner } from "../../../components/Spinner";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState({});
  const [formValues, setFormValues] = useState({});
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const getProfileData = async () => {
      if (!user) {
        router.replace("/api/auth/signin");
        return;
      }
      setLoading(true);
      try {
        let profileData = null;
        let url = await fetchUserProfile(user.id);
        if (user.role === "patient") {
          profileData = await fetchPatientByUserId(user.id);
        } else if (user.role === "doctor") {
          profileData = await fetchDoctorByUserId(user.id);
        } else if (user.role === "labuser") {
          profileData = await fetchLabUserByUserId(user.id);
        }
        setProfilePicUrl(url.profile);
        setProfile(profileData);
        setFormValues(profileData); // Initialize form values with fetched profile data
      } catch (error) {
        console.error("Error fetching profile data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    getProfileData();
  }, [user]);

  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const updatedProfile = await uploadProfilePicture(
        user.id,
        file,
        user.role
      );
      setProfile(updatedProfile);
      setProfilePicUrl(updatedProfile.profile);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: !editing[field] });
  };

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSave = async (field) => {
    setEditing({ ...editing, [field]: false });

    try {
      await updateUserProfile(user.id, user.role, formValues);
      setProfile(formValues);
      if (field === "email") {
        setUser((prevUser) => ({
          ...prevUser,
          email: formValues.email,
        }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Profile Section */}
      <div className="flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0">
        {/* Left Side: Profile Picture and Basic Info */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center space-y-6">
          <div className="relative w-32 h-32 md:w-40 md:h-40 border border-gray-300 rounded-full overflow-hidden">
            <Image
              src={profilePicUrl || "/patient.png"}
              alt="Profile Picture"
              fill={true}
              className="rounded-full"
              style={{ objectFit: "cover" }}
            />
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleProfilePicUpload}
              disabled={uploading}
            />
            {uploading && (
              <p className="absolute inset-x-0 bottom-0 text-center text-sm text-gray-500 bg-white bg-opacity-75">
                Uploading...
              </p>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl  md:text-lg lg:text-2xl font-bold text-gray-800">
              {editing.username ? (
                <input
                  type="text"
                  name="username"
                  value={formValues.username}
                  onChange={handleChange}
                  className="border rounded p-1"
                />
              ) : (
                profile.username || "Name not available"
              )}
              <FiEdit
                className="text-[#089bab] cursor-pointer inline ml-2"
                onClick={() => handleEdit("username")}
              />
              {editing.username && (
                <button
                  className="ml-2 text-[#089bab] underline"
                  onClick={() => handleSave("username")}
                >
                  Save
                </button>
              )}
            </h1>
            <p className="text-md md:text-lg text-gray-600">
              {editing.email ? (
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="border rounded p-1"
                />
              ) : (
                user?.email
              )}
              <FiEdit
                className="text-[#089bab] cursor-pointer inline ml-2"
                onClick={() => handleEdit("email")}
              />
              {editing.email && (
                <button
                  className="ml-2 text-[#089bab] underline"
                  onClick={() => handleSave("email")}
                >
                  Save
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Contact and Professional Info */}
        <div className="w-full md:w-2/3 flex flex-col space-y-6">
          {/* Contact Information */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold text-[#089bab] mb-4">
              Contact Information
            </h2>
            <div className="space-y-4 text-md md:text-lg">
              {["phone_number", "gender", "dob", "address"].map((field) => (
                <div
                  key={field}
                  className="flex justify-between items-center border p-4 rounded-lg"
                  style={{ borderColor: "#089bab" }}
                >
                  {editing[field] ? (
                    <input
                      type="text"
                      name={field}
                      value={formValues[field]}
                      onChange={handleChange}
                      className="w-full p-1 border rounded text-gray-600"
                    />
                  ) : (
                    <p className="text-gray-600">
                      <span className="font-semibold capitalize">
                        {field.replace("_", " ")}:
                      </span>{" "}
                      {profile[field] || "Not available"}
                    </p>
                  )}
                  <FiEdit
                    className="text-[#089bab] cursor-pointer"
                    onClick={() => handleEdit(field)}
                  />
                  {editing[field] && (
                    <button
                      className="ml-2 text-[#089bab] underline"
                      onClick={() => handleSave(field)}
                    >
                      Save
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medical or Professional Information */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            {user?.role === "patient" && (
              <>
                <h2 className="text-xl md:text-2xl font-semibold text-[#089bab] mb-4">
                  Medical Information
                </h2>
                <div className="space-y-4 text-md md:text-lg">
                  {["family_medical_history", "past_medical_history"].map(
                    (field) => (
                      <div
                        key={field}
                        className="flex justify-between items-center border p-4 rounded-lg"
                        style={{ borderColor: "#089bab" }}
                      >
                        {editing[field] ? (
                          <textarea
                            name={field}
                            value={formValues[field]}
                            onChange={handleChange}
                            className="w-full p-1 border rounded text-gray-600"
                          />
                        ) : (
                          <p className="text-gray-600">
                            <span className="font-semibold capitalize">
                              {field.replace("_", " ")}:
                            </span>{" "}
                            {profile[field] || "Not available"}
                          </p>
                        )}
                        <FiEdit
                          className="text-[#089bab] cursor-pointer"
                          onClick={() => handleEdit(field)}
                        />
                        {editing[field] && (
                          <button
                            className="ml-2 text-[#089bab] underline"
                            onClick={() => handleSave(field)}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
            {user?.role === "doctor" && (
              <>
                <h2 className="text-xl md:text-2xl font-semibold text-[#089bab] mb-4">
                  Professional Information
                </h2>
                <div className="space-y-4 text-md md:text-lg">
                  <div
                    className="flex justify-between items-center border p-4 rounded-lg"
                    style={{ borderColor: "#089bab" }}
                  >
                    {editing.specialization ? (
                      <input
                        type="text"
                        name="specialization"
                        value={formValues.specialization}
                        onChange={handleChange}
                        className="w-full p-1 border rounded text-gray-600"
                      />
                    ) : (
                      <p className="text-gray-600">
                        <span className="font-semibold">Specialization:</span>{" "}
                        {profile.specialization || "Not available"}
                      </p>
                    )}
                    <FiEdit
                      className="text-[#089bab] cursor-pointer"
                      onClick={() => handleEdit("specialization")}
                    />
                    {editing.specialization && (
                      <button
                        className="ml-2 text-[#089bab] underline"
                        onClick={() => handleSave("specialization")}
                      >
                        Save
                      </button>
                    )}
                  </div>

                  {/* Available Times Section */}
                  <div
                    className="flex justify-between items-center border p-4 rounded-lg"
                    style={{ borderColor: "#089bab" }}
                  >
                    {editing.available_time_from ? (
                      <input
                        type="time"
                        name="available_time_from"
                        value={formValues.available_time_from}
                        onChange={handleChange}
                        className="w-full p-1 border rounded text-gray-600"
                      />
                    ) : (
                      <p className="text-gray-600">
                        <span className="font-semibold">Available Time From:</span>{" "}
                        {profile.available_time_from || "Not available"}
                      </p>
                    )}
                    <FiEdit
                      className="text-[#089bab] cursor-pointer"
                      onClick={() => handleEdit("available_time_from")}
                    />
                    {editing.available_time_from && (
                      <button
                        className="ml-2 text-[#089bab] underline"
                        onClick={() => handleSave("available_time_from")}
                      >
                        Save
                      </button>
                    )}
                  </div>

                  <div
                    className="flex justify-between items-center border p-4 rounded-lg"
                    style={{ borderColor: "#089bab" }}
                  >
                    {editing.available_time_to ? (
                      <input
                        type="time"
                        name="available_time_to"
                        value={formValues.available_time_to}
                        onChange={handleChange}
                        className="w-full p-1 border rounded text-gray-600"
                      />
                    ) : (
                      <p className="text-gray-600">
                        <span className="font-semibold">Available Time To:</span>{" "}
                        {profile.available_time_to || "Not available"}
                      </p>
                    )}
                    <FiEdit
                      className="text-[#089bab] cursor-pointer"
                      onClick={() => handleEdit("available_time_to")}
                    />
                    {editing.available_time_to && (
                      <button
                        className="ml-2 text-[#089bab] underline"
                        onClick={() => handleSave("available_time_to")}
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
