# 🗃️ Entities & Attributes

This file describes every entity in the database schema with full attribute details.

---

## 1. CUSTOMER

> Stores basic information about customers who place orders.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `customer_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier for each customer |
| `name` | VARCHAR(100) | NOT NULL | Full name of the customer |
| `email` | VARCHAR(150) | UNIQUE | Email address (optional but preferred) |
| `phone` | VARCHAR(20) | NOT NULL | WhatsApp/contact number |
| `instagram_handle` | VARCHAR(100) | UNIQUE | Instagram username (since orders come via DMs) |
| `created_at` | DATETIME | DEFAULT NOW() | When the customer was first registered |

---

## 2. PRODUCT

> Core table for all products — both thrifted and handmade.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `product_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier for each product |
| `name` | VARCHAR(150) | NOT NULL | Product name (e.g., "Vintage Denim Jacket") |
| `description` | TEXT | | Detailed product description |
| `category` | VARCHAR(100) | NOT NULL | Category (e.g., Tops, Bottoms, Accessories) |
| `price` | DECIMAL(10,2) | NOT NULL | Selling price |
| `product_type` | ENUM('thrifted','handmade') | NOT NULL | Distinguishes thrifted vs handmade items |
| `is_unique` | BOOLEAN | DEFAULT FALSE | TRUE for one-of-a-kind thrifted pieces |
| `created_at` | DATETIME | DEFAULT NOW() | When product was added to the store |

### 🔍 Thrifted vs Handmade
| Feature | Thrifted | Handmade |
|---------|----------|----------|
| `product_type` | `'thrifted'` | `'handmade'` |
| `is_unique` | `TRUE` | `FALSE` |
| Inventory qty | Always `1` | Can be `>1` |
| `condition` in PRODUCT_DETAIL | Always filled | Usually `'new'` |

---

## 3. PRODUCT_DETAIL

> Stores optional, product-specific metadata like size, color, and condition.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `detail_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `product_id` | INT | FK → PRODUCT(product_id), UNIQUE, NOT NULL | Links to the product |
| `size` | VARCHAR(20) | | Size (e.g., S, M, L, XL, 32, Free Size) |
| `color` | VARCHAR(50) | | Primary color of the product |
| `condition` | ENUM('new','like_new','good','fair') | | Physical condition (important for thrifted items) |
| `material` | VARCHAR(100) | | Fabric/material (e.g., cotton, denim, wool) |
| `tags` | TEXT | | Comma-separated tags (e.g., "vintage, boho, summer") |

---

## 4. INVENTORY

> Tracks how many units of each product are currently available for sale.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `inventory_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `product_id` | INT | FK → PRODUCT(product_id), UNIQUE, NOT NULL | Links to the product |
| `quantity_available` | INT | NOT NULL, DEFAULT 0, CHECK (≥ 0) | Units currently in stock |
| `last_updated` | DATETIME | DEFAULT NOW() | Timestamp of last stock update |

> **Note:** For thrifted (unique) items, `quantity_available` is always `1` and drops to `0` once sold.

---

## 5. ORDER

> Represents a purchase request made by a customer.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `order_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier for each order |
| `customer_id` | INT | FK → CUSTOMER(customer_id), NOT NULL | Who placed the order |
| `order_date` | DATETIME | DEFAULT NOW() | When the order was placed |
| `status` | ENUM('pending','confirmed','shipped','delivered','cancelled') | DEFAULT 'pending' | Current order status |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total value of the order |
| `notes` | TEXT | | Special instructions from the customer |

---

## 6. ORDER_ITEM *(Junction Table)*

> Resolves the many-to-many relationship between ORDER and PRODUCT. Each row is one product line in one order.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `order_item_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `order_id` | INT | FK → ORDER(order_id), NOT NULL | Which order this item belongs to |
| `product_id` | INT | FK → PRODUCT(product_id), NOT NULL | Which product was ordered |
| `quantity` | INT | NOT NULL, DEFAULT 1, CHECK (> 0) | How many units of this product |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price per unit at time of order |
| `subtotal` | DECIMAL(10,2) | COMPUTED (quantity × unit_price) | Total for this line item |

---

## 7. PAYMENT

> Tracks payment details and status for each order.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `payment_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `order_id` | INT | FK → ORDER(order_id), UNIQUE, NOT NULL | Which order this payment is for |
| `payment_date` | DATETIME | | When payment was received |
| `amount` | DECIMAL(10,2) | NOT NULL | Amount paid |
| `method` | ENUM('UPI','bank_transfer','cash','COD') | NOT NULL | Payment method used |
| `status` | ENUM('pending','paid','failed','refunded') | DEFAULT 'pending' | Current payment status |
| `transaction_ref` | VARCHAR(100) | UNIQUE | UPI/bank transaction reference number |

---

## 8. SHIPPING

> Stores delivery address and shipping/tracking details for each order.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| `shipping_id` | INT | PK, AUTO_INCREMENT, NOT NULL | Unique identifier |
| `order_id` | INT | FK → ORDER(order_id), UNIQUE, NOT NULL | Which order is being shipped |
| `address_line` | VARCHAR(255) | NOT NULL | Street/house address |
| `city` | VARCHAR(100) | NOT NULL | City |
| `state` | VARCHAR(100) | NOT NULL | State |
| `pincode` | VARCHAR(10) | NOT NULL | Postal/PIN code |
| `carrier` | VARCHAR(100) | | Courier company (e.g., Delhivery, Blue Dart) |
| `tracking_number` | VARCHAR(100) | UNIQUE | Shipment tracking number |
| `shipped_date` | DATE | | When the package was dispatched |
| `delivered_date` | DATE | | When the package was delivered |
| `shipping_status` | ENUM('not_shipped','shipped','out_for_delivery','delivered','returned') | DEFAULT 'not_shipped' | Current delivery status |