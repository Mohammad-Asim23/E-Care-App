"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { insertPersonalInfo } from "../../../lib/supabaseHelpers";

export default function PersonalInfoPage() {
  const [formData, setFormData] = useState({
    username: "",
    phone_number: "",
    dob: "",
    gender: "male", 
    address: "",
    specialization: "",
    available_time_from: "",
    available_time_to: "",
    family_medical_history: "",
    past_medical_history: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const userId = searchParams.get("user_id");

  // Extract the role from the dynamic route
  const role = pathname.split("/").pop();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Call the helper function to insert the personal info
      await insertPersonalInfo(role, userId, formData);

      // Redirect to the dashboard or another page after saving info
      router.push('/api/auth/signin'); 
    } catch (error) {
      console.error("Error saving personal info:", error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-cover bg-center" style={{ backgroundImage: `url('/PersonalInfo.avif')` }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Form Container */}
      <div className="relative p-10 xs:p-0 mx-auto md:w-full md:max-w-lg bg-white shadow-lg rounded-lg overflow-hidden">
        <h1 className="font-bold text-center text-3xl text-[#089bab] mb-5 capitalize">
          {role} Info
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-semibold text-sm text-gray-600 pb-1 block">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-sm text-gray-600 pb-1 block">
              Phone Number
            </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-sm text-gray-600 pb-1 block">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-sm text-gray-600 pb-1 block">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-sm text-gray-600 pb-1 block">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
              required
            />
          </div>

          {/* Role-Specific Fields */}
          {role === "doctor" && (
            <>
              <div>
                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                  Available Time From
                </label>
                <input
                  type="time"
                  name="available_time_from"
                  value={formData.available_time_from}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                  Available Time To
                </label>
                <input
                  type="time"
                  name="available_time_to"
                  value={formData.available_time_to}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                  required
                />
              </div>
            </>
          )}

          {role === "patient" && (
            <>
              <div>
                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                  Family Medical History
                </label>
                <textarea
                  name="family_medical_history"
                  value={formData.family_medical_history}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                  Past Medical History
                </label>
                <textarea
                  name="past_medical_history"
                  value={formData.past_medical_history}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                />
              </div>
            </>
          )}

          {/* No additional fields for lab users, just common fields */}

          <button
            type="submit"
            className="w-full bg-[#089bab] hover:bg-[#067f8a] text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200"
          >
            Save Info
          </button>
        </form>
      </div>
    </div>
  );
}
