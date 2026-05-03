# 🗃️ Entities & Attributes

Detailed breakdown of every entity in the clinic database schema.

---

## 1. PATIENT

> Every person registered at the clinic. Can visit multiple times.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `patient_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique patient identifier |
| `full_name` | VARCHAR(150) | NOT NULL | Patient's full name |
| `date_of_birth` | DATE | NOT NULL | Used to calculate age |
| `gender` | ENUM('male','female','other') | NOT NULL | Patient gender |
| `blood_group` | VARCHAR(5) | | Blood group (e.g., O+, AB-) |
| `phone` | VARCHAR(20) | NOT NULL | Primary contact number |
| `email` | VARCHAR(150) | UNIQUE | Email address |
| `address` | TEXT | | Residential address |
| `registered_at` | DATETIME | DEFAULT NOW() | When the patient first registered |

---

## 2. DEPARTMENT

> Clinical departments or specialties within the clinic.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `department_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique department identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Department name (e.g., Cardiology, ENT, Dermatology) |
| `description` | TEXT | | Brief description of the department's scope |

---

## 3. DOCTOR

> Registered doctors at the clinic, each belonging to a department.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `doctor_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique doctor identifier |
| `department_id` | INT | FK → DEPARTMENT(department_id), NOT NULL | Which department this doctor belongs to |
| `full_name` | VARCHAR(150) | NOT NULL | Doctor's full name |
| `specialization` | VARCHAR(150) | NOT NULL | Medical specialization (e.g., Cardiologist, Orthopedic) |
| `qualification` | VARCHAR(255) | | Degrees and certifications (e.g., MBBS, MD) |
| `phone` | VARCHAR(20) | | Clinic contact number |
| `email` | VARCHAR(150) | UNIQUE | Doctor's email |
| `is_available` | BOOLEAN | DEFAULT TRUE | Whether the doctor is currently taking appointments |

---

## 4. APPOINTMENT

> A booking made by a patient to see a specific doctor at a specific time.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `appointment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique appointment identifier |
| `patient_id` | INT | FK → PATIENT(patient_id), NOT NULL | Which patient booked |
| `doctor_id` | INT | FK → DOCTOR(doctor_id), NOT NULL | Which doctor is booked |
| `appointment_datetime` | DATETIME | NOT NULL | Scheduled date and time |
| `reason` | VARCHAR(255) | | Reason for visit (chief complaint) |
| `status` | ENUM('scheduled','completed','cancelled','no_show') | DEFAULT 'scheduled' | Current appointment status |
| `booked_at` | DATETIME | DEFAULT NOW() | When the booking was made |

> **Note:** An appointment with `status = 'completed'` should have a corresponding CONSULTATION record. Cancelled or no-show appointments do not.

---

## 5. CONSULTATION

> The actual doctor-patient interaction that takes place during a completed appointment.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `consultation_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique consultation identifier |
| `appointment_id` | INT | FK → APPOINTMENT(appointment_id), UNIQUE, NOT NULL | The appointment that led to this consultation |
| `patient_id` | INT | FK → PATIENT(patient_id), NOT NULL | Which patient was seen (denormalized for query ease) |
| `doctor_id` | INT | FK → DOCTOR(doctor_id), NOT NULL | Which doctor conducted the consultation |
| `consultation_datetime` | DATETIME | NOT NULL | When the consultation took place |
| `symptoms` | TEXT | | Patient-reported symptoms |
| `diagnosis` | TEXT | | Doctor's diagnosis |
| `prescription_notes` | TEXT | | Medications or treatment prescribed |
| `doctor_remarks` | TEXT | | Additional notes or follow-up instructions |

> **Why repeat patient_id and doctor_id here?** For direct, efficient querying of a consultation without always joining through APPOINTMENT.

---

## 6. DIAGNOSTIC_TEST

> A master catalog of all diagnostic tests the clinic offers.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `test_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique test identifier |
| `test_name` | VARCHAR(150) | NOT NULL, UNIQUE | Test name (e.g., Complete Blood Count, Chest X-Ray) |
| `test_category` | VARCHAR(100) | NOT NULL | Category (e.g., Blood Test, Imaging, Urine Test) |
| `description` | TEXT | | What the test measures or detects |
| `standard_cost` | DECIMAL(10,2) | NOT NULL | Base price of the test |
| `sample_type` | VARCHAR(100) | | Required sample (e.g., blood, urine, tissue) |
| `turnaround_hours` | INT | | Expected time to generate report in hours |

---

## 7. PRESCRIBED_TEST *(Junction Table)*

> Tracks which tests were prescribed during a specific consultation.  
> Resolves the M:N relationship between CONSULTATION and DIAGNOSTIC_TEST.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `prescribed_test_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique prescription record |
| `consultation_id` | INT | FK → CONSULTATION(consultation_id), NOT NULL | Which consultation prescribed this test |
| `test_id` | INT | FK → DIAGNOSTIC_TEST(test_id), NOT NULL | Which test was prescribed |
| `prescribed_at` | DATETIME | DEFAULT NOW() | When the test was prescribed |
| `urgency` | ENUM('routine','urgent','emergency') | DEFAULT 'routine' | How urgently the test is needed |
| `status` | ENUM('prescribed','sample_collected','processing','completed','cancelled') | DEFAULT 'prescribed' | Current test status |

---

## 8. REPORT

> The diagnostic report generated after a prescribed test is processed.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `report_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique report identifier |
| `prescribed_test_id` | INT | FK → PRESCRIBED_TEST(prescribed_test_id), UNIQUE, NOT NULL | Which prescribed test this report belongs to |
| `patient_id` | INT | FK → PATIENT(patient_id), NOT NULL | Which patient (for direct lookup) |
| `doctor_id` | INT | FK → DOCTOR(doctor_id) | Referring doctor (for notification/review) |
| `report_date` | DATE | NOT NULL | Date the report was generated |
| `findings` | TEXT | | Detailed lab/imaging findings |
| `result_summary` | TEXT | | Short summary of results |
| `report_url` | VARCHAR(255) | | Link to scanned PDF or digital report |
| `reviewed_by` | VARCHAR(150) | | Name of lab technician or radiologist who reviewed |
| `is_abnormal` | BOOLEAN | DEFAULT FALSE | Flag if any result is out of normal range |

---

## 9. PAYMENT

> Financial records for services rendered at the clinic.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `payment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique payment identifier |
| `patient_id` | INT | FK → PATIENT(patient_id), NOT NULL | Who made the payment |
| `appointment_id` | INT | FK → APPOINTMENT(appointment_id) | Linked appointment (if booking fee) |
| `consultation_id` | INT | FK → CONSULTATION(consultation_id) | Linked consultation (if doctor + test charges) |
| `payment_date` | DATETIME | DEFAULT NOW() | When payment was made |
| `amount` | DECIMAL(10,2) | NOT NULL | Total amount paid |
| `payment_for` | ENUM('appointment_fee','consultation_fee','test_fee','combined') | NOT NULL | What this payment covers |
| `method` | ENUM('cash','card','UPI','insurance','online') | NOT NULL | Payment method |
| `status` | ENUM('pending','paid','failed','refunded') | DEFAULT 'pending' | Payment status |
| `transaction_ref` | VARCHAR(100) | UNIQUE | Reference number for verification |