# 🗃️ Entities & Attributes

Detailed breakdown of every entity in the Comic-Con parking system schema.

---

## 1. VEHICLE_CATEGORY

> Master reference table for types of vehicles allowed at the venue.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `category_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `category_name` | VARCHAR(50) | NOT NULL, UNIQUE | e.g., Bike, Car, SUV, Cab, EV |
| `description` | VARCHAR(255) | | Short description of the vehicle type |
| `base_rate_per_hour` | DECIMAL(8,2) | NOT NULL | Default hourly parking rate for this vehicle type |

**Examples:**
| category_name | base_rate_per_hour |
|--------------|-------------------|
| Bike | ₹20/hr |
| Car | ₹50/hr |
| SUV | ₹70/hr |
| Cab | ₹60/hr |
| EV | ₹40/hr (discounted) |

---

## 2. VEHICLE

> Every vehicle that enters the parking facility is registered here.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `vehicle_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique vehicle identifier |
| `category_id` | INT | FK → VEHICLE_CATEGORY(category_id), NOT NULL | Type of vehicle |
| `license_plate` | VARCHAR(20) | NOT NULL, UNIQUE | Vehicle registration number |
| `owner_name` | VARCHAR(150) | | Driver/owner name (optional at entry) |
| `owner_phone` | VARCHAR(20) | | Contact number |
| `access_category_id` | INT | FK → ACCESS_CATEGORY(access_category_id), NOT NULL | VIP / exhibitor / staff / general etc. |
| `first_seen_at` | DATETIME | DEFAULT NOW() | Timestamp of first ever registration in the system |

> **Note:** A vehicle is registered once. Multiple visits across days are tracked via PARKING_SESSION.

---

## 3. ACCESS_CATEGORY

> Represents the special access level of the person arriving — not the vehicle itself.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `access_category_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `access_type` | VARCHAR(100) | NOT NULL, UNIQUE | e.g., General, VIP Guest, Exhibitor, Staff, Cosplayer, EV User |
| `description` | VARCHAR(255) | | What this access type means |
| `has_reserved_parking` | BOOLEAN | DEFAULT FALSE | Whether this category gets reserved spots |

**Examples:**
| access_type | has_reserved_parking |
|------------|---------------------|
| General Visitor | FALSE |
| VIP Guest | TRUE |
| Exhibitor | TRUE |
| Staff | TRUE |
| Cosplayer with Props | TRUE |
| EV Charging User | TRUE |

---

## 4. PARKING_ZONE

> Top-level physical division of the parking facility.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `zone_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique zone identifier |
| `zone_name` | VARCHAR(100) | NOT NULL | Descriptive name (e.g., "North Wing", "Main Lot") |
| `zone_code` | VARCHAR(10) | NOT NULL, UNIQUE | Short code (e.g., A, B, C, VIP) |
| `description` | TEXT | | Notes about this zone (location, access gate, etc.) |

---

## 5. PARKING_LEVEL

> A floor or sublevel within a parking zone.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `level_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique level identifier |
| `zone_id` | INT | FK → PARKING_ZONE(zone_id), NOT NULL | Which zone this level belongs to |
| `level_name` | VARCHAR(50) | NOT NULL | e.g., Ground Floor, Level 1, Basement |
| `total_spots` | INT | NOT NULL, DEFAULT 0 | Total number of spots on this level |

---

## 6. SPOT_CATEGORY

> Master reference table for types of parking spots available.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `spot_category_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `category_name` | VARCHAR(100) | NOT NULL, UNIQUE | e.g., General, VIP Reserved, EV Charging, Exhibitor, Staff, Cosplayer |
| `description` | VARCHAR(255) | | What this spot type is for |
| `is_reserved` | BOOLEAN | DEFAULT FALSE | Whether the spot requires special access |
| `is_ev_charging` | BOOLEAN | DEFAULT FALSE | Whether the spot has EV charging capability |

---

## 7. PARKING_SPOT

> An individual, numbered parking spot on a specific level.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `spot_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique spot identifier |
| `level_id` | INT | FK → PARKING_LEVEL(level_id), NOT NULL | Which level this spot is on |
| `spot_category_id` | INT | FK → SPOT_CATEGORY(spot_category_id), NOT NULL | Type of spot |
| `spot_number` | VARCHAR(20) | NOT NULL | Human-readable spot label (e.g., A-L1-042) |
| `is_occupied` | BOOLEAN | DEFAULT FALSE | Live status — TRUE when a vehicle is parked |
| `is_active` | BOOLEAN | DEFAULT TRUE | FALSE if spot is under maintenance or blocked |

> **Spot number convention:** `{zone_code}-{level}-{number}` e.g., `VIP-G-001`, `A-L2-078`

---

## 8. PARKING_SESSION

> The core operational record — one entry-exit cycle for a vehicle at a specific spot.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `session_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique session identifier |
| `vehicle_id` | INT | FK → VEHICLE(vehicle_id), NOT NULL | Which vehicle parked |
| `spot_id` | INT | FK → PARKING_SPOT(spot_id), NOT NULL | Which spot was used |
| `entry_time` | DATETIME | NOT NULL | When the vehicle entered |
| `exit_time` | DATETIME | | When the vehicle exited (NULL if still parked) |
| `duration_minutes` | INT | | Computed on exit: (exit_time − entry_time) in minutes |
| `session_status` | ENUM('active','completed','overstay','abandoned') | DEFAULT 'active' | Current state of the parking session |

> **`exit_time = NULL` means the vehicle is currently inside the facility** — this is how live occupancy is tracked.

---

## 9. PARKING_TICKET

> The physical or digital ticket issued at entry, linked one-to-one with a session.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `ticket_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique ticket identifier |
| `session_id` | INT | FK → PARKING_SESSION(session_id), UNIQUE, NOT NULL | The session this ticket covers |
| `ticket_number` | VARCHAR(30) | NOT NULL, UNIQUE | Human-readable ticket code (e.g., TKT-20241012-00847) |
| `issued_at` | DATETIME | DEFAULT NOW() | When the ticket was generated |
| `issued_by` | VARCHAR(100) | | Booth staff name or "AUTO" for automated |
| `barcode_ref` | VARCHAR(100) | UNIQUE | Barcode or QR scan reference |

---

## 10. PAYMENT

> Fee calculation and payment record, settled when a vehicle exits.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `payment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique payment record |
| `session_id` | INT | FK → PARKING_SESSION(session_id), UNIQUE, NOT NULL | Which session is being paid for |
| `amount_charged` | DECIMAL(10,2) | NOT NULL | Total fee charged for the session |
| `rate_applied` | DECIMAL(8,2) | NOT NULL | Rate per hour that was applied |
| `payment_method` | ENUM('cash','card','UPI','FASTag','free') | NOT NULL | How the payment was made |
| `payment_status` | ENUM('pending','paid','waived','failed') | DEFAULT 'pending' | Current payment status |
| `paid_at` | DATETIME | | When payment was completed |
| `transaction_ref` | VARCHAR(100) | UNIQUE | Reference number for digital payments |