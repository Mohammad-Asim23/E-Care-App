"use client";

import { useUser } from "../../context/userContext";
import { useEffect, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  acceptAppointment,
  cancelAppointment,
  createAppointment,
  fetchAllPatients,
  fetchDoctorAppointmentsByDate,
  fetchDoctorById,
  fetchDoctorByUserId,
  fetchDoctorConsultations,
  fetchDoctorsForPatient,
  fetchLabUserByUserId,
  fetchPatientAppointments,
  fetchPatientByUserId,
  fetchPatientConsultations,
  fetchUnacceptedAppointments,
  uploadReportForPatient,
} from "../../lib/supabaseHelpers"; // Import the helper function
import Modal from "react-modal"; // Import react-modal
import {Spinner} from "../../components/Spinner";

export default function DashboardHome() {
  const { user, status, loading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]); // State to store doctors
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [unacceptedAppointments, setUnacceptedAppointments] = useState([]); // State to store unaccepted appointments
  const [consultations, setConsultations] = useState([]); // State to store consultations
  const [upComingAppointments, setUpcomingAppointments] = useState([]); // State to store upcoming appointments
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportImage, setReportImage] = useState(null);
  const [reportTitle, setReportTitle] = useState(""); // Updated state for title
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [user, status, loading, router]);

  // Fetch doctors if the user is a patient
  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === "labuser") {
        const fetchedPatients = await fetchAllPatients();
        setAllPatients(fetchedPatients)
      };
      if (user?.role === "patient") {
        const fetchedDoctors = await fetchDoctorsForPatient();
        setDoctors(fetchedDoctors);

        const patientData = await fetchPatientByUserId(user.id);
        setPatient(patientData);
        const { upcomingAppointments } = await fetchPatientAppointments(patientData.id);
          setUpcomingAppointments(upcomingAppointments);

        const consultationsData = await fetchPatientConsultations(user.id);
        setConsultations(consultationsData);
      } else if (user?.role === "doctor") {
        const doctorData = await fetchDoctorByUserId(user.id);
        if (doctorData) {
          const fetchedAppointments = await fetchUnacceptedAppointments(doctorData.id);
          setUnacceptedAppointments(fetchedAppointments);

          const consultationsData = await fetchDoctorConsultations(user.id);
          setConsultations(consultationsData);
        }
      }
    };
    fetchData();
  }, [user]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
    setSymptoms('')
  };
  const openModal = async (doctorId) => {
    const doctor = await fetchDoctorById(doctorId);
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };
  
  const handleBooking = async () => {
    const appointmentDate = document.querySelector('input[type="date"]').value;
    const appointmentTime = document.querySelector('input[type="time"]').value;
  
    const today = new Date().toISOString().split("T")[0];
    const selectedDate = new Date(appointmentDate).toISOString().split("T")[0];
  
    if (selectedDate < today) {
      alert("Appointment date cannot be in the past.");
      return;
    }
  
    const availableFrom = selectedDoctor.available_time_from;
    const availableTo = selectedDoctor.available_time_to;
  
    if (appointmentTime < availableFrom || appointmentTime > availableTo) {
      alert(`Please select a time between ${availableFrom} and ${availableTo}.`);
      return;
    }
  
    if (!patient || !selectedDoctor) {
      alert("Please fill in all the details.");
      return;
    }
  
    // Fetch existing appointments for the selected doctor on the same date
    const existingAppointments = await fetchDoctorAppointmentsByDate(
      selectedDoctor.id,
      appointmentDate
    );
  
    const appointmentTimeObj = new Date(`${appointmentDate}T${appointmentTime}`);
  
    for (let appointment of existingAppointments) {
      const existingTimeObj = new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      );
      const timeDifference = Math.abs(existingTimeObj - appointmentTimeObj) / 60000; 
  
      if (timeDifference < 30) {
        alert("This time slot is too close to another appointment. Please select a different time.");
        return;
      }
    }
  
    const appointmentData = {
      patient_id: patient.id,
      doctor_id: selectedDoctor.id,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      symptoms: symptoms || "N/A", // Ensure symptoms are correctly passed
      acceptance: false,
    };
  
    try {
      const newAppointment = await createAppointment(appointmentData);
      alert("Appointment booked successfully!");
      closeModal();
    } catch (error) {
      console.error("Error booking appointment:", error.message);
    }
  };
  
  
  
  const openReportModal = (patient) => {
    setSelectedPatient(patient);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedPatient(null);
    setReportImage(null);
    setReportTitle(""); // Reset title field
  };
  const handleReportImageChange = (e) => {
    setReportImage(e.target.files[0]);
  };
  
  const handleSubmitReport = async () => {
    if (!reportImage || !selectedPatient || !reportTitle) {
      alert("Please fill in all the details and select an image.");
      return;
    }
  
    try {
      // Convert the File object to a Base64 string
      const reader = new FileReader();
      reader.readAsDataURL(reportImage);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1]; // Remove the data:image/jpeg;base64, part
  
        const labUser = await fetchLabUserByUserId(user.id);
        if (!labUser) {
          alert("Lab user not found.");
          return;
        }
  
        await uploadReportForPatient(selectedPatient.id, labUser.id, base64Image, reportTitle);
        alert("Report sent successfully!");
        closeReportModal();
      };
    } catch (error) {
      console.error("Error uploading report:", error.message);
      alert("Failed to send report. Please try again.");
    }
  };
  
  const filteredDoctors = doctors.filter((doctor) =>
    doctor.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = allPatients.filter((patient) =>
    patient.username.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (loading) {
    return <Spinner/>;
  }

  if (!user) {
    return null; // or a loading indicator
  }

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      const updatedAppointment = await acceptAppointment(appointmentId);

      // Update the local state to reflect the change
      setUnacceptedAppointments((prevAppointments) =>
        prevAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      );
    } catch (error) {
      console.error("Error accepting appointment:", error.message);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId);
  
      // Update the local state to reflect the change
      setUnacceptedAppointments((prevAppointments) =>
        prevAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      );
    } catch (error) {
      console.error("Error canceling appointment:", error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#089bab]">Welcome, 👋</h1>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg"
        />
      </div>

      {/* Conditional Rendering Based on User Role */}
      {user?.role === "patient" && (
        <>
          {/* Patient View */}
          <div className="flex space-x-6">
            <div className="bg-white shadow rounded-lg p-6 flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">
                Upcoming Appointments
              </h2>
              <p className="text-4xl font-bold text-[#089bab]">{upComingAppointments.length || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6 flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">
                Consultations
              </h2>
              <p className="text-4xl font-bold text-[#089bab]">{consultations.length || 0}</p>
            </div>
          </div>

          {/* Bottom Section with Full-Width Doctor Cards */}
          <div>
            <h2 className="text-xl font-bold text-black mb-4">Doctors</h2>
            <div className="space-y-6">
            {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white shadow rounded-lg p-6 w-full"
                >
                  <h3 className="text-lg font-bold text-black">
                    {doctor.username}
                  </h3>
                  <p className="text-gray-600">{doctor.specialization}</p>
                  <div className="flex items-center text-gray-600 mt-2">
                    <FiMapPin className="mr-2 text-[#089bab]" />
                    <p className="text-[#089bab]">{doctor.address}</p>
                  </div>
                  <button
                    onClick={() => openModal(doctor.id)}
                    className="mt-4 bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-xl font-bold text-black mb-4">Your Consultations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                    Doctor Name
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                    Disease
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                    Prescription
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                    Consulted Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultations.length > 0 ? (
                  consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {consultation.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {consultation.disease}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {consultation.prescription || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {new Date(consultation.consulted_time).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-800"
                    >
                      No consultations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}


<Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Doctor Details"
  className="modal-content"
  overlayClassName="modal-overlay"
>
  {selectedDoctor && (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <button onClick={closeModal} className="text-[#089bab] mb-4 self-end">
        Close
      </button>

      <div className="flex flex-col lg:flex-row lg:justify-center lg:space-x-8 h-full">
        <div className="w-full lg:w-1/2 flex flex-col">
          <img
            src={selectedDoctor.profile || "/doctor.jpg"}
            alt="Doctor Profile"
            className="w-40 h-40 rounded-full mb-4 object-cover self-center lg:self-start"
          />
          <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center lg:text-left">
            {selectedDoctor.username}
          </h2>
          <p className="text-gray-600 text-md mb-1 text-center lg:text-left">
            {selectedDoctor.specialization}
          </p>
          <div className="flex items-center justify-center lg:justify-start text-gray-600 mt-4">
            <FiMapPin className="mr-2 text-[#089bab]" />
            <p className="text-[#089bab]">{selectedDoctor.address}</p>
          </div>
          <div className="text-center lg:text-left mt-4">
            <p className="text-gray-600">
              Phone: {selectedDoctor.phone_number}
            </p>
            <p className="text-gray-600">DOB: {selectedDoctor.dob}</p>
            <p className="text-gray-600">Gender: {selectedDoctor.gender}</p>
            <p className="text-gray-600">
              Available Time: {selectedDoctor.available_time_from} -{" "}
              {selectedDoctor.available_time_to}
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col mt-6 lg:mt-0">
          <h3 className="text-xl font-semibold text-[#089bab] mb-6 text-center lg:text-left">
            Appointment Details
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block  text-[#089bab] font-bold mb-2">
                Appointment Day:
              </label>
              <input
                type="date"
                className="w-full p-3 border border-[#089bab]  rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[#089bab] font-bold mb-2">
                Appointment Time:
              </label>
              <input
                type="time"
                className="w-full p-3 border border-[#089bab]  rounded-lg"
                min={selectedDoctor.available_time_from}
                max={selectedDoctor.available_time_to}
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-[#089bab] font-bold mb-2">
              Symptoms:
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-4 border border-[#089bab]  rounded-lg"
              rows="4"
              placeholder="Describe your symptoms..."
            ></textarea>
          </div>
          <button
            onClick={handleBooking}
            className="mt-8 bg-[#089bab] text-white mb-4 py-3 px-6 rounded-lg hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors w-full"
          >
            Make an Appointment
          </button>
        </div>
      </div>
    </div>
  )}
</Modal>


      {user?.role === "doctor" && (
        <>
          {/* Doctor View */}
          <div className="flex space-x-6">
            <div className="bg-white shadow rounded-lg p-6 flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">
                Pending Appointments
              </h2>
              <p className="text-4xl font-bold text-[#089bab]">
                {unacceptedAppointments.length || 0}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6 flex-1">
              <h2 className="text-xl font-semibold text-black mb-2">
                Total Consultations
              </h2>
              <p className="text-4xl font-bold text-[#089bab]">
                {consultations.length || 0}
              </p>
            </div>
          </div>


          {/* Appointments Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-black mb-4">
              Pending Appointments
            </h2>
            {unacceptedAppointments.length > 0 ? (
              unacceptedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white flex items-center justify-between shadow rounded-lg p-6 w-full"
                >
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-black">
                      Patient: {appointment.patients.username}
                    </h3>
                    <p className="text-gray-600">
                      Symptoms: {appointment.symptoms}
                    </p>
                    <div className="flex flex-col text-gray-600 mt-2">
                      <p className="text-[#089bab]">
                        Appointment Date: {appointment.appointment_date}
                      </p>
                      <p className="text-[#089bab]">
                        Appointment Time: {appointment.appointment_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-4 mt-2">
                    <button
                      onClick={() => handleAcceptAppointment(appointment.id)}
                      className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                        onClick={() => handleCancelAppointment(appointment.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 border border-red-500 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No pending appointments.</p>
            )}
          </div>
          {/* Consultations Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-black mb-4">Your Consultations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                      Patient Name
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                      Disease
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                      Prescription
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-[#089bab] ">
                      Consulted Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.length > 0 ? (
                    consultations.map((consultation) => (
                      <tr key={consultation.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {consultation.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {consultation.disease}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {consultation.prescription || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(consultation.consulted_time).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-4 text-center text-sm text-gray-800"
                      >
                        No consultations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

{user?.role === "labuser" && (
       <div className="space-y-6">
       <h2 className="text-xl font-bold text-black mb-4">Patients</h2>
       {filteredPatients.map((patient) => (
        <div
          key={patient.id}
          className="bg-white flex items-center justify-between shadow rounded-lg p-6 w-full"
        >
          <div className="flex items-center space-x-4">
            <img
              src={patient.profile || "/patient.png"}
              alt="Patient Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-black">
                {patient.username}
              </h3>
              <p className="text-gray-600">{patient.phone_number}</p>
              <div className="flex items-center text-gray-600 mt-2">
                <FiMapPin className="mr-2 text-[#089bab]" />
                <p className="text-[#089bab]">{patient.address}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => openReportModal(patient)}
            className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
          >
            Send Report
          </button>
        </div>
      ))}
    </div>
  )}

   {/* Report Modal */}
   <Modal
     isOpen={isReportModalOpen}
     onRequestClose={closeReportModal}
     contentLabel="Send Report"
     className="modal-content"
     overlayClassName="modal-overlay"
   >
     <div className="p-6 space-y-6 h-full flex flex-col">
       {/* Close Button */}
       <button
         onClick={closeReportModal}
         className="text-[#089bab] mb-4 self-end"
       >
         Close
       </button>

       <div className="flex flex-col space-y-6">
         <h2 className="text-xl font-semibold text-gray-800">Send Report to {selectedPatient?.username}</h2>
         <div>
           <label className="block text-[#089bab] font-bold mb-2">
             Report Title:
           </label>
           <input
             type="text"
             value={reportTitle}
             onChange={(e) => setReportTitle(e.target.value)}
             className="w-full p-3 border border-[#089bab] rounded-lg"
             placeholder="Enter report title"
           />
         </div>
         <div>
           <label className="block text-[#089bab] font-bold mb-2">
             Report Image:
           </label>
           <input
             type="file"
             accept="image/*"
             onChange={handleReportImageChange}
             className="w-full p-3 border border-[#089bab] rounded-lg"
           />
         </div>
         <button
           onClick={handleSubmitReport}
           className="mt-8 bg-[#089bab] text-white py-3 px-6 rounded-lg hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors w-full"
         >
           Submit Report
         </button>
       </div>
     </div>
   </Modal>
 </div>
);
}