-- SQL Schema for ShiifaMed Application
-- This schema is designed based on the provided PDF, covering users, tests, appointments, and results.

-- Table to store all users of the application (Patients, Doctors, Assistants, Admins)
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('Patient', 'Doctor', 'Assistant', 'Admin') NOT NULL,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table to store additional details for Patients
CREATE TABLE Patients (
    patient_id INT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    FOREIGN KEY (patient_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Table to store additional details for Doctors
CREATE TABLE Doctors (
    doctor_id INT PRIMARY KEY,
    clinic_address VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE, -- Admin must verify the doctor
    is_featured BOOLEAN DEFAULT FALSE, -- For highlighting top doctors
    FOREIGN KEY (doctor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Table to store additional details for Assistants (Phlebotomists)
CREATE TABLE Assistants (
    assistant_id INT PRIMARY KEY,
    -- You can add more fields here if needed, like current location for logistics
    FOREIGN KEY (assistant_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Table to store patient addresses for sample collection
CREATE TABLE Addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL, -- e.g., 'Hay Mostakbal'
    address_line2 VARCHAR(255),       -- e.g., 'Building 630, Apartment 212'
    city VARCHAR(100),
    is_default BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
);

-- Table to store the catalog of available medical tests
CREATE TABLE Medical_Tests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    test_code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'ACE01/ACA01'
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    pre_test_instructions TEXT, -- e.g., 'Must be fasting for 12 hours'
    sample_type VARCHAR(100),   -- e.g., 'Blood', 'Urine'
    container_type VARCHAR(100), -- e.g., 'EDTA Tube'
    turnaround_time VARCHAR(100), -- e.g., '24 hours'
    result_turnaround_time VARCHAR(100), -- e.g., '48 hours'
    urgent_test_name VARCHAR(255), -- e.g., 'Urgent Blood Test'
    is_active BOOLEAN DEFAULT TRUE
);

-- Table for booking appointments
CREATE TABLE Appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_ref_id VARCHAR(20) UNIQUE NOT NULL, -- A user-friendly ID like '#1111111'
    patient_id INT NOT NULL,
    doctor_id INT, -- Optional: a doctor can request a test for a patient
    assistant_id INT, -- To be assigned for sample collection
    address_id INT NOT NULL, -- The address for sample collection
    appointment_datetime DATETIME NOT NULL,
    status ENUM(
        'Pending Confirmation', -- Waiting for admin/doctor approval
        'Upcoming',             -- Confirmed and scheduled
        'In Progress',          -- Assistant is on the way or sample is being processed
        'Completed',            -- Results are ready
        'Cancelled'             -- Cancelled by user or admin
    ) NOT NULL DEFAULT 'Pending Confirmation',
    payment_method ENUM('Cash', 'Card', 'Not Selected') NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    patient_notes TEXT, -- Notes from the patient during booking
    lab_notes TEXT, -- Notes for the patient from the lab/doctor
    prescription_url VARCHAR(255), -- If the patient uploads a prescription
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
    FOREIGN KEY (assistant_id) REFERENCES Assistants(assistant_id),
    FOREIGN KEY (address_id) REFERENCES Addresses(address_id)
);

-- Junction table to link multiple tests to a single appointment
CREATE TABLE Appointment_Tests (
    appointment_id INT NOT NULL,
    test_id INT NOT NULL,
    PRIMARY KEY (appointment_id, test_id),
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES Medical_Tests(test_id)
);

-- Table to store the results of the tests
CREATE TABLE Test_Results (
    result_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    test_id INT DEFAULT NULL,
    result_file_url VARCHAR(255) NOT NULL, -- URL to the PDF result file
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES Medical_Tests(test_id)
);

-- Table for sending notifications to users
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
-- Table for Admins, linking to the Users table
CREATE TABLE Admins (
  admin_id INT PRIMARY KEY,
  FOREIGN KEY (admin_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
