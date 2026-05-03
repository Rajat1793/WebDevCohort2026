# 🗃️ Entities & Attributes

Detailed breakdown of every entity in the LiftGrid smart elevator platform schema.

---

## 1. BUILDING

> A physical commercial building registered on the LiftGrid platform.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `building_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique building identifier |
| `building_name` | VARCHAR(150) | NOT NULL | Name of the building (e.g., "Cyber Hub Tower 3") |
| `building_code` | VARCHAR(20) | NOT NULL, UNIQUE | Short internal code (e.g., CHT3-DL) |
| `address` | TEXT | NOT NULL | Full street address |
| `city` | VARCHAR(100) | NOT NULL | City where building is located |
| `building_type` | ENUM('corporate','mall','hospital','airport','residential','mixed') | NOT NULL | Type of building |
| `total_floors` | INT | NOT NULL | Total number of floors (above ground + basement) |
| `registered_at` | DATETIME | DEFAULT NOW() | When the building was onboarded to LiftGrid |

---

## 2. FLOOR

> An individual floor within a building. Each floor is a distinct addressable level.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `floor_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique floor identifier |
| `building_id` | INT | FK → BUILDING(building_id), NOT NULL | Which building this floor belongs to |
| `floor_number` | INT | NOT NULL | Numeric floor level (e.g., -2, -1, 0, 1, 2…) |
| `floor_label` | VARCHAR(50) | | Human-readable label (e.g., "Basement 2", "Lobby", "3rd Floor") |
| `is_basement` | BOOLEAN | DEFAULT FALSE | TRUE for below-ground floors |
| `is_lobby` | BOOLEAN | DEFAULT FALSE | TRUE for main entry/lobby floor |

> **Note:** `floor_number` uses negative integers for basements (e.g., -1 for B1), 0 for ground/lobby.

---

## 3. ELEVATOR_SHAFT

> A physical vertical shaft in a building that houses exactly one elevator.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `shaft_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique shaft identifier |
| `building_id` | INT | FK → BUILDING(building_id), NOT NULL | Which building this shaft is in |
| `shaft_code` | VARCHAR(20) | NOT NULL | Shaft identifier (e.g., "SHAFT-A1", "SHAFT-B3") |
| `min_floor_number` | INT | NOT NULL | Lowest floor this shaft physically reaches |
| `max_floor_number` | INT | NOT NULL | Highest floor this shaft physically reaches |
| `installed_at` | DATETIME | | When the shaft was constructed/activated |

---

## 4. ELEVATOR

> The elevator unit installed inside a shaft. Stores static configuration data only.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `elevator_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique elevator identifier |
| `shaft_id` | INT | FK → ELEVATOR_SHAFT(shaft_id), UNIQUE, NOT NULL | Which shaft this elevator occupies (1:1) |
| `elevator_code` | VARCHAR(30) | NOT NULL, UNIQUE | Human-readable code (e.g., "LIFT-CHT3-A1") |
| `manufacturer` | VARCHAR(100) | | Elevator manufacturer (e.g., Otis, KONE, Schindler) |
| `model` | VARCHAR(100) | | Model name/number |
| `capacity_persons` | INT | NOT NULL | Maximum passenger capacity |
| `capacity_kg` | DECIMAL(7,2) | NOT NULL | Weight limit in kilograms |
| `commissioned_at` | DATETIME | | When the elevator was put into service |
| `is_active` | BOOLEAN | DEFAULT TRUE | FALSE if permanently decommissioned |

> **What is NOT in ELEVATOR:** current floor, current state, direction — those live in ELEVATOR_STATUS.

---

## 5. ELEVATOR_FLOOR_MAPPING *(Junction Table)*

> Resolves the many-to-many relationship between elevators and floors. Records which elevator serves which floors.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `mapping_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique mapping record |
| `elevator_id` | INT | FK → ELEVATOR(elevator_id), NOT NULL | Which elevator |
| `floor_id` | INT | FK → FLOOR(floor_id), NOT NULL | Which floor it serves |
| `is_express` | BOOLEAN | DEFAULT FALSE | TRUE if this elevator only stops at select floors (express service) |

> **Unique constraint on (elevator_id, floor_id)** — an elevator can only be mapped to a floor once.

---

## 6. ELEVATOR_STATUS

> Live operational state of each elevator. Kept strictly separate from ELEVATOR configuration.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `status_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique status record |
| `elevator_id` | INT | FK → ELEVATOR(elevator_id), UNIQUE, NOT NULL | Which elevator (1:1) |
| `current_state` | ENUM('idle','moving_up','moving_down','door_open','maintenance','offline') | NOT NULL | Current operational state |
| `current_floor_id` | INT | FK → FLOOR(floor_id) | Which floor the elevator is currently at |
| `direction` | ENUM('up','down','none') | DEFAULT 'none' | Current direction of travel |
| `last_updated` | DATETIME | DEFAULT NOW() | Timestamp of last status update (polled every few seconds) |

---

## 7. FLOOR_REQUEST

> A ride request generated by a user pressing a call button on a floor.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `request_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique request identifier |
| `floor_id` | INT | FK → FLOOR(floor_id), NOT NULL | Which floor the request came from |
| `building_id` | INT | FK → BUILDING(building_id), NOT NULL | Which building (for fast filtering) |
| `direction_requested` | ENUM('up','down') | NOT NULL | Did the user press UP or DOWN? |
| `requested_at` | DATETIME | DEFAULT NOW() | Timestamp when the button was pressed |
| `request_status` | ENUM('pending','assigned','completed','cancelled') | DEFAULT 'pending' | Current state of the request |
| `request_source` | ENUM('physical_button','mobile_app','accessibility_panel') | DEFAULT 'physical_button' | How the request was generated |

---

## 8. RIDE_ASSIGNMENT

> The system's decision to assign a specific elevator to handle a specific floor request.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `assignment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique assignment record |
| `request_id` | INT | FK → FLOOR_REQUEST(request_id), UNIQUE, NOT NULL | Which request was assigned (1:1) |
| `elevator_id` | INT | FK → ELEVATOR(elevator_id), NOT NULL | Which elevator was assigned |
| `assigned_at` | DATETIME | DEFAULT NOW() | When the assignment was made by the control algorithm |
| `assignment_status` | ENUM('assigned','in_progress','completed','failed') | DEFAULT 'assigned' | Current status of this assignment |

---

## 9. RIDE_LOG

> A historical record of a completed ride trip — full analytics data.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `ride_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique ride log entry |
| `assignment_id` | INT | FK → RIDE_ASSIGNMENT(assignment_id), UNIQUE, NOT NULL | The assignment this ride completed |
| `elevator_id` | INT | FK → ELEVATOR(elevator_id), NOT NULL | Which elevator completed the ride (for fast aggregation) |
| `origin_floor_id` | INT | FK → FLOOR(floor_id), NOT NULL | Floor where passenger was picked up |
| `destination_floor_id` | INT | FK → FLOOR(floor_id), NOT NULL | Floor where passenger was dropped off |
| `pickup_time` | DATETIME | NOT NULL | When elevator doors opened at origin |
| `dropoff_time` | DATETIME | | When elevator doors opened at destination |
| `duration_seconds` | INT | | Total trip time in seconds |
| `floors_traveled` | INT | | Absolute number of floors traveled |

---

## 10. MAINTENANCE_LOG

> Append-only record of all maintenance events for each elevator. Never overwrites; always inserts.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `maintenance_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique maintenance record |
| `elevator_id` | INT | FK → ELEVATOR(elevator_id), NOT NULL | Which elevator was serviced |
| `maintenance_type` | ENUM('routine','breakdown','inspection','upgrade','emergency') | NOT NULL | Type of maintenance event |
| `description` | TEXT | | Details of what was done |
| `started_at` | DATETIME | NOT NULL | When maintenance began |
| `completed_at` | DATETIME | | When maintenance was completed (NULL if ongoing) |
| `performed_by` | VARCHAR(150) | | Name or ID of the engineer/technician |
| `status` | ENUM('scheduled','in_progress','completed','cancelled') | DEFAULT 'scheduled' | Maintenance event status |
| `parts_replaced` | TEXT | | Comma-separated list of parts replaced (if any) |