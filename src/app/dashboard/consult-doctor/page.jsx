"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../context/userContext";
import DoctorDetailModal from "../../../components/DoctorDetailModal";
import {
  fetchConsultationsByPatientId,
  fetchDoctorConsultations,
  fetchDoctorsForPatient,
  fetchPatientConsultations,
  updateConsultationPrescription,
  fetchPatientProfile,
} from "../../../lib/supabaseHelpers";
import {Spinner} from '../../../components//Spinner'

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("en-US", options).format(new Date(dateString));
};


export default function ConsultDoctorPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();
  const [doctors, setDoctors] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [patientDetails, setPatientDetails] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [prescription, setPrescription] = useState("");
  const [isViewingPatientDetails, setIsViewingPatientDetails] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (user?.role === "patient") {
          const data = await fetchDoctorsForPatient();
          setDoctors(data);

          const consultationsData = await fetchPatientConsultations(user.id);
          setConsultations(consultationsData);
        } else if (user?.role === "doctor") {
          const consultationsData = await fetchDoctorConsultations(user.id);
          setConsultations(consultationsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleViewPatientDetails = async (consultation) => {
    setSelectedConsultation(consultation);
    setPrescription(consultation.prescription || ""); // Pre-fill the prescription textarea if it exists
    setIsViewingPatientDetails(true);

    if (consultation.access_allowed) {
      const patientConsultations = await fetchConsultationsByPatientId(consultation.patient_id);
      const filteredDetails = patientConsultations.filter(
        (detail) => detail.id !== consultation.id
      );
      setPatientDetails(filteredDetails);

      const profile = await fetchPatientProfile(consultation.patient_id);
      setPatientProfile(profile);
    }
  };

  const handleAddPrescription = async () => {
    try {
      await updateConsultationPrescription(selectedConsultation.id, prescription);
      setConsultations(
        consultations.map((c) =>
          c.id === selectedConsultation.id ? { ...c, prescription } : c
        )
      );
      setIsViewingPatientDetails(false);
    } catch (error) {
      console.error("Error updating prescription:", error.message);
    }
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription || "No prescription by doctor yet.");
  };

  // Show spinner while loading
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {user?.role === "patient" && (
        <>
          {/* Patient View */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full"
            />
          </div>

          <div className="flex flex-col space-y-4">
            {doctors
              .filter((doctor) => doctor.username.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((doctor) => (
                <div key={doctor.id} className="bg-white shadow rounded-lg p-6 w-full">
                  <h3 className="text-lg font-bold text-black">{doctor.username}</h3>
                  <p className="text-gray-600">{doctor.specialization}</p>
                  <button
                    onClick={() => handleViewDetails(doctor)}
                    className="mt-4 bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Your Consultations</h2>
            {consultations.length > 0 ? (
              consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="bg-white shadow flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-lg p-4 sm:p-6 w-full mb-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-black">
                      Consulted with: {consultation.doctor_name}
                    </h3>
                    <p className="text-gray-600">Disease: {consultation.disease}</p>
                    <p className="text-gray-600">Consulted Time: {formatDate(consultation.consulted_time)}</p>
                  </div>
                  <div className="flex justify-end sm:justify-start space-x-4 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleViewPrescription(consultation.prescription)}
                      className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                    >
                      See Prescription
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>You have no consultations yet.</p>
            )}
          </div>
        </>
      )}

      {user?.role === "doctor" && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Your Consultations</h2>
          {consultations.length > 0 ? (
            consultations.map((consultation) => (
              <div key={consultation.id} className="bg-white shadow rounded-lg p-6 w-full mb-4">
                <h3 className="text-lg font-bold text-black">
                  Patient: {consultation.patient_name}
                </h3>
                <p className="text-[#089bab]">Phone: {consultation.patient_phone}</p>
                <p className="text-[#089bab]">Consulted Time: {formatDate(consultation.consulted_time)}</p>
                <p className="text-[#089bab]">Disease: {consultation.disease}</p>
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    onClick={() => handleViewPatientDetails(consultation)}
                    className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>You have no consultations yet.</p>
          )}
        </div>
      )}

      {isViewingPatientDetails && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-5xl mx-4 md:mx-auto flex flex-col md:flex-row space-y-8 md:space-y-0">
            {/* Close Button */}
            <button
              onClick={() => setIsViewingPatientDetails(false)}
              className="absolute top-6 right-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Left Section: Patient Profile */}
            <div className="md:w-1/3 flex flex-col items-center">
              <img
                src={patientProfile?.profile || "/default-profile.png"}
                alt={selectedConsultation.patient_name}
                className="w-40 h-40 rounded-full mb-6 object-cover"
              />
              <p className="text-xl font-semibold text-gray-800">{selectedConsultation.patient_name}</p>
              <p className="text-lg text-[#089bab]">{selectedConsultation.patient_phone}</p>
            </div>

            {/* Right Section: Patient Details */}
            <div className="md:w-2/3 md:ml-8">
              <p className="text-xl text-[#089bab]"><span className="font-semibold">Disease:</span> {selectedConsultation.disease}</p>
              {selectedConsultation.access_allowed ? (
                <>
                  <p className="text-lg text-[#089bab] mt-6">
                    <span className="font-semibold">Family Medical History:</span> {selectedConsultation.family_medical_history || "N/A"}
                  </p>
                  <p className="text-lg text-[#089bab] mt-4">
                    <span className="font-semibold">Past Medical History:</span> {selectedConsultation.past_medical_history || "N/A"}
                  </p>
                  {patientDetails && patientDetails.length > 0 ? (
                    <>
                      <h4 className="text-xl font-bold mt-8">Previous Treatments:</h4>
                      {patientDetails.map((detail, index) => (
                        <div key={index} className="mt-4">
                          <p className="text-lg text-[#089bab]">Disease: {detail.disease}</p>
                          <p className="text-lg text-[#089bab]">Prescription: {detail.prescription || "N/A"}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="mt-6 text-lg text-gray-700">No ongoing treatment.</p>
                  )}
                  <div className="mt-8">
                    <textarea
                      placeholder="Add or edit the prescription..."
                      className="w-full p-4 border border-[#089bab] rounded-lg mb-4 text-lg"
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                    ></textarea>
                    <button
                      onClick={handleAddPrescription}
                      className="bg-[#089bab] text-white py-3 px-6 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors text-lg"
                    >
                      Save Prescription
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-lg text-gray-700 mt-6">Access to medical history is not allowed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <DoctorDetailModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}

      {selectedPrescription !== null && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 md:mx-auto">
            <h3 className="text-xl font-semibold text-[#089bab] mb-4">Prescription</h3>
            <p className="text-gray-800">{selectedPrescription}</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-white hover:text-gray-500 border border-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
