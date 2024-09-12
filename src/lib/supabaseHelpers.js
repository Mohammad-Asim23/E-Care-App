"use server";

import { supabase } from "../utils/supabase/client";
import { v2 as cloudinary } from "cloudinary";
import { sendEmail } from "./emailService";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

// Helper function to create a user in the database
export async function createUserInDatabase(email, password, role) {
  try {
    // Check if a user with the same email already exists
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (findError && findError.code !== "PGRST116") {
      // If an error occurred during the query and it's not a "No rows found" error, throw the error
      throw findError;
    }

    if (existingUser) {
      // If a user already exists, throw a custom error
      throw new Error("Email is already registered. Please sign in.");
    }

    // Insert the new user into the 'users' table
    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert([{ email, role, password }])
      .select()
      .single();

    if (insertError) throw insertError;

    return user;
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw error;
  }
}

export async function insertPersonalInfo(role, userId, formData) {
  try {
    const insertData = {
      user_id: userId,
      username: formData.username,
      phone_number: formData.phone_number,
      dob: formData.dob,
      gender: formData.gender,
      address: formData.address,
    };

    if (role === "doctor") {
      insertData.specialization = formData.specialization;
      insertData.available_time_from = formData.available_time_from;
      insertData.available_time_to = formData.available_time_to;
    } else if (role === "patient") {
      insertData.family_medical_history = formData.family_medical_history;
      insertData.past_medical_history = formData.past_medical_history;
    }

    const tableName = role === "labuser" ? "lab_users" : `${role}s`;
    const { data, error } = await supabase.from(tableName).insert([insertData]);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error inserting personal info:", error.message);
    throw error;
  }
}

export async function findUserByEmailAndValidatePassword(email, password) {
  try {
    // Look up the user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error finding user:", error.message);
      return null;
    }

    // Simple password validation (this assumes the password is stored in plain text)
    if (user.password !== password) {
      console.error("Invalid password");
      return null;
    }

    // Return user details if password is valid
    return {
      id: user.id,
      name: user.name, // Adjust as per your table structure
      email: user.email,
      role: user.role, // Assuming you have a role field
    };
  } catch (error) {
    console.error("Error during authentication:", error.message);
    return null;
  }
}

export async function fetchUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("profile")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }
}

export async function fetchDoctorById(doctorId) {
  try {
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select(
        "id, username, specialization, phone_number, dob, gender, address, user_id, available_time_from, available_time_to"
      )
      .eq("id", doctorId)
      .single();

    if (doctorError) throw doctorError;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("profile")
      .eq("id", doctor.user_id)
      .single();

    if (userError) throw userError;

    return { ...doctor, profile: user.profile || "/doctor.jpg" };
  } catch (error) {
    console.error("Error fetching doctor by ID:", error.message);
    return null;
  }
}

export async function fetchDoctorsForPatient() {
  try {
    const { data, error } = await supabase.from("doctors").select(`
      id, 
      username, 
      phone_number, 
      dob, 
      gender, 
      specialization, 
      address, 
      user_id,
      available_time_from,
      available_time_to,
      users (
        profile
      )
    `);

    if (error) throw error;

    const doctorsWithProfile = data.map((doctor) => ({
      ...doctor,
      profile: doctor.users?.profile || "/doctor.jpg",
    }));

    return doctorsWithProfile;
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    return [];
  }
}

export async function fetchDoctorAppointmentsByDate(doctorId, date) {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_time, appointment_date")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", date)
      .eq("acceptance", true); // Ensure only accepted appointments are fetched

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(
      "Error fetching doctor's appointments for the date:",
      error.message
    );
    return [];
  }
}

export async function createAppointment(appointmentData) {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms,
    } = appointmentData;

    const insertData = {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms, // Directly use the symptoms passed
      acceptance: false,
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    throw error;
  }
}

export async function fetchPatientByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from("patients") // Assuming 'patients' is the table name
      .select(
        "id, username, phone_number, gender,dob, address, family_medical_history, past_medical_history"
      )
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching patient data:", error.message);
    return null;
  }
}

export async function fetchAllPatients() {
  try {
    const { data, error } = await supabase.from("patients").select(`
        id,
        username,
        phone_number,
        address,
        user_id,
        users (
          profile
        )
      `);

    if (error) throw error;

    // Map through the patients and add the profile picture (or default if not present)
    const patientsWithProfile = data.map((patient) => ({
      ...patient,
      profile: patient.users?.profile || "/patient.png", // Use default image if no profile picture
    }));

    return patientsWithProfile;
  } catch (error) {
    console.error("Error fetching patients:", error.message);
    return [];
  }
}

export async function fetchLabUserByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from("lab_users") // Assuming 'lab_users' is the table name
      .select("id, username, phone_number, dob, gender, address")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching lab user data:", error.message);
    return null;
  }
}

export async function fetchPatientAppointments(patientId) {
  try {
    const currentDate = new Date().toISOString();

    // Fetch upcoming appointments where acceptance is true
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from("appointments")
      .select(
        `id, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        acceptance, 
        doctors (
          id, 
          username, 
          phone_number, 
          specialization
        )`
      )
      .eq("patient_id", patientId)
      .eq("acceptance", true)
      .gt("appointment_date", currentDate)
      .order("appointment_date", { ascending: true });

    if (upcomingError) throw upcomingError;

    // Fetch past appointments where acceptance is true
    const { data: pastAppointments, error: pastError } = await supabase
      .from("appointments")
      .select(
        `id, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        acceptance, 
        doctors (
          id, 
          username, 
          phone_number, 
          specialization
        )`
      )
      .eq("patient_id", patientId)
      .eq("acceptance", true)
      .lte("appointment_date", currentDate)
      .order("appointment_date", { ascending: false });

    if (pastError) throw pastError;

    return { upcomingAppointments, pastAppointments };
  } catch (error) {
    console.error("Error fetching patient appointments:", error.message);
    return { upcomingAppointments: [], pastAppointments: [] };
  }
}

export async function fetchDoctorAppointments(doctorId) {
  try {
    const currentDate = new Date().toISOString();

    // Fetch upcoming appointments where acceptance is true
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from("appointments")
      .select(
        `id, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        acceptance, 
        patients (
          id, 
          username, 
          phone_number, 
          dob, 
          gender, 
          address
        )`
      )
      .eq("doctor_id", doctorId)
      .eq("acceptance", true)
      .gt("appointment_date", currentDate)
      .order("appointment_date", { ascending: true });

    if (upcomingError) throw upcomingError;

    // Fetch past appointments where acceptance is true
    const { data: pastAppointments, error: pastError } = await supabase
      .from("appointments")
      .select(
        `id, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        acceptance, 
        patients (
          id, 
          username, 
          phone_number, 
          dob, 
          gender, 
          address
        )`
      )
      .eq("doctor_id", doctorId)
      .eq("acceptance", true)
      .lte("appointment_date", currentDate)
      .order("appointment_date", { ascending: false });

    if (pastError) throw pastError;

    return { upcomingAppointments, pastAppointments };
  } catch (error) {
    console.error("Error fetching doctor appointments:", error.message);
    return { upcomingAppointments: [], pastAppointments: [] };
  }
}

export async function fetchDoctorByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from("doctors") // Assuming 'doctors' is the table name
      .select(
        "id, username,phone_number, gender, dob , address, specialization, available_time_from, available_time_to"
      )
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching doctor data:", error.message);
    return null;
  }
}

export async function fetchUnacceptedAppointments(doctorId) {
  try {
    // Fetch appointments where acceptance is false and include patient details
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id, 
        appointment_date, 
        appointment_time, 
        symptoms, 
        acceptance, 
        patients (
          id,
          username
        )
      `
      )
      .eq("doctor_id", doctorId)
      .eq("acceptance", false) // Fetch only unaccepted appointments
      .order("appointment_date", { ascending: true });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching unaccepted appointments:", error.message);
    return [];
  }
}

export async function acceptAppointment(appointmentId) {
  try {
    // Update the appointment's acceptance to true
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ acceptance: true })
      .eq("id", appointmentId)
      .select(
        `
        id, 
        appointment_date, 
        appointment_time, 
        patients (
          username, 
          user_id
        ),
        doctors (
          username,
          user_id
        )
      `
      )
      .single();

    if (error) throw error;

    // Fetch patient and doctor emails
    const { data: patientUser, error: patientError } = await supabase
      .from("users")
      .select("email")
      .eq("id", appointment.patients.user_id)
      .single();

    if (patientError) throw patientError;

    const { data: doctorUser, error: doctorError } = await supabase
      .from("users")
      .select("email")
      .eq("id", appointment.doctors.user_id)
      .single();

    if (doctorError) throw doctorError;

    const appointmentTime = appointment.appointment_time;
    const appointmentDate = appointment.appointment_date;
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`
    );

    const currentTime = new Date();
    const timeDifference =
      appointmentDateTime.getTime() - currentTime.getTime();

    // Determine when to send the reminder email
    const emailSendTime =
      timeDifference > 12 * 60 * 60 * 1000
        ? appointmentDateTime.getTime() - 12 * 60 * 60 * 1000 // 12 hours before the appointment
        : currentTime.getTime() + 5000; // Send in 5 seconds if less than 12 hours remain

    console.log("Scheduled email time:", new Date(emailSendTime));

    // Schedule the email reminders
    setTimeout(() => {
      const emailPromises = [
        sendEmail(
          patientUser.email,
          "Appointment Reminder",
          `Dear ${appointment.patients.username}, this is a reminder for your appointment with Dr. ${appointment.doctors.username} on ${appointmentDate} at ${appointmentTime}.`
        ),
        sendEmail(
          doctorUser.email,
          "Appointment Reminder",
          `Dear Dr. ${appointment.doctors.username}, this is a reminder for your appointment with ${appointment.patients.username} on ${appointmentDate} at ${appointmentTime}.`
        ),
      ];

      Promise.all(emailPromises)
        .then(() => console.log("Reminder emails sent successfully"))
        .catch((error) =>
          console.error("Error sending reminder emails:", error)
        );
    }, emailSendTime - currentTime.getTime());

    return appointment;
  } catch (error) {
    console.error("Error accepting appointment:", error.message);
    throw error;
  }
}

export async function cancelAppointment(appointmentId) {
  try {
    // Delete the appointment
    const { data, error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error canceling appointment:", error.message);
    throw error;
  }
}

export async function uploadProfilePicture(userId, file, role) {
  try {
    // Upload the file to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "profile_pictures" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      file.arrayBuffer().then((arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer);
        uploadStream.end(buffer);
      });
    });

    // Update the user's profile with the new profile picture URL
    const { data, error } = await supabase
      .from("users")
      .update({ profile: result.secure_url })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

export async function updateUserProfile(userId, role, formValues) {
  try {
    // Update the 'users' table for email, if it has changed
    if (formValues.email) {
      const { data: userUpdate, error: userUpdateError } = await supabase
        .from("users")
        .update({
          email: formValues.email,
        })
        .eq("id", userId);

      if (userUpdateError) throw userUpdateError;
    }

    // Update the role-specific table (exclude email field)
    const tableName =
      role === "doctor"
        ? "doctors"
        : role === "patient"
        ? "patients"
        : "lab_users";
    const { email, ...roleSpecificData } = formValues; // Exclude email

    const { data, error } = await supabase
      .from(tableName)
      .update(roleSpecificData)
      .eq("user_id", userId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    throw error;
  }
}

export async function createConsultation(consultationData) {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .insert([consultationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating consultation:", error.message);
    throw error;
  }
}

export async function fetchPatientConsultations(userId) {
  try {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError) throw patientError;

    const { data, error } = await supabase
      .from("consultations")
      .select(
        "id, doctor_id, disease, access_allowed, prescription, consulted_time, doctors(username)"
      )
      .eq("patient_id", patient.id);

    if (error) throw error;

    return data.map((consultation) => ({
      ...consultation,
      doctor_name: consultation.doctors.username,
    }));
  } catch (error) {
    console.error("Error fetching consultations:", error.message);
    return [];
  }
}

export async function deleteConsultation(consultationId) {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .delete()
      .eq("id", consultationId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error deleting consultation:", error.message);
    throw error;
  }
}

export async function updateConsultation(consultationId, updatedData) {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .update(updatedData)
      .eq("id", consultationId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating consultation:", error.message);
    throw error;
  }
}

// Fetch consultations for a specific doctor by user ID
export async function fetchDoctorConsultations(userId) {
  try {
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (doctorError) throw doctorError;

    const { data, error } = await supabase
      .from("consultations")
      .select(
        `
        id,
        patient_id,
        disease,
        prescription,
        consulted_time,
        access_allowed,
        patients (
          username,
          phone_number,
          family_medical_history,
          past_medical_history
        )
      `
      )
      .eq("doctor_id", doctor.id);

    if (error) throw error;

    return data.map((consultation) => ({
      ...consultation,
      patient_name: consultation.patients.username,
      patient_phone: consultation.patients.phone_number,
      family_medical_history: consultation.patients.family_medical_history,
      past_medical_history: consultation.patients.past_medical_history,
    }));
  } catch (error) {
    console.error("Error fetching doctor consultations:", error.message);
    return [];
  }
}

// Fetch consultations by patient ID
export async function fetchConsultationsByPatientId(patientId) {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .select("disease, prescription, consulted_time")
      .eq("patient_id", patientId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching consultations by patient ID:", error.message);
    return [];
  }
}

// Update consultation with a prescription
export async function updateConsultationPrescription(
  consultationId,
  prescription
) {
  try {
    const { data, error } = await supabase
      .from("consultations")
      .update({ prescription })
      .eq("id", consultationId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating prescription:", error.message);
    throw error;
  }
}

export async function fetchPatientProfile(patientId) {
  try {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("user_id")
      .eq("id", patientId)
      .single();

    if (patientError) throw patientError;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("profile")
      .eq("id", patient.user_id)
      .single();

    if (userError) throw userError;

    return user;
  } catch (error) {
    console.error("Error fetching patient profile:", error.message);
    return null;
  }
}

export async function uploadReportForPatient(
  patientId,
  labUserId,
  base64Image,
  title
) {
  try {
    // Upload the image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Image}`,
        { folder: "lab_reports" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Insert the lab report into the database
    const { data, error } = await supabase.from("labreports").insert({
      patient_id: patientId,
      lab_user_id: labUserId,
      report_url: result.secure_url,
      title,
      send_time: new Date().toISOString(),
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error uploading lab report:", error);
    throw error;
  }
}

export async function fetchLabReportsByUserId(userId) {
  try {
    // First, fetch the lab user details using the provided user ID
    const { data: labUser, error: labUserError } = await supabase
      .from("lab_users")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (labUserError) throw labUserError;

    const labUserId = labUser.id;

    // Then, fetch the lab reports associated with the lab user ID
    const { data, error } = await supabase
      .from("labreports")
      .select(
        `
        id,
        patient_id,
        title,
        send_time,
        report_url,
        patients (
          username
        )
      `
      )
      .eq("lab_user_id", labUserId)
      .order("send_time", { ascending: false });

    if (error) throw error;

    // Map and return the data with relevant details
    return data.map((report) => ({
      id: report.id,
      patientName: report.patients.username,
      title: report.title,
      sendTime: report.send_time,
      reportUrl: report.report_url,
    }));
  } catch (error) {
    console.error("Error fetching lab reports:", error.message);
    return [];
  }
}

export async function fetchLabReportsForUser(userId) {
  try {
    // Step 1: Get the patient ID associated with the user ID
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError) throw patientError;

    const patientId = patient.id;

    // Step 2: Fetch lab reports using the patient ID
    const { data, error } = await supabase
      .from("labreports")
      .select(
        `
        id,
        title,
        send_time,
        report_url,
        lab_users (
          username
        )
      `
      )
      .eq("patient_id", patientId)
      .order("send_time", { ascending: false });

    if (error) throw error;

    // Map and return the data with relevant details
    return data.map((report) => ({
      id: report.id,
      title: report.title,
      sendTime: report.send_time,
      reportUrl: report.report_url,
      labUserName: report.lab_users.username,
    }));
  } catch (error) {
    console.error("Error fetching lab reports:", error.message);
    return [];
  }
}
