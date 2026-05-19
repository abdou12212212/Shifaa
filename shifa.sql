-- ============================================================
-- SQL Schema for ShiifaMed Application
-- Complete Database Schema
-- ============================================================

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    user_type ENUM('Patient', 'Doctor', 'Assistant', 'Admin') NOT NULL,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 2. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Patients (
    patient_id INT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    blood_type VARCHAR(5),
    allergies TEXT,
    chronic_diseases TEXT,
    FOREIGN KEY (patient_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 3. DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Doctors (
    doctor_id INT PRIMARY KEY,
    specialization VARCHAR(255),
    clinic_address VARCHAR(255),
    consultation_fee DECIMAL(10, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    years_of_experience INT,
    FOREIGN KEY (doctor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. ASSISTANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Assistants (
    assistant_id INT PRIMARY KEY,
    current_location VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (assistant_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. ADMINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Admins (
    admin_id INT PRIMARY KEY,
    role VARCHAR(100),
    FOREIGN KEY (admin_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. ADDRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
);

-- ============================================================
-- 7. MEDICAL TESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Medical_Tests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    test_code VARCHAR(100) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    pre_test_instructions TEXT,
    sample_type VARCHAR(100),
    container_type VARCHAR(100),
    turnaround_time VARCHAR(100),
    result_turnaround_time VARCHAR(100),
    urgent_test_name VARCHAR(255),
    normal_range VARCHAR(255),
    unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 8. APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_ref_id VARCHAR(20) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT,
    assistant_id INT,
    address_id INT NOT NULL,
    appointment_datetime DATETIME NOT NULL,
    status ENUM(
        'Pending Confirmation',
        'Upcoming',
        'In Progress',
        'Completed',
        'Cancelled'
    ) NOT NULL DEFAULT 'Pending Confirmation',
    payment_method ENUM('Cash', 'Card', 'Not Selected') NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    patient_notes TEXT,
    lab_notes TEXT,
    prescription_url VARCHAR(255),
    test_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
    FOREIGN KEY (assistant_id) REFERENCES Assistants(assistant_id),
    FOREIGN KEY (address_id) REFERENCES Addresses(address_id)
);

-- ============================================================
-- 9. APPOINTMENT TESTS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Appointment_Tests (
    appointment_id INT NOT NULL,
    test_id INT NOT NULL,
    PRIMARY KEY (appointment_id, test_id),
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES Medical_Tests(test_id)
);

-- ============================================================
-- 10. TEST RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Test_Results (
    result_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    test_id INT NOT NULL,
    result_file_url VARCHAR(255) NOT NULL,
    result_data TEXT,
    result_value VARCHAR(100),
    is_normal BOOLEAN,
    notes TEXT,
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES Medical_Tests(test_id),
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)
);

-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Appointment', 'Result', 'Payment', 'System') DEFAULT 'System',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 12. APPOINTMENT HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Appointment_History (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES Users(user_id)
);

-- ============================================================
-- 13. TEST IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Test_Images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    test_id INT,
    image_url VARCHAR(255) NOT NULL,
    image_type ENUM('prescription', 'test_image', 'result') DEFAULT 'test_image',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES Medical_Tests(test_id)
);

-- ============================================================
-- 14. PASSWORD RESETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_otp (phone_number, otp_code)
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Insert sample medical tests
INSERT IGNORE INTO Medical_Tests (test_code, test_name, description, price, sample_type, container_type, turnaround_time, normal_range, unit) VALUES
('CBC01', 'Complete Blood Count', 'Measures red and white blood cells, hemoglobin, and platelets', 500.00, 'Blood', 'EDTA Tube', '4 hours', 'WBC: 4-11, RBC: 4.5-5.9', 'K/µL'),
('GLU01', 'Blood Glucose', 'Measures blood sugar levels', 200.00, 'Blood', 'Fluoride Tube', '2 hours', '70-100', 'mg/dL'),
('LIP01', 'Lipid Profile', 'Measures cholesterol, triglycerides, HDL, LDL', 800.00, 'Blood', 'Plain Tube', '8 hours', 'Total Chol: <200', 'mg/dL'),
('LFT01', 'Liver Function Test', 'Measures liver enzymes and function', 1200.00, 'Blood', 'Plain Tube', '6 hours', 'ALT: 10-40, AST: 10-40', 'U/L'),
('RFT01', 'Renal Function Test', 'Measures kidney function', 900.00, 'Blood', 'Plain Tube', '6 hours', 'Creatinine: 0.6-1.2', 'mg/dL'),
('TSH01', 'Thyroid Stimulating Hormone', 'Measures thyroid function', 600.00, 'Blood', 'Plain Tube', '24 hours', '0.4-4.0', 'mIU/L'),
('U/A01', 'Urine Analysis', 'Complete urinalysis', 300.00, 'Urine', 'Sterile Container', '2 hours', 'Various', ''),
('PCR01', 'C-Reactive Protein', 'Measures inflammation', 400.00, 'Blood', 'Plain Tube', '4 hours', '<10', 'mg/L');

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON Appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON Appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON Appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON Appointments(status);
CREATE INDEX IF NOT EXISTS idx_test_results_appointment ON Test_Results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id, is_read);

-- ============================================================
-- VIEW FOR APPOINTMENT DETAILS
-- ============================================================

CREATE OR REPLACE VIEW v_appointment_details AS
SELECT 
    a.*,
    u.full_name as patient_name,
    u.phone_number as patient_phone,
    d.full_name as doctor_name,
    doc.specialization as doctor_specialization,
    ad.address_line1,
    ad.address_line2,
    ad.city,
    GROUP_CONCAT(DISTINCT mt.test_name SEPARATOR ', ') as test_names,
    COUNT(DISTINCT tr.result_id) as results_count
FROM Appointments a
JOIN Patients p ON a.patient_id = p.patient_id
JOIN Users u ON p.patient_id = u.user_id
LEFT JOIN Doctors doc ON a.doctor_id = doc.doctor_id
LEFT JOIN Users d ON doc.doctor_id = d.user_id
LEFT JOIN Addresses ad ON a.address_id = ad.address_id
LEFT JOIN Appointment_Tests at ON a.appointment_id = at.appointment_id
LEFT JOIN Medical_Tests mt ON at.test_id = mt.test_id
LEFT JOIN Test_Results tr ON a.appointment_id = tr.appointment_id
GROUP BY a.appointment_id;

-- ============================================================
-- STORED PROCEDURE 
-- ============================================================

DROP PROCEDURE IF EXISTS GetAppointmentsByCategory;
DELIMITER //
CREATE PROCEDURE GetAppointmentsByCategory(IN category VARCHAR(20))
BEGIN
    IF category = 'programmed' THEN
        SELECT * FROM v_appointment_details 
        WHERE status = 'Pending Confirmation'
        ORDER BY appointment_datetime ASC;
    ELSEIF category = 'coming' THEN
        SELECT * FROM v_appointment_details 
        WHERE status IN ('Upcoming', 'In Progress')
        AND appointment_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
        ORDER BY appointment_datetime ASC;
    ELSEIF category = 'old' THEN
        -- ✅ التعديل هنا: يشمل المكتملة والملغاة
        SELECT * FROM v_appointment_details 
        WHERE status IN ('Completed', 'Cancelled')
        ORDER BY appointment_datetime DESC;
    ELSEIF category = 'results' THEN
        SELECT * FROM v_appointment_details 
        WHERE status = 'Completed'
        AND results_count > 0
        ORDER BY updated_at DESC;
    END IF;
END//
DELIMITER ;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_appointment_status;
DELIMITER //
CREATE TRIGGER update_appointment_status
BEFORE UPDATE ON Appointments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO Appointment_History (appointment_id, old_status, new_status, changed_at)
        VALUES (OLD.appointment_id, OLD.status, NEW.status, NOW());
    END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS set_updated_at;
DELIMITER //
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON Appointments
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END//
DELIMITER ;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT '✅ ShiifaMed Database Schema Created Successfully!' AS Status;
SELECT COUNT(*) AS TotalTables FROM information_schema.tables WHERE table_schema = DATABASE();