# Admin API Documentation

## Overview
This documentation provides comprehensive details about all Admin endpoints in the Shifa application. All endpoints require Admin authentication via JWT token.

**Base URL:** `/admin`

**Authentication:** All endpoints require the `authenticateAdmin` middleware which:
- Verifies JWT token in the Authorization header
- Checks that `user_type` is 'Admin'
- Attaches user information to `req.user`

---

## Table of Contents
1. [Dashboard & Statistics](#dashboard--statistics)
2. [Appointment Management](#appointment-management)
3. [Patient Management](#patient-management)
4. [Doctor Management](#doctor-management)
5. [Assistant Management](#assistant-management)
6. [Test Management](#test-management)
7. [Error Handling](#error-handling)

---

## Dashboard & Statistics

### Get Dashboard Statistics
Retrieves overall system statistics for the admin dashboard.

**Endpoint:** `GET /admin/dashboard/stats`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": 150,
    "doctors": 25,
    "assistants": 10,
    "portfolio": 125000.50
  }
}
```

**Fields:**
- `patients`: Total count of active patients
- `doctors`: Total count of verified active doctors
- `assistants`: Total count of active assistants
- `portfolio`: Total revenue from completed appointments

**Controller:** [Admin1.js:10](controllers/Admin/Admin1.js#L10)

---

## Appointment Management

### 1. Get Pending Appointments
Retrieves appointments awaiting confirmation.

**Endpoint:** `GET /admin/appointments/pending`

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number for pagination |
| limit | integer | 10 | Items per page (max: 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "appointment_id": 101,
        "phone_number": "appointment_ref_id",
        "name": "محمد أحمد",
        "address_line1": "شارع الجامعة",
        "address_line2": "عمارة 12",
        "status": "Pending Confirmation",
        "appointment_datetime": "2025-10-25T10:00:00.000Z",
        "total_cost": 150.00
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Controller:** [Admin1.js:71](controllers/Admin/Admin1.js#L71)

---

### 2. Update Appointment Status
Updates the status of an appointment and notifies the patient.

**Endpoint:** `PUT /admin/appointments/:appointmentId/status`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `appointmentId` (integer): The ID of the appointment

**Request Body:**
```json
{
  "status": "Upcoming",
  "lab_notes": "Optional notes from the lab"
}
```

**Valid Status Values:**
- `Pending Confirmation`
- `Upcoming`
- `In Progress`
- `Completed`
- `Cancelled`

**Response:**
```json
{
  "success": true,
  "message": "Appointment status updated successfully"
}
```

**Side Effects:**
- Creates a notification for the patient in Arabic
- Updates appointment record in database

**Controller:** [Admin1.js:236](controllers/Admin/Admin1.js#L236)

---

### 3. Delete Appointment
Permanently deletes an appointment and notifies the patient.

**Endpoint:** `DELETE /admin/appointments/:appointmentId`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `appointmentId` (integer): The ID of the appointment

**Response:**
```json
{
  "success": true,
  "message": "Appointment deleted successfully"
}
```

**Side Effects:**
- Permanently deletes the appointment
- Sends cancellation notification to patient

**Controller:** [Admin1.js:420](controllers/Admin/Admin1.js#L420)

---

### 4. Get All Appointments (Admin5)
Retrieves appointments with advanced filtering capabilities.

**Endpoint:** `GET /admin/appointments`

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by patient name, phone, or appointment reference |
| status | string | Filter by status (default: 'all') |
| date_from | date | Filter appointments from this date (YYYY-MM-DD) |
| date_to | date | Filter appointments until this date (YYYY-MM-DD) |
| assistant_id | integer | Filter by assigned assistant |
| doctor_id | integer | Filter by assigned doctor |

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "appointment_id": 101,
        "appointment_ref_id": "APP-2025-001",
        "appointment_datetime": "2025-10-25T10:00:00.000Z",
        "status": "Upcoming",
        "total_cost": 250.00,
        "payment_method": "Cash",
        "is_urgent": false,
        "patient_notes": "Patient notes here",
        "lab_notes": "Lab notes here",
        "created_at": "2025-10-20T08:00:00.000Z",
        "patient_name": "محمد أحمد",
        "patient_phone": "0123456789",
        "address_line1": "شارع الجامعة",
        "address_line2": "عمارة 12",
        "city": "الرياض",
        "assistant_name": "فاطمة علي",
        "assistant_phone": "0123456780",
        "doctor_name": "د. أحمد حسن",
        "tests": "فحص دم, تحليل بول"
      }
    ]
  }
}
```

**Controller:** [Admin5.js:4](controllers/Admin/Admin5.js#L4)

---

### 5. Get Appointment Details
Retrieves detailed information about a specific appointment including tests and results.

**Endpoint:** `GET /admin/appointments/:appointmentId`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "appointment_id": 101,
      "patient_name": "محمد أحمد",
      "patient_phone": "0123456789",
      "date_of_birth": "1990-05-15",
      "gender": "Male",
      "address_line1": "شارع الجامعة",
      "address_line2": "عمارة 12",
      "city": "الرياض",
      "assistant_name": "فاطمة علي",
      "assistant_phone": "0123456780",
      "doctor_name": "د. أحمد حسن",
      "doctor_phone": "0123456790"
    },
    "tests": [
      {
        "test_id": 1,
        "test_name": "فحص دم شامل",
        "test_code": "CBC",
        "price": 100.00,
        "sample_type": "Blood",
        "turnaround_time": "24 hours"
      }
    ],
    "results": [
      {
        "result_id": 1,
        "test_id": 1,
        "result_file_url": "https://example.com/results/file.pdf",
        "uploaded_at": "2025-10-26T14:00:00.000Z",
        "test_name": "فحص دم شامل"
      }
    ]
  }
}
```

**Controller:** [Admin5.js:101](controllers/Admin/Admin5.js#L101)

---

### 6. Update Appointment Status (Admin5)
Alternative endpoint for updating appointment status with lab notes.

**Endpoint:** `PATCH /admin/appointments/:appointmentId/status`

**Request Body:**
```json
{
  "status": "In Progress",
  "lab_notes": "Sample collected successfully"
}
```

**Controller:** [Admin5.js:181](controllers/Admin/Admin5.js#L181)

---

### 7. Assign Assistant to Appointment
Assigns an active assistant to an appointment.

**Endpoint:** `PATCH /admin/appointments/:appointmentId/assign-assistant`

**Request Body:**
```json
{
  "assistant_id": 5
}
```

**Validation:**
- Verifies assistant exists and is active
- Returns error if assistant not found or inactive

**Response:**
```json
{
  "success": true,
  "message": "تم تعيين المساعد بنجاح"
}
```

**Controller:** [Admin5.js:230](controllers/Admin/Admin5.js#L230)

---

### 8. Update Appointment Details
Updates various appointment details without changing status.

**Endpoint:** `PATCH /admin/appointments/:appointmentId`

**Request Body:**
```json
{
  "appointment_datetime": "2025-10-26T15:00:00.000Z",
  "patient_notes": "Updated patient notes",
  "lab_notes": "Updated lab notes",
  "is_urgent": true,
  "payment_method": "Credit Card"
}
```

**All fields are optional** - only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث بيانات الموعد بنجاح"
}
```

**Controller:** [Admin5.js:275](controllers/Admin/Admin5.js#L275)

---

### 9. Get Available Assistants
Retrieves list of active assistants sorted by workload.

**Endpoint:** `GET /admin/appointments/available-assistants`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 5,
      "full_name": "فاطمة علي",
      "phone_number": "0123456780",
      "active_appointments": 3
    }
  ]
}
```

**Note:** Assistants are sorted by `active_appointments` (ascending) to show least busy assistants first.

**Controller:** [Admin5.js:348](controllers/Admin/Admin5.js#L348)

---

### 10. Get Appointment Statistics
Retrieves comprehensive statistics for the last 30 days.

**Endpoint:** `GET /admin/appointments/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_appointments": 150,
    "pending_appointments": 10,
    "upcoming_appointments": 25,
    "in_progress_appointments": 5,
    "completed_appointments": 100,
    "cancelled_appointments": 10,
    "today_appointments": 8,
    "total_revenue": 25000.00
  }
}
```

**Controller:** [Admin5.js:379](controllers/Admin/Admin5.js#L379)

---

## Patient Management

### 1. Get All Patients
Retrieves paginated list of patients with search and filtering.

**Endpoint:** `GET /admin/patients`

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 12 | Items per page |
| search | string | '' | Search by name or phone |
| status | string | 'all' | Filter: 'all', 'active', 'inactive' |

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "user_id": 10,
        "full_name": "محمد أحمد",
        "phone_number": "0123456789",
        "gender": "Male",
        "date_of_birth": "1990-05-15",
        "created_at": "2025-01-15T10:00:00.000Z",
        "is_active": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 120,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Controller:** [Admin2.js:5](controllers/Admin/Admin2.js#L5)

---

### 2. Get Patient by ID
Retrieves detailed information about a specific patient.

**Endpoint:** `GET /admin/patients/:patientId`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 10,
    "full_name": "محمد أحمد",
    "phone_number": "0123456789",
    "profile_picture_url": "https://example.com/profile.jpg",
    "created_at": "2025-01-15T10:00:00.000Z",
    "is_active": true,
    "date_of_birth": "1990-05-15",
    "gender": "Male",
    "addresses": [
      {
        "address_id": 1,
        "address_line1": "شارع الجامعة",
        "address_line2": "عمارة 12",
        "city": "الرياض",
        "is_default": true
      }
    ],
    "total_appointments": 15
  }
}
```

**Controller:** [Admin2.js:73](controllers/Admin/Admin2.js#L73)

---

### 3. Create Patient
Creates a new patient account.

**Endpoint:** `POST /admin/patients`

**Request Body:**
```json
{
  "full_name": "محمد أحمد",
  "phone_number": "0123456789",
  "password": "SecurePassword123",
  "date_of_birth": "1990-05-15",
  "gender": "Male",
  "address_line1": "شارع الجامعة",
  "address_line2": "عمارة 12",
  "city": "الرياض"
}
```

**Required Fields:**
- `full_name`
- `phone_number`
- `password`
- `date_of_birth`
- `gender`

**Optional Fields:**
- `address_line1`
- `address_line2`
- `city`

**Response:**
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "user_id": 10
  }
}
```

**Validations:**
- Phone number must be unique
- Password is hashed with bcrypt (10 rounds)
- Transaction ensures data consistency

**Controller:** [Admin2.js:129](controllers/Admin/Admin2.js#L129)

---

### 4. Update Patient
Updates patient information.

**Endpoint:** `PUT /admin/patients/:patientId`

**Request Body:**
```json
{
  "full_name": "محمد أحمد",
  "phone_number": "0123456789",
  "date_of_birth": "1990-05-15",
  "gender": "Male",
  "is_active": true
}
```

**Validation:**
- Phone number uniqueness checked (excluding current patient)

**Response:**
```json
{
  "success": true,
  "message": "Patient updated successfully"
}
```

**Controller:** [Admin2.js:201](controllers/Admin/Admin2.js#L201)

---

### 5. Delete Patient (Soft Delete)
Deactivates a patient account.

**Endpoint:** `DELETE /admin/patients/:patientId`

**Business Rules:**
- Cannot delete patients with active appointments
- Active appointments include: 'Pending Confirmation', 'Upcoming', 'In Progress'
- Performs soft delete by setting `is_active = FALSE`

**Response:**
```json
{
  "success": true,
  "message": "Patient deactivated successfully"
}
```

**Error Response (if has active appointments):**
```json
{
  "success": false,
  "message": "Cannot delete patient with active appointments"
}
```

**Controller:** [Admin2.js:249](controllers/Admin/Admin2.js#L249)

---

### 6. Permanently Delete Patient
Permanently removes patient from database.

**Endpoint:** `DELETE /admin/patients/:patientId/permanent`

**Business Rules:**
- Cannot delete patients with ANY appointment history
- This is a hard delete (permanent removal)

**Response:**
```json
{
  "success": true,
  "message": "Patient permanently deleted"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Cannot permanently delete patient with appointment history"
}
```

**Controller:** [Admin2.js:283](controllers/Admin/Admin2.js#L283)

---

### 7. Reactivate Patient
Reactivates a previously deactivated patient.

**Endpoint:** `PUT /admin/patients/:patientId/reactivate`

**Response:**
```json
{
  "success": true,
  "message": "Patient reactivated successfully"
}
```

**Controller:** [Admin2.js:362](controllers/Admin/Admin2.js#L362)

---

### 8. Get Patient Statistics
Retrieves statistics about patients.

**Endpoint:** `GET /admin/patients/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 140,
    "inactive": 10,
    "newThisMonth": 12,
    "genderDistribution": [
      {
        "gender": "Male",
        "count": 75
      },
      {
        "gender": "Female",
        "count": 65
      }
    ]
  }
}
```

**Controller:** [Admin2.js:314](controllers/Admin/Admin2.js#L314)

---

## Doctor Management

### 1. Get Unverified Doctors
Retrieves doctors pending verification for recruitment.

**Endpoint:** `GET /admin/doctors/unverified`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max: 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "doctor_id": 20,
        "name": "د. أحمد حسن",
        "phone_number": "0123456790",
        "address": "عيادة النور الطبية",
        "status": false,
        "created_at": "2025-10-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 30,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Controller:** [Admin1.js:155](controllers/Admin/Admin1.js#L155)

---

### 2. Verify Doctor
Verifies or rejects a doctor's application.

**Endpoint:** `PUT /admin/doctors/:doctorId/verify`

**Request Body:**
```json
{
  "verify": true
}
```

**Parameters:**
- `verify` (boolean): `true` to verify, `false` to reject

**Response:**
```json
{
  "success": true,
  "message": "Doctor verified successfully"
}
```

**Side Effects:**
- Updates `is_verified` status in Doctors table
- Sends notification in Arabic:
  - If verified: "تم قبول طلبك - مرحباً بك في منصة شفاء"
  - If rejected: "تم رفض طلبك - يرجى التواصل مع الإدارة"

**Controller:** [Admin1.js:329](controllers/Admin/Admin1.js#L329)

---

### 3. Delete Doctor Application
Permanently deletes a doctor application.

**Endpoint:** `DELETE /admin/doctors/:doctorId`

**Response:**
```json
{
  "success": true,
  "message": "Doctor application deleted successfully"
}
```

**Side Effects:**
- Sends deletion notification to doctor
- Cascading delete removes doctor record

**Controller:** [Admin1.js:495](controllers/Admin/Admin1.js#L495)

---

### 4. Get All Doctors (Admin3)
Retrieves paginated list of doctors with advanced filtering.

**Endpoint:** `GET /admin/doctors`

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| page | integer | 1 | - |
| limit | integer | 12 | max: 100 |
| search | string | '' | Searches name & phone |
| status | string | 'all' | 'all', 'verified', 'unverified', 'active', 'inactive' |

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "user_id": 20,
        "full_name": "د. أحمد حسن",
        "phone_number": "0123456790",
        "profile_picture_url": "https://example.com/doctor.jpg",
        "created_at": "2025-01-10T08:00:00.000Z",
        "is_active": true,
        "clinic_address": "عيادة النور الطبية",
        "is_verified": true,
        "is_featured": false,
        "total_patients": 45
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 60,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Special Fields:**
- `total_patients`: Count of unique patients treated (completed appointments only)

**Controller:** [Admin3.js:6](controllers/Admin/Admin3.js#L6)

---

### 5. Get Doctor by ID
Retrieves detailed information about a specific doctor.

**Endpoint:** `GET /admin/doctors/:doctorId`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 20,
    "full_name": "د. أحمد حسن",
    "phone_number": "0123456790",
    "profile_picture_url": "https://example.com/doctor.jpg",
    "created_at": "2025-01-10T08:00:00.000Z",
    "is_active": true,
    "clinic_address": "عيادة النور الطبية",
    "is_verified": true,
    "is_featured": false,
    "statistics": {
      "total_appointments": 150,
      "completed_appointments": 130,
      "unique_patients": 45,
      "total_revenue": 32500.00
    }
  }
}
```

**Controller:** [Admin3.js:89](controllers/Admin/Admin3.js#L89)

---

### 6. Create Doctor
Creates a new doctor account.

**Endpoint:** `POST /admin/doctors`

**Request Body:**
```json
{
  "full_name": "د. أحمد حسن",
  "phone_number": "0123456790",
  "password": "SecurePassword123",
  "clinic_address": "عيادة النور الطبية",
  "is_verified": true,
  "is_featured": false
}
```

**Required Fields:**
- `full_name`
- `phone_number`
- `password`

**Optional Fields:**
- `clinic_address`
- `is_verified` (default: false)
- `is_featured` (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Doctor account created successfully",
  "data": {
    "user_id": 20
  }
}
```

**Side Effects:**
- Password is hashed with bcrypt
- Welcome notification sent in Arabic
- Transaction ensures data consistency

**Controller:** [Admin3.js:137](controllers/Admin/Admin3.js#L137)

---

### 7. Update Doctor
Updates doctor information.

**Endpoint:** `PUT /admin/doctors/:doctorId`

**Request Body:**
```json
{
  "full_name": "د. أحمد حسن",
  "phone_number": "0123456790",
  "clinic_address": "عيادة النور الطبية",
  "is_verified": true,
  "is_featured": false,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor information updated successfully"
}
```

**Side Effects:**
- If `is_verified` changes, notification is sent to doctor
- Phone number uniqueness validated

**Controller:** [Admin3.js:216](controllers/Admin/Admin3.js#L216)

---

### 8. Toggle Doctor Verification
Toggles the verification status of a doctor.

**Endpoint:** `PUT /admin/doctors/:doctorId/verify`

**Response:**
```json
{
  "success": true,
  "message": "Doctor verified successfully",
  "data": {
    "is_verified": true
  }
}
```

**Side Effects:**
- Toggles current verification status
- Sends notification to doctor

**Controller:** [Admin3.js:278](controllers/Admin/Admin3.js#L278)

---

### 9. Toggle Featured Status
Toggles whether a doctor is featured.

**Endpoint:** `PUT /admin/doctors/:doctorId/feature`

**Response:**
```json
{
  "success": true,
  "message": "Doctor featured successfully",
  "data": {
    "is_featured": true
  }
}
```

**Controller:** [Admin3.js:320](controllers/Admin/Admin3.js#L320)

---

### 10. Delete Doctor (Soft Delete)
Deactivates a doctor account.

**Endpoint:** `DELETE /admin/doctors/:doctorId`

**Business Rules:**
- Cannot delete doctors with active appointments
- Performs soft delete (`is_active = FALSE`)

**Response:**
```json
{
  "success": true,
  "message": "Doctor account deactivated successfully"
}
```

**Side Effects:**
- Sends deactivation notification

**Controller:** [Admin3.js:350](controllers/Admin/Admin3.js#L350)

---

### 11. Permanently Delete Doctor
Permanently removes doctor from database.

**Endpoint:** `DELETE /admin/doctors/:doctorId/permanent`

**Business Rules:**
- Cannot delete doctors with ANY appointment history
- Hard delete (permanent removal)

**Response:**
```json
{
  "success": true,
  "message": "Doctor permanently deleted"
}
```

**Controller:** [Admin3.js:394](controllers/Admin/Admin3.js#L394)

---

### 12. Reactivate Doctor
Reactivates a previously deactivated doctor.

**Endpoint:** `PUT /admin/doctors/:doctorId/reactivate`

**Response:**
```json
{
  "success": true,
  "message": "Doctor account reactivated successfully"
}
```

**Side Effects:**
- Sends reactivation welcome notification

**Controller:** [Admin3.js:425](controllers/Admin/Admin3.js#L425)

---

### 13. Get Doctor Statistics
Retrieves statistics about doctors.

**Endpoint:** `GET /admin/doctors/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "verified": 45,
    "unverified": 5,
    "featured": 10,
    "newThisMonth": 3
  }
}
```

**Controller:** [Admin3.js:455](controllers/Admin/Admin3.js#L455)

---

## Assistant Management

### 1. Get All Assistants
Retrieves all assistants with appointment counts.

**Endpoint:** `GET /admin/assistants`

**Response:**
```json
{
  "success": true,
  "data": {
    "assistants": [
      {
        "user_id": 5,
        "full_name": "فاطمة علي",
        "phone_number": "0123456780",
        "is_active": true,
        "created_at": "2025-01-05T10:00:00.000Z",
        "profile_picture_url": "https://example.com/assistant.jpg",
        "total_appointments": 25
      }
    ]
  }
}
```

**Controller:** [Admin4.js:6](controllers/Admin/Admin4.js#L6)

---

### 2. Create Assistant
Creates a new assistant account.

**Endpoint:** `POST /admin/assistants`

**Request Body:**
```json
{
  "full_name": "فاطمة علي",
  "phone_number": "0123456780",
  "password": "SecurePassword123"
}
```

**All fields are required.**

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء حساب المساعد بنجاح",
  "data": {
    "user_id": 5,
    "full_name": "فاطمة علي",
    "phone_number": "0123456780"
  }
}
```

**Validations:**
- Phone number must be unique
- Password hashed with bcrypt
- Uses database transaction

**Controller:** [Admin4.js:44](controllers/Admin/Admin4.js#L44)

---

### 3. Get Assistant Details
Retrieves detailed information about an assistant.

**Endpoint:** `GET /admin/assistants/:assistantId`

**Response:**
```json
{
  "success": true,
  "data": {
    "assistant": {
      "user_id": 5,
      "full_name": "فاطمة علي",
      "phone_number": "0123456780",
      "is_active": true,
      "created_at": "2025-01-05T10:00:00.000Z",
      "profile_picture_url": "https://example.com/assistant.jpg",
      "total_appointments": 25,
      "completed_appointments": 20,
      "in_progress_appointments": 2
    },
    "recentAppointments": [
      {
        "appointment_id": 101,
        "appointment_ref_id": "APP-2025-001",
        "appointment_datetime": "2025-10-25T10:00:00.000Z",
        "status": "Upcoming",
        "patient_name": "محمد أحمد",
        "address_line1": "شارع الجامعة",
        "city": "الرياض"
      }
    ]
  }
}
```

**Note:** Returns the 10 most recent appointments.

**Controller:** [Admin4.js:239](controllers/Admin/Admin4.js#L239)

---

### 4. Update Assistant Status
Activates or deactivates an assistant.

**Endpoint:** `PATCH /admin/assistants/:assistantId/status`

**Request Body:**
```json
{
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تفعيل المساعد بنجاح"
}
```

**Controller:** [Admin4.js:162](controllers/Admin/Admin4.js#L162)

---

### 5. Delete Assistant
Permanently deletes an assistant.

**Endpoint:** `DELETE /admin/assistants/:assistantId`

**Business Rules:**
- Cannot delete assistant with any appointment associations
- Hard delete (permanent removal)

**Response:**
```json
{
  "success": true,
  "message": "تم حذف المساعد بنجاح"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "لا يمكن حذف المساعد لوجود مواعيد مرتبطة به"
}
```

**Controller:** [Admin4.js:194](controllers/Admin/Admin4.js#L194)

---

## Test Management

### 1. Get All Tests/Appointments
Retrieves appointments for test management.

**Endpoint:** `GET /admin/tests`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by appointment status |
| search | string | Search by patient name, phone, or ref ID |
| date | date | Filter by specific date (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "appointment_id": 101,
      "appointment_ref_id": "APP-2025-001",
      "appointment_datetime": "2025-10-25T10:00:00.000Z",
      "status": "In Progress",
      "payment_method": "Cash",
      "total_cost": 250.00,
      "is_urgent": false,
      "patient_notes": "Patient notes",
      "lab_notes": "Lab notes",
      "patient_name": "محمد أحمد",
      "patient_phone": "0123456789",
      "address_line1": "شارع الجامعة",
      "address_line2": "عمارة 12",
      "city": "الرياض",
      "test_names": "فحص دم, تحليل بول",
      "test_codes": "CBC, UA",
      "test_ids": "1,2",
      "assistant_name": "فاطمة علي",
      "assistant_phone": "0123456780"
    }
  ]
}
```

**Controller:** [Admin6.js:4](controllers/Admin/Admin6.js#L4)

---

### 2. Get Test Appointment Details
Retrieves detailed information for test management.

**Endpoint:** `GET /admin/tests/:appointmentId`

**Response:**
```json
{
  "success": true,
  "data": {
    "appointment_id": 101,
    "appointment_ref_id": "APP-2025-001",
    "patient_name": "محمد أحمد",
    "patient_phone": "0123456789",
    "date_of_birth": "1990-05-15",
    "gender": "Male",
    "address_line1": "شارع الجامعة",
    "city": "الرياض",
    "test_names": "فحص دم, تحليل بول",
    "test_codes": "CBC, UA",
    "test_ids": "1,2",
    "assistant_name": "فاطمة علي"
  }
}
```

**Controller:** [Admin6.js:76](controllers/Admin/Admin6.js#L76)

---

### 3. Update Test Appointment
Updates appointment details in test management context.

**Endpoint:** `PUT /admin/tests/:appointmentId`

**Request Body:**
```json
{
  "appointment_datetime": "2025-10-26T15:00:00.000Z",
  "status": "In Progress",
  "payment_method": "Credit Card",
  "total_cost": 300.00,
  "is_urgent": false,
  "patient_notes": "Updated patient notes",
  "lab_notes": "Sample collected",
  "assistant_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث الموعد بنجاح"
}
```

**Controller:** [Admin6.js:130](controllers/Admin/Admin6.js#L130)

---

### 4. Get Available Assistants (for Tests)
Retrieves active assistants for assignment in test context.

**Endpoint:** `GET /admin/tests/data/assistants`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 5,
      "full_name": "فاطمة علي",
      "phone_number": "0123456780"
    }
  ]
}
```

**Controller:** [Admin6.js:183](controllers/Admin/Admin6.js#L183)

---

### 5. Upload Test Results
Uploads test results for an appointment.

**Endpoint:** `POST /admin/tests/results`

**Request Body:**
```json
{
  "appointment_id": 101,
  "test_id": 1,
  "result_file_url": "https://example.com/results/test-result.pdf"
}
```

**All fields are required.**

**Response:**
```json
{
  "success": true,
  "message": "تم رفع نتائج التحاليل بنجاح"
}
```

**Business Logic:**
- If result exists, it will be updated with new file URL
- If result doesn't exist, new record is created
- **Auto-completion:** If all tests for the appointment have results, appointment status is automatically set to "Completed"

**Controller:** [Admin6.js:212](controllers/Admin/Admin6.js#L212)

---

## Error Handling

### Standard Error Response Format
All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description in Arabic or English",
  "error": "Detailed error message (development mode only)"
}
```

### HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests creating new resources |
| 400 | Bad Request | Invalid parameters, validation errors, business rule violations |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Database errors, unexpected exceptions |

### Common Error Scenarios

#### 1. Authentication Errors
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 2. Validation Errors
```json
{
  "success": false,
  "message": "Invalid pagination parameters"
}
```

#### 3. Not Found Errors
```json
{
  "success": false,
  "message": "Patient not found"
}
```

#### 4. Business Rule Violations
```json
{
  "success": false,
  "message": "Cannot delete patient with active appointments"
}
```

#### 5. Duplicate Entry Errors
```json
{
  "success": false,
  "message": "Phone number already exists"
}
```

### Logging
All endpoints use a comprehensive logging system:
- **Request logging:** Captures method, endpoint, user ID, query params, and request body
- **Response logging:** Records status code and response data
- **Error logging:** Full error details including stack trace in development mode
- **Notification logging:** Tracks notification creation for patients and doctors

---

## Authentication

### Required Header
```
Authorization: Bearer <JWT_TOKEN>
```

### Token Requirements
- Must be valid JWT token
- Token must contain user information
- User's `user_type` must be 'Admin'
- Token is verified by `authenticateAdmin` middleware

### Middleware Location
[AuthMiddleware.js](middlewares/AuthMiddleware.js)

---

## Best Practices for Frontend Integration

### 1. Error Handling
Always check the `success` field in responses:
```javascript
const response = await fetch('/admin/patients', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

if (!data.success) {
  // Handle error
  console.error(data.message);
}
```

### 2. Pagination
Implement proper pagination controls:
```javascript
const fetchPatients = async (page = 1, limit = 12) => {
  const response = await fetch(
    `/admin/patients?page=${page}&limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.json();
};
```

### 3. Search & Filtering
Use query parameters for search and filtering:
```javascript
const searchPatients = async (searchTerm, status = 'all') => {
  const params = new URLSearchParams({
    search: searchTerm,
    status: status
  });
  const response = await fetch(
    `/admin/patients?${params}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.json();
};
```

### 4. Status Updates
Always include required fields in status updates:
```javascript
const updateAppointmentStatus = async (appointmentId, status, notes) => {
  const response = await fetch(
    `/admin/appointments/${appointmentId}/status`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, lab_notes: notes })
    }
  );
  return response.json();
};
```

### 5. Handling Notifications
After operations that trigger notifications (verify, delete, status change), inform the user that a notification was sent:
```javascript
const verifyDoctor = async (doctorId, shouldVerify) => {
  const response = await fetch(
    `/admin/doctors/${doctorId}/verify`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verify: shouldVerify })
    }
  );
  const data = await response.json();

  if (data.success) {
    // Show success message mentioning notification was sent
    showNotification(`Doctor ${shouldVerify ? 'verified' : 'rejected'}. Notification sent.`);
  }
};
```

---

## Testing

### Sample Test File
[admin-endpoints.test.js](tests/admin-endpoints.test.js)

### Testing Authentication
Ensure all tests include valid admin JWT token:
```javascript
const adminToken = 'valid_admin_jwt_token';

test('GET /admin/dashboard/stats', async () => {
  const response = await fetch('/admin/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  expect(response.status).toBe(200);
});
```

---

## Database Schema References

### Key Tables
- **Users**: Contains all user accounts (Patients, Doctors, Assistants, Admins)
- **Patients**: Patient-specific data
- **Doctors**: Doctor-specific data and verification status
- **Assistants**: Assistant records
- **Appointments**: Appointment records with status tracking
- **Addresses**: Patient addresses
- **Medical_Tests**: Available tests
- **Appointment_Tests**: Junction table for appointments and tests
- **Test_Results**: Uploaded test results
- **Notifications**: User notifications

### Important Foreign Keys
- `patient_id` references `Users.user_id`
- `doctor_id` references `Users.user_id`
- `assistant_id` references `Users.user_id`
- `address_id` references `Addresses.address_id`

---

## Change Log

### Version 1.0 (Current)
- Initial documentation
- All admin endpoints documented
- Authentication requirements specified
- Error handling standardized
- Best practices included

---

## Contact & Support

For questions or issues with this API, please contact the backend development team or open an issue in the project repository.

**API Base URL:** `/admin`

**Maintained by:** Backend Team

**Last Updated:** 2025-10-22
