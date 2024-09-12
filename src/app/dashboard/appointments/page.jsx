"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../context/userContext";
import {
  fetchDoctorAppointments,
  fetchDoctorByUserId,
  fetchPatientAppointments,
  fetchPatientByUserId,
} from "../../../lib/supabaseHelpers";
import Modal from "react-modal";
import {Spinner} from  '../../../components/Spinner'
import { useRouter } from "next/navigation";

export default function AppointmentsPage() {
  const { user, status } = useUser();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();


  useEffect(() => {
    const getAppointments = async () => {
      if (!user) {
        return; // Exit early if user is null
      }
      setLoading(true);
      try {
        if (user?.role === "patient") {
          const patientData = await fetchPatientByUserId(user.id);
          setPatient(patientData);

          if (patientData) {
            const { upcomingAppointments, pastAppointments } =
              await fetchPatientAppointments(patientData.id);
            setUpcomingAppointments(upcomingAppointments);
            setPastAppointments(pastAppointments);
          }
        } else if (user?.role === "doctor") {
          const doctorData = await fetchDoctorByUserId(user.id);
          setDoctor(doctorData);

          if (doctorData) {
            const { upcomingAppointments, pastAppointments } =
              await fetchDoctorAppointments(doctorData.id);
            setUpcomingAppointments(upcomingAppointments);
            setPastAppointments(pastAppointments);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    getAppointments();
  }, [user]);

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Top Section: Number of Upcoming Appointments */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-2">
              Upcoming Appointments
            </h2>
            <p className="text-4xl font-bold text-[#089bab]">
              {upcomingAppointments.length}
            </p>
          </div>

          {/* Middle Section: Upcoming Appointments */}
          <div>
            <h3 className="text-lg font-bold text-black mb-4">
              Upcoming Appointments
            </h3>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white flex justify-between items-center shadow rounded-lg p-6"
                  >
                    <div>
                      {user?.role === "doctor" ? (
                        <h4 className="text-md font-semibold text-black">
                          Patient: {appointment.patients.username}
                        </h4>
                      ) : (
                        <h4 className="text-md font-semibold text-black">
                          Doctor: {appointment.doctors.username}
                        </h4>
                      )}
                      <p className="text-[#089bab]">
                        Time: {appointment.appointment_time}
                      </p>
                      <p className="text-[#089bab]">
                        Date: {appointment.appointment_date}
                      </p>
                      <p className="text-[#089bab]">
                        Symptoms: {appointment.symptoms}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => openModal(appointment)}
                        className="mt-4 bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                      >
                        View detail
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No upcoming appointments.</p>
              )}
            </div>
          </div>

          {/* Bottom Section: Past Appointments */}
          <div>
            <h3 className="text-lg font-bold text-black mb-4">
              Past Appointments
            </h3>
            <div className="space-y-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white flex justify-between items-center shadow rounded-lg p-6"
                  >
                    <div>
                      {user?.role === "doctor" ? (
                        <h4 className="text-md font-semibold text-black">
                          Patient: {appointment.patients.username}
                        </h4>
                      ) : (
                        <h4 className="text-md font-semibold text-black">
                          Doctor: {appointment.doctors.username}
                        </h4>
                      )}
                      <p className="text-[#089bab]">
                        Time: {appointment.appointment_time}
                      </p>
                      <p className="text-[#089bab]">
                        Date: {appointment.appointment_date}
                      </p>
                      <p className="text-[#089bab]">
                        Symptoms: {appointment.symptoms}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => openModal(appointment)}
                        className="mt-4 bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
                      >
                        View Detail
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No past appointments.</p>
              )}
            </div>
          </div>

          <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            contentLabel="Appointment Details"
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            {selectedAppointment && (
              <div className="p-6 space-y-6 h-full flex flex-col">
                <button
                  onClick={closeModal}
                  className="text-[#089bab] mb-4 self-end"
                >
                  Close
                </button>
                <div className="flex flex-col lg:flex-row lg:justify-center lg:space-x-8 h-full">
                  {/* Patient/Doctor's Info */}
                  <div className="w-full lg:w-1/2 flex flex-col">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center lg:text-left">
                      {user?.role === "doctor"
                        ? `Patient: ${selectedAppointment.patients.username}`
                        : `Doctor: ${selectedAppointment.doctors.username}`}
                    </h2>
                    <p className="text-[#089bab]  text-md mb-1 text-center lg:text-left">
                      {user?.role === "doctor"
                        ? `Phone: ${selectedAppointment.patients.phone_number}`
                        : `Specialization: ${selectedAppointment.doctors.specialization}`}
                    </p>
                    <div className="text-center lg:text-left mt-4">
                      {user?.role === "doctor" ? (
                        <>
                          <p className="text-gray-600">
                            DOB: {selectedAppointment.patients?.dob}
                          </p>
                          <p className="text-gray-600">
                            Gender: {selectedAppointment.patients?.gender}
                          </p>
                          <p className="text-gray-600">
                            Address: {selectedAppointment.patients?.address}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600">
                            Phone: {selectedAppointment.doctors?.phone_number}
                          </p>
                          <p className="text-gray-600">
                            Address: {selectedAppointment.doctors?.address}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="w-full lg:w-1/2 flex flex-col mt-6 lg:mt-0">
                    <h3 className="text-xl font-semibold text-[#089bab] mb-6 text-center lg:text-left">
                      Appointment Details
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[#089bab] font-bold mb-2">
                          Appointment Date:
                        </label>
                        <p className="p-3 border border-[#089bab] rounded-lg">
                          {selectedAppointment.appointment_date}
                        </p>
                      </div>
                      <div>
                        <label className="block text-[#089bab] font-bold mb-2">
                          Appointment Time:
                        </label>
                        <p className="p-3 border border-[#089bab] rounded-lg">
                          {selectedAppointment.appointment_time}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-[#089bab] font-bold mb-2">
                        Symptoms:
                      </label>
                      <p className="p-4 border border-[#089bab] rounded-lg">
                        {selectedAppointment.symptoms}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
