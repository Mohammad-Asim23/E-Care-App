import { useState } from "react";
import { FiX } from "react-icons/fi"; // Import close icon
import { useUser } from "../context/userContext";
import { createConsultation, fetchPatientByUserId } from "../lib/supabaseHelpers";

export default function DoctorDetailModal({ doctor, onClose }) {
  const [disease, setDisease] = useState("");
  const [allowAccess, setAllowAccess] = useState(false);
  const [error, setError] = useState(null); 
  const { user } = useUser();
  console.log("doctor",doctor);


  const handleSave = async () => {
    if (!disease.trim()) {
        alert("Please enter a disease or symptoms.");
        return;
      }
  
      if (!allowAccess) {
        alert("You must allow the doctor to access your medical records.");
        return;
      }
  
      try {
        // Fetch the patient ID by user ID
        const patientId = await fetchPatientByUserId(user.id);
  
        // Prepare consultation data
        const consultationData = {
          patient_id: patientId.id,
          doctor_id: doctor.id,
          disease,
          access_allowed: allowAccess,
          prescription: "", // Prescription can be added later by the doctor
        };
  
        // Create the consultation record in the database
        await createConsultation(consultationData);
  
        console.log("Consultation saved successfully");
        onClose(); // Close the modal after saving
      } catch (error) {
        console.error("Error saving consultation:", error.message);
        setError("An error occurred while saving the consultation. Please try again.");
      }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex lg:flex-row items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 md:mx-auto lg:flex lg:space-x-8 lg:h-[80vh] lg:max-h-screen">
      {/* Close Button */}
      <FiX className="text-[#089bab] cursor-pointer self-end lg:self-start lg:mb-4 lg:mr-4" onClick={onClose} />
      
      {/* Left Side: Doctor's Info */}
      <div className="lg:w-1/2 flex flex-col items-center lg:items-start">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl lg:text-3xl font-semibold text-[#089bab]">Doctor Details</h2>
        </div>
        <img
          src={doctor.users.profile || "/doctor.jpg"}
          alt="Doctor Profile"
          className="w-32 h-32 lg:w-40 lg:h-40 rounded-full mb-6 object-cover"
        />
        <h2 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-800">
          {doctor.username}
        </h2>
        <p className="text-lg lg:text-xl text-gray-600 mb-2">{doctor.specialization}</p>
        <div className="text-gray-600 text-lg lg:text-xl">
          <p>Phone: {doctor.phone_number}</p>
          <p>Gender: {doctor.gender}</p>
        </div>
      </div>

      {/* Right Side: Consultation Info */}
      <div className="lg:w-1/2 flex flex-col mt-6 lg:mt-0">
        <h3 className="text-xl lg:text-2xl font-semibold text-[#089bab] mb-6">Consultation Details</h3>
        <textarea
          placeholder="Describe your disease or symptoms..."
          className="w-full p-4 lg:p-5 border border-[#089bab] rounded-lg mb-6 lg:text-lg"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
          rows="5"
        ></textarea>
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            className="mr-2 w-5 h-5 lg:w-6 lg:h-6"
            checked={allowAccess}
            onChange={(e) => setAllowAccess(e.target.checked)}
          />
          <label className="text-[#089bab] lg:text-lg">Allow doctor to access my medical records</label>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#089bab] text-white py-3 lg:py-4 px-6 lg:px-8 rounded-lg hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
        >
          Save Consultation
        </button>
      </div>
    </div>
  </div>
);
}