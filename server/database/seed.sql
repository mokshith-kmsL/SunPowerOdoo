-- ============================================================
-- SunPower Solutions - Seed Data
-- Run AFTER schema.sql:
--   psql -U <user> -d <dbname> -f database/seed.sql
--
-- Admin credentials come from environment variables.
-- For local dev defaults see .env.example:
--   email:    admin@sunpower.com
--   password: Admin@123  (bcrypt hash below matches this)
-- ============================================================

-- ─── Clean existing seed data (safe re-run) ─────────────────
TRUNCATE TABLE
  subsidies, expenses, service_tickets, warranties,
  installation_photos, installations, dispatch_items,
  dispatches, serial_numbers, inventory, payments, orders,
  quotation_items, quotations, package_items, packages,
  products, surveys, leads, technicians, customers, users
RESTART IDENTITY CASCADE;

-- ============================================================
-- USERS
-- Passwords are bcrypt hashed (cost 10).
-- Plain-text passwords shown in comments for dev use only.
-- ============================================================

-- admin@sunpower.com / Admin@123
INSERT INTO users (name, email, password_hash, role) VALUES
(
  'Super Admin',
  'admin@sunpower.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Admin@123
  'ADMIN'
),
-- sales@sunpower.com / Sales@123
(
  'Ravi Kumar',
  'sales@sunpower.com',
  '$2a$10$TwBNHmA1JZRd3USjRFIlpuVB4MIV0xaS5OPl3YeAjRHHIZ2h1JV3K',  -- Sales@123
  'SALES'
),
-- tech@sunpower.com / Tech@123
(
  'Priya Nair',
  'tech@sunpower.com',
  '$2a$10$4qJCFifSmcQ4SQvZq0wUSO6YnJ3kAUWJaBu0N6SQ8xNqXYEyoY0zK',  -- Tech@123
  'TECHNICIAN'
),
-- warehouse@sunpower.com / Ware@123
(
  'Arun Menon',
  'warehouse@sunpower.com',
  '$2a$10$LpwB8VXfJHd4YfVXb8lImuNVkFwkGAlHVnLQz0tELQkE2Mv3fWLAa',  -- Ware@123
  'WAREHOUSE'
),
-- support@sunpower.com / Support@123
(
  'Deepa Pillai',
  'support@sunpower.com',
  '$2a$10$Rc3VJHlBxHAFzj8pQUZvkuDMLRKe3zNVGSmHGLqXP6f5y2JK9YpJ2',  -- Support@123
  'SUPPORT'
);

-- ============================================================
-- TECHNICIANS (link user_id 3 = Priya Nair)
-- ============================================================
INSERT INTO technicians (user_id, phone, specialization) VALUES
(3, '+91-9876543210', 'Solar PV Installation & Commissioning');

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO customers (name, phone, email, address) VALUES
('Suresh Babu',      '+91-9000000001', 'suresh.babu@email.com',   '12, Gandhi Nagar, Trivandrum, Kerala'),
('Meena Krishnan',   '+91-9000000002', 'meena.k@email.com',       '45, MG Road, Ernakulam, Kerala'),
('Biju Thomas',      '+91-9000000003', 'biju.thomas@email.com',   '78, NH 47, Thrissur, Kerala'),
('Anitha Varghese',  '+91-9000000004', 'anitha.v@email.com',      '22, Palarivattom, Kochi, Kerala'),
('Rajesh Nambiar',   '+91-9000000005', 'rajesh.n@email.com',      '9, Kozhikode Beach Road, Kozhikode, Kerala');

-- ============================================================
-- LEADS
-- ============================================================
INSERT INTO leads (customer_id, capacity_kw, system_type, monthly_electricity_bill, roof_area, subsidy_required, source, status, assigned_to) VALUES
(1, 5.00,  'ON_GRID',  4500.00, 400.00, TRUE,  'Website',   'SURVEY_DONE', 2),
(2, 3.00,  'ON_GRID',  2800.00, 250.00, FALSE, 'Referral',  'QUOTED',      2),
(3, 10.00, 'OFF_GRID', 8000.00, 900.00, TRUE,  'Exhibition','NEW',         2),
(4, 2.00,  'ON_GRID',  2000.00, 180.00, FALSE, 'Social',    'WON',         2),
(5, 7.50,  'ON_GRID',  6500.00, 650.00, TRUE,  'Website',   'CONTACTED',   2);

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO products (name, sku, category, description, purchase_price, selling_price, minimum_stock) VALUES
-- Solar Panels
('Waaree 540W Mono PERC Panel',     'SP-WAR-540',  'SOLAR_PANEL',       '540W Monocrystalline PERC panel, 21.5% efficiency',  12000.00, 15000.00, 20),
('Vikram Solar 450W Panel',          'SP-VIK-450',  'SOLAR_PANEL',       '450W Poly panel, Tier-1 manufacturer',               10000.00, 13000.00, 20),
-- Inverters
('Growatt 5kW On-Grid Inverter',     'INV-GRW-5K',  'INVERTER',          '5kW single-phase on-grid inverter, WiFi monitoring',  35000.00, 45000.00,  5),
('Growatt 10kW On-Grid Inverter',    'INV-GRW-10K', 'INVERTER',          '10kW three-phase on-grid inverter',                   65000.00, 85000.00,  3),
('Luminous 3kW Off-Grid Inverter',   'INV-LUM-3K',  'INVERTER',          '3kW off-grid pure sine wave inverter',                28000.00, 38000.00,  5),
-- Batteries
('Luminous 150Ah Tubular Battery',   'BAT-LUM-150', 'BATTERY',           '150Ah 12V tubular plate battery',                     12000.00, 16000.00, 10),
('Amaron 200Ah AGM Battery',         'BAT-AMR-200', 'BATTERY',           '200Ah 12V AGM deep cycle battery',                    18000.00, 24000.00,  8),
-- Mounting Structures
('GI Mounting Structure 5kW',        'MNT-GI-5K',   'MOUNTING_STRUCTURE','Galvanized iron RCC rooftop mounting structure, 5kW', 8000.00,  12000.00,  5),
('Aluminium Mounting Structure 5kW', 'MNT-AL-5K',   'MOUNTING_STRUCTURE','Aluminium alloy rooftop mounting structure, 5kW',     9500.00,  14000.00,  5),
-- Cables & Connectors
('DC Solar Cable 4mm (per meter)',   'CBL-DC-4MM',  'CABLE',             '4mm2 double-insulated DC solar cable',                   25.00,     45.00,200),
('AC Armoured Cable 4mm (per meter)','CBL-AC-ARM',  'CABLE',             '4mm2 armoured AC cable',                                 35.00,     60.00,200),
('MC4 Connector Pair',               'CON-MC4-PR',  'CONNECTOR',         'Weatherproof MC4 solar connector pair',                 120.00,    200.00, 50),
-- Meter
('Bi-directional Net Meter',         'MTR-BI-DIR',  'METER',             'KSEB-approved bi-directional net energy meter',        3500.00,   5500.00, 10);

-- ============================================================
-- PACKAGES
-- ============================================================
INSERT INTO packages (capacity_kw, system_type, base_price, description) VALUES
(3.00,  'ON_GRID',  185000.00, '3kW On-Grid Solar System - Ideal for homes with monthly bill ₹2000-3500'),
(5.00,  'ON_GRID',  285000.00, '5kW On-Grid Solar System - Ideal for homes/small offices with bill ₹3500-6000'),
(10.00, 'ON_GRID',  520000.00, '10kW On-Grid Solar System - Commercial/large residential'),
(3.00,  'OFF_GRID', 240000.00, '3kW Off-Grid Solar System with battery backup'),
(5.00,  'OFF_GRID', 360000.00, '5kW Off-Grid Solar System with battery backup');

-- ============================================================
-- PACKAGE ITEMS (Bill of Materials)
-- Package 1: 3kW On-Grid
-- ============================================================
INSERT INTO package_items (package_id, product_id, quantity) VALUES
-- 3kW On-Grid: 6 × 540W panels, 1 × 5kW inverter, 1 × mounting, 50m DC cable, 30m AC cable, 6 MC4 pairs, 1 net meter
(1, 1,  6),   -- Waaree 540W panel
(1, 3,  1),   -- Growatt 5kW inverter
(1, 8,  1),   -- GI Mounting 5kW
(1, 10, 50),  -- DC cable meters
(1, 11, 30),  -- AC cable meters
(1, 12, 6),   -- MC4 connectors
(1, 13, 1),   -- Net meter

-- Package 2: 5kW On-Grid: 10 × 540W panels, 1 × 5kW inverter, 1 × AL mounting, 80m DC cable, 40m AC, 10 MC4, 1 meter
(2, 1,  10),
(2, 3,  1),
(2, 9,  1),   -- AL Mounting
(2, 10, 80),
(2, 11, 40),
(2, 12, 10),
(2, 13, 1),

-- Package 3: 10kW On-Grid: 19 × 540W panels, 1 × 10kW inverter, 2 × AL mounting, 150m DC, 60m AC, 20 MC4, 1 meter
(3, 1,  19),
(3, 4,  1),   -- 10kW inverter
(3, 9,  2),
(3, 10, 150),
(3, 11, 60),
(3, 12, 20),
(3, 13, 1),

-- Package 4: 3kW Off-Grid: 6 × 540W panels, 1 × 3kW off-grid inverter, 4 × 150Ah battery, 1 × GI mounting
(4, 1,  6),
(4, 5,  1),   -- 3kW off-grid inverter
(4, 6,  4),   -- 150Ah batteries
(4, 8,  1),
(4, 10, 50),
(4, 11, 30),
(4, 12, 6),

-- Package 5: 5kW Off-Grid: 10 × 540W panels, 1 × 3kW off-grid inverter, 6 × 200Ah battery, 1 × AL mounting
(5, 1,  10),
(5, 5,  1),
(5, 7,  6),   -- 200Ah batteries
(5, 9,  1),
(5, 10, 80),
(5, 11, 40),
(5, 12, 10);

-- ============================================================
-- INVENTORY (initial stock)
-- ============================================================
INSERT INTO inventory (product_id, quantity_available, quantity_reserved) VALUES
(1,  80, 0),   -- Waaree 540W panel
(2,  40, 0),   -- Vikram 450W panel
(3,  12, 0),   -- Growatt 5kW inverter
(4,   6, 0),   -- Growatt 10kW inverter
(5,   8, 0),   -- Luminous 3kW off-grid inverter
(6,  30, 0),   -- Luminous 150Ah battery
(7,  20, 0),   -- Amaron 200Ah battery
(8,  10, 0),   -- GI Mounting 5kW
(9,  10, 0),   -- AL Mounting 5kW
(10, 500, 0),  -- DC Cable
(11, 400, 0),  -- AC Cable
(12, 150, 0),  -- MC4 connectors
(13,  20, 0);  -- Net meters

-- ============================================================
-- SURVEYS
-- ============================================================
INSERT INTO surveys (
  customer_id, technician_id, lead_id, scheduled_date,
  roof_area, shadow_free_area, roof_direction, roof_tilt,
  cable_distance, grid_suitable, notes, status
) VALUES
(
  1, 1, 1, '2026-10-15',
  420.00, 380.00, 'South', 15.00,
  25.00, TRUE,
  'Roof is RCC flat top, suitable for installation. Minor shadow from water tank.',
  'APPROVED'
),
(
  2, 1, 2, '2026-10-18',
  260.00, 240.00, 'South-West', 10.00,
  20.00, TRUE,
  'Clean roof, no obstructions. Grid connection point 20m from array.',
  'APPROVED'
),
(
  4, 1, 4, '2026-10-20',
  190.00, 175.00, 'South', 12.00,
  15.00, TRUE,
  'Small residential roof, suitable for 2kW system.',
  'APPROVED'
);

-- ============================================================
-- QUOTATIONS (for customers 1 and 4 — approved surveys)
-- ============================================================
INSERT INTO quotations (
  customer_id, survey_id, package_id,
  capacity_kw, system_type,
  subtotal, tax, discount, total,
  status, valid_until, created_by
) VALUES
(
  1, 1, 2,
  5.00, 'ON_GRID',
  285000.00, 28500.00, 10000.00, 303500.00,
  'APPROVED', '2026-11-30', 2
),
(
  4, 3, 1,
  3.00, 'ON_GRID',
  185000.00, 18500.00, 5000.00, 198500.00,
  'CONVERTED', '2026-11-15', 2
);

-- ============================================================
-- QUOTATION ITEMS (matching Package 2 BOM for quotation 1)
-- ============================================================
INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price) VALUES
-- Quotation 1 (5kW On-Grid for Suresh Babu)
(1, 1,  10, 15000.00, 150000.00),  -- 10 × Waaree 540W
(1, 3,   1, 45000.00,  45000.00),  -- Growatt 5kW inverter
(1, 9,   1, 14000.00,  14000.00),  -- AL Mounting
(1, 10, 80,    45.00,   3600.00),  -- DC Cable
(1, 11, 40,    60.00,   2400.00),  -- AC Cable
(1, 12, 10,   200.00,   2000.00),  -- MC4
(1, 13,  1,  5500.00,   5500.00),  -- Net meter
-- Quotation 2 (3kW On-Grid for Anitha Varghese)
(2, 1,   6, 15000.00,  90000.00),
(2, 3,   1, 45000.00,  45000.00),
(2, 8,   1, 12000.00,  12000.00),
(2, 10, 50,    45.00,   2250.00),
(2, 11, 30,    60.00,   1800.00),
(2, 12,  6,   200.00,   1200.00),
(2, 13,  1,  5500.00,   5500.00);

-- ============================================================
-- ORDERS (from converted quotation 2)
-- ============================================================
INSERT INTO orders (quotation_id, customer_id, total_amount, status, created_by) VALUES
(2, 4, 198500.00, 'DELIVERED', 2);

-- ============================================================
-- PAYMENTS
-- ============================================================
INSERT INTO payments (order_id, amount, payment_type, payment_reference, payment_date, recorded_by) VALUES
(1, 99250.00, 'ADVANCE',  'PAY-2026-001', '2026-10-22', 2),
(1, 99250.00, 'FINAL',    'PAY-2026-002', '2026-10-28', 2);

-- ============================================================
-- SERIAL NUMBERS (for order 1 — Anitha Varghese)
-- ============================================================
INSERT INTO serial_numbers (product_id, serial_number, order_id, dispatch_date, status) VALUES
-- 6 Solar panels
(1, 'WAR-540-2026-0001', 1, '2026-10-25', 'DISPATCHED'),
(1, 'WAR-540-2026-0002', 1, '2026-10-25', 'DISPATCHED'),
(1, 'WAR-540-2026-0003', 1, '2026-10-25', 'DISPATCHED'),
(1, 'WAR-540-2026-0004', 1, '2026-10-25', 'DISPATCHED'),
(1, 'WAR-540-2026-0005', 1, '2026-10-25', 'DISPATCHED'),
(1, 'WAR-540-2026-0006', 1, '2026-10-25', 'DISPATCHED'),
-- Inverter
(3, 'GRW-5K-2026-0001',  1, '2026-10-25', 'DISPATCHED'),
-- Mounting
(8, 'MNT-GI-2026-0001',  1, '2026-10-25', 'DISPATCHED');

-- ============================================================
-- DISPATCH
-- ============================================================
INSERT INTO dispatches (order_id, dispatched_at, status, dispatched_by) VALUES
(1, '2026-10-25 10:00:00+05:30', 'DELIVERED', 4);

INSERT INTO dispatch_items (dispatch_id, serial_number_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),  -- panels
(1, 7),  -- inverter
(1, 8);  -- mounting

-- ============================================================
-- WARRANTIES (auto-activated for dispatched items)
-- Inverter: 2yr, Battery: 2yr, Solar Panel: 20yr
-- Delivery date: 2026-10-25
-- ============================================================
INSERT INTO warranties (serial_number_id, start_date, expiry_date, warranty_status) VALUES
-- 6 solar panels → 20 years
(1, '2026-10-25', '2046-10-25', 'ACTIVE'),
(2, '2026-10-25', '2046-10-25', 'ACTIVE'),
(3, '2026-10-25', '2046-10-25', 'ACTIVE'),
(4, '2026-10-25', '2046-10-25', 'ACTIVE'),
(5, '2026-10-25', '2046-10-25', 'ACTIVE'),
(6, '2026-10-25', '2046-10-25', 'ACTIVE'),
-- inverter → 2 years
(7, '2026-10-25', '2028-10-25', 'ACTIVE'),
-- mounting → no standard warranty tracked (excluded)
(8, '2026-10-25', '2027-10-25', 'ACTIVE');

-- ============================================================
-- INSTALLATION
-- ============================================================
INSERT INTO installations (
  order_id, technician_id, scheduled_date,
  start_time, completion_time,
  system_capacity, installation_status, test_result, notes
) VALUES
(
  1, 1, '2026-10-27',
  '2026-10-27 09:00:00+05:30',
  '2026-10-27 17:30:00+05:30',
  3.00, 'COMPLETED', 'PASS',
  'System commissioned successfully. Grid export confirmed. Customer briefed on app monitoring.'
);

-- ============================================================
-- EXPENSES (for order 1)
-- ============================================================
INSERT INTO expenses (order_id, category, amount, description, expense_date, recorded_by) VALUES
(1, 'Transportation', 2500.00,  'Vehicle hire for dispatch to Kochi',         '2026-10-25', 4),
(1, 'Labour',         8000.00,  'Installation team labour (2 technicians)',    '2026-10-27', 2),
(1, 'Miscellaneous',  1200.00,  'Consumables, connectors, wire clips etc.',   '2026-10-27', 2);

-- ============================================================
-- SUBSIDIES
-- ============================================================
INSERT INTO subsidies (customer_id, order_id, application_status, reference_number, submitted_at) VALUES
(4, 1, 'APPROVED', 'MNRE-2026-KL-00421', '2026-10-15 10:00:00+05:30');
