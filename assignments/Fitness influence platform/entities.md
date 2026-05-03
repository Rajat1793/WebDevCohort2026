# 🗃️ Entities & Attributes

Detailed breakdown of every entity in the schema.

---

## 1. USER

> Shared base table for all platform users — both trainers and clients share this.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `user_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique platform user identifier |
| `full_name` | VARCHAR(150) | NOT NULL | Full name of the user |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Login email address |
| `phone` | VARCHAR(20) | | Contact number |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password for auth |
| `role` | ENUM('trainer','client') | NOT NULL | Distinguishes user type |
| `created_at` | DATETIME | DEFAULT NOW() | Account creation timestamp |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether the account is active |

---

## 2. TRAINER

> Trainer-specific profile extending USER. Stores coaching credentials and identity.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `trainer_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique trainer identifier |
| `user_id` | INT | FK → USER(user_id), UNIQUE, NOT NULL | Links to the base USER record |
| `bio` | TEXT | | Trainer's public bio/about |
| `specialization` | VARCHAR(150) | | Area of expertise (e.g., weight loss, strength, yoga) |
| `years_of_experience` | INT | DEFAULT 0 | Years of coaching experience |
| `instagram_handle` | VARCHAR(100) | UNIQUE | Instagram profile (influencer identity) |
| `certifications` | TEXT | | Comma-separated certifications (e.g., ACE, NASM) |

---

## 3. CLIENT

> Client-specific profile extending USER. Stores health and fitness context.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `client_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique client identifier |
| `user_id` | INT | FK → USER(user_id), UNIQUE, NOT NULL | Links to the base USER record |
| `assigned_trainer_id` | INT | FK → TRAINER(trainer_id) | Primary trainer assigned to this client |
| `fitness_goal` | VARCHAR(255) | | Goal description (e.g., lose 10kg, build muscle) |
| `health_conditions` | TEXT | | Known medical conditions or limitations |
| `date_of_birth` | DATE | | Used to calculate age for fitness planning |
| `gender` | VARCHAR(20) | | Gender (used for fitness calculations) |
| `height_cm` | DECIMAL(5,2) | | Static height measurement in cm |

---

## 4. PLAN

> A coaching program or package created and offered by a trainer.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `plan_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique plan identifier |
| `trainer_id` | INT | FK → TRAINER(trainer_id), NOT NULL | Which trainer created this plan |
| `title` | VARCHAR(150) | NOT NULL | Plan name (e.g., "12-Week Fat Loss Program") |
| `description` | TEXT | | Detailed overview of the plan |
| `plan_type` | ENUM('consultation_only','routine_only','full_coaching') | NOT NULL | Type of coaching offered |
| `duration_weeks` | INT | | How long the plan lasts in weeks |
| `price` | DECIMAL(10,2) | NOT NULL | Plan price |
| `includes_diet` | BOOLEAN | DEFAULT FALSE | Whether a diet plan is included |
| `includes_workout` | BOOLEAN | DEFAULT TRUE | Whether a workout routine is included |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether plan is open for enrollment |
| `created_at` | DATETIME | DEFAULT NOW() | When plan was created |

---

## 5. SUBSCRIPTION

> Tracks which client has enrolled in which plan, and for how long.  
> Acts as a junction table resolving the M:N between CLIENT and PLAN.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `subscription_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique subscription record |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | Which client subscribed |
| `plan_id` | INT | FK → PLAN(plan_id), NOT NULL | Which plan was subscribed to |
| `start_date` | DATE | NOT NULL | When the plan started |
| `end_date` | DATE | | When the plan ends (calculated from duration) |
| `status` | ENUM('active','paused','completed','cancelled') | DEFAULT 'active' | Current subscription status |
| `subscribed_at` | DATETIME | DEFAULT NOW() | Timestamp of enrollment |

---

## 6. SESSION

> A scheduled live/video consultation or coaching call between a trainer and a client.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `session_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique session identifier |
| `trainer_id` | INT | FK → TRAINER(trainer_id), NOT NULL | The trainer conducting the session |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | The client attending the session |
| `scheduled_at` | DATETIME | NOT NULL | Date and time of the session |
| `duration_minutes` | INT | DEFAULT 30 | Expected duration |
| `session_type` | ENUM('consultation','check_in_call','live_training','Q&A') | NOT NULL | Type of session |
| `platform` | VARCHAR(50) | | Video platform (e.g., Google Meet, Zoom) |
| `meeting_link` | VARCHAR(255) | | URL for joining the session |
| `status` | ENUM('scheduled','completed','cancelled','no_show') | DEFAULT 'scheduled' | Session status |
| `notes` | TEXT | | Post-session notes by trainer |

---

## 7. CHECK_IN

> A weekly self-report submitted by the client about their progress, lifestyle, and adherence.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `checkin_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique check-in record |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | Which client submitted this |
| `subscription_id` | INT | FK → SUBSCRIPTION(subscription_id) | Which active plan this check-in belongs to |
| `checkin_date` | DATE | NOT NULL | Date of check-in submission |
| `current_weight_kg` | DECIMAL(5,2) | | Self-reported weight |
| `energy_level` | ENUM('very_low','low','moderate','high','very_high') | | How energetic the client felt |
| `sleep_quality` | ENUM('poor','fair','good','excellent') | | Sleep quality rating |
| `adherence_rating` | ENUM('0%','25%','50%','75%','100%') | | How well they followed the plan |
| `client_notes` | TEXT | | Anything the client wants to share |

---

## 8. PROGRESS_LOG

> Objective body measurement records logged periodically (weekly/monthly).

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `log_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique measurement record |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | Which client's measurements |
| `logged_date` | DATE | NOT NULL | Date of measurement |
| `weight_kg` | DECIMAL(5,2) | | Body weight in kg |
| `chest_cm` | DECIMAL(5,2) | | Chest circumference in cm |
| `waist_cm` | DECIMAL(5,2) | | Waist circumference in cm |
| `hips_cm` | DECIMAL(5,2) | | Hip circumference in cm |
| `bicep_cm` | DECIMAL(5,2) | | Bicep circumference in cm |
| `body_fat_pct` | DECIMAL(4,2) | | Body fat percentage |
| `photo_url` | VARCHAR(255) | | Link to progress photo (optional) |

---

## 9. TRAINER_NOTE

> Private feedback, adjustments, or observations written by a trainer about a specific client.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `note_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique note identifier |
| `trainer_id` | INT | FK → TRAINER(trainer_id), NOT NULL | Which trainer wrote the note |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | Which client the note is about |
| `checkin_id` | INT | FK → CHECK_IN(checkin_id) | Optional link to a specific check-in |
| `created_at` | DATETIME | DEFAULT NOW() | When the note was written |
| `feedback` | TEXT | NOT NULL | Trainer's feedback or observations |
| `recommended_adjustment` | TEXT | | Changes recommended to plan/diet/workout |

---

## 10. PAYMENT

> Tracks all financial transactions — for subscriptions and/or individual sessions.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `payment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique payment record |
| `client_id` | INT | FK → CLIENT(client_id), NOT NULL | Who made the payment |
| `subscription_id` | INT | FK → SUBSCRIPTION(subscription_id) | Linked subscription (if plan payment) |
| `session_id` | INT | FK → SESSION(session_id) | Linked session (if consultation payment) |
| `payment_date` | DATETIME | DEFAULT NOW() | When payment was made |
| `amount` | DECIMAL(10,2) | NOT NULL | Amount paid |
| `method` | ENUM('UPI','bank_transfer','card','COD','free') | NOT NULL | Payment method |
| `status` | ENUM('pending','paid','failed','refunded') | DEFAULT 'pending' | Payment status |
| `transaction_ref` | VARCHAR(100) | UNIQUE | Reference number for verification |