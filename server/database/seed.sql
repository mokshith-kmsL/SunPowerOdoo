-- ============================================================
-- SunPower Solutions - Seed Data
-- Run AFTER schema.sql:
--   psql -U <user> -d <dbname> -f database/seed.sql
--
-- This seed only includes system users, technicians, products,
-- packages, and inventory. All customer/lead/order data is left
-- empty so you can enter it from scratch through the frontend.
-- ============================================================

-- ─── Clean ALL data (safe re-run) ─────────────────────────
TRUNCATE TABLE
  subsidies, expenses, service_tickets, warranties,
  installation_photos, installations, dispatch_items,
  dispatches, serial_numbers, inventory, payments, orders,
  quotation_items, quotations, package_items, packages,
  products, surveys, leads, technicians, customers, users
RESTART IDENTITY CASCADE;

-- ============================================================
-- USERS (system accounts for login)
-- Passwords are bcrypt hashed (cost 10).
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
('Super Admin',  'admin@sunpower.com',    '$2a$10$IqcR7S/habI9hy9j/m8Zw.UkC/lE1uDVq37iRHiYqVb5rzPFzeIt.', 'ADMIN'),     -- Admin@123
('Ravi Kumar',    'sales@sunpower.com',    '$2a$10$4KjPCn57c.cgfLH82pvYwONKrbBrlNvrX4VqrV0dd1jc9UYOnqqwy',  'SALES'),     -- Sales@123
('Priya Nair',    'tech@sunpower.com',     '$2a$10$sh6lzcchpUdECMJcPQaPxOuKMr5NPChQ9yUnALdDVbbESCOoTOb.2',  'TECHNICIAN'), -- Tech@123
('Arun Menon',    'warehouse@sunpower.com','$2a$10$woSn6J84ajPqvnrP0peXm.FHIdM/NEpcOw.snZ/t7ZAnQfAPUQzDC',  'WAREHOUSE'),  -- Ware@123
('Deepa Pillai',  'support@sunpower.com',  '$2a$10$n9BuwXdZrab9wU5DDRtG.e17QfQcn2FGWwnFThJMQF4j9WCYoOp7C',  'SUPPORT');    -- Support@123

-- ============================================================
-- TECHNICIANS (link user_id 3 = Priya Nair)
-- ============================================================
INSERT INTO technicians (user_id, phone, specialization) VALUES
(3, '+91-9876543210', 'Solar PV Installation & Commissioning');

-- ============================================================
-- PRODUCTS (catalog — kept, this is reference data)
-- ============================================================
INSERT INTO products (name, sku, category, description, purchase_price, selling_price, minimum_stock) VALUES
-- Solar Panels
('Waaree 540W Mono PERC Panel',     'SP-WAR-540',  'SOLAR_PANEL',        '540W Monocrystalline PERC panel, 21.5% efficiency',  12000.00, 15000.00, 20),
('Vikram Solar 450W Panel',          'SP-VIK-450',  'SOLAR_PANEL',        '450W Poly panel, Tier-1 manufacturer',               10000.00, 13000.00, 20),
-- Inverters
('Growatt 5kW On-Grid Inverter',     'INV-GRW-5K',  'INVERTER',           '5kW single-phase on-grid inverter, WiFi monitoring',  35000.00, 45000.00,  5),
('Growatt 10kW On-Grid Inverter',    'INV-GRW-10K', 'INVERTER',           '10kW three-phase on-grid inverter',                   65000.00, 85000.00,  3),
('Luminous 3kW Off-Grid Inverter',   'INV-LUM-3K',  'INVERTER',           '3kW off-grid pure sine wave inverter',                28000.00, 38000.00,  5),
-- Batteries
('Luminous 150Ah Tubular Battery',   'BAT-LUM-150', 'BATTERY',            '150Ah 12V tubular plate battery',                     12000.00, 16000.00, 10),
('Amaron 200Ah AGM Battery',         'BAT-AMR-200', 'BATTERY',            '200Ah 12V AGM deep cycle battery',                    18000.00, 24000.00,  8),
-- Mounting Structures
('GI Mounting Structure 5kW',        'MNT-GI-5K',   'MOUNTING_STRUCTURE', 'Galvanized iron RCC rooftop mounting structure, 5kW',  8000.00,  12000.00,  5),
('Aluminium Mounting Structure 5kW', 'MNT-AL-5K',   'MOUNTING_STRUCTURE', 'Aluminium alloy rooftop mounting structure, 5kW',    9500.00,  14000.00,  5),
-- Cables & Connectors
('DC Solar Cable 4mm (per meter)',   'CBL-DC-4MM',  'CABLE',              '4mm2 double-insulated DC solar cable',                   25.00,     45.00,200),
('AC Armoured Cable 4mm (per meter)','CBL-AC-ARM',  'CABLE',              '4mm2 armoured AC cable',                                 35.00,     60.00,200),
('MC4 Connector Pair',               'CON-MC4-PR',  'CONNECTOR',          'Weatherproof MC4 solar connector pair',                 120.00,    200.00, 50),
-- Meter
('Bi-directional Net Meter',         'MTR-BI-DIR',  'METER',              'KSEB-approved bi-directional net energy meter',        3500.00,   5500.00, 10);

-- ============================================================
-- PACKAGES (system templates with bill of materials)
-- ============================================================
INSERT INTO packages (capacity_kw, system_type, base_price, description) VALUES
(3.00,  'ON_GRID',  185000.00, '3kW On-Grid Solar System - Ideal for homes with monthly bill ₹2000-3500'),
(5.00,  'ON_GRID',  285000.00, '5kW On-Grid Solar System - Ideal for homes/small offices with bill ₹3500-6000'),
(10.00, 'ON_GRID',  520000.00, '10kW On-Grid Solar System - Commercial/large residential'),
(3.00,  'OFF_GRID', 240000.00, '3kW Off-Grid Solar System with battery backup'),
(5.00,  'OFF_GRID', 360000.00, '5kW Off-Grid Solar System with battery backup');

-- ============================================================
-- PACKAGE ITEMS (Bill of Materials per package)
-- ============================================================
INSERT INTO package_items (package_id, product_id, quantity) VALUES
-- Package 1: 3kW On-Grid
(1, 1,  6),   -- Waaree 540W panel
(1, 3,  1),   -- Growatt 5kW inverter
(1, 8,  1),   -- GI Mounting 5kW
(1, 10, 50),  -- DC cable meters
(1, 11, 30),  -- AC cable meters
(1, 12, 6),   -- MC4 connectors
(1, 13, 1),   -- Net meter

-- Package 2: 5kW On-Grid
(2, 1,  10),
(2, 3,  1),
(2, 9,  1),   -- AL Mounting
(2, 10, 80),
(2, 11, 40),
(2, 12, 10),
(2, 13, 1),

-- Package 3: 10kW On-Grid
(3, 1,  19),
(3, 4,  1),   -- 10kW inverter
(3, 9,  2),
(3, 10, 150),
(3, 11, 60),
(3, 12, 20),
(3, 13, 1),

-- Package 4: 3kW Off-Grid
(4, 1,  6),
(4, 5,  1),   -- 3kW off-grid inverter
(4, 6,  4),   -- 150Ah batteries
(4, 8,  1),
(4, 10, 50),
(4, 11, 30),
(4, 12, 6),

-- Package 5: 5kW Off-Grid
(5, 1,  10),
(5, 5,  1),
(5, 7,  6),   -- 200Ah batteries
(5, 9,  1),
(5, 10, 80),
(5, 11, 40),
(5, 12, 10);

-- ============================================================
-- INVENTORY (initial stock for all products)
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

-- All customer-facing data (customers, leads, surveys, quotations,
-- orders, payments, serial numbers, dispatches, warranties,
-- installations, expenses, subsidies) is intentionally left empty.
-- Add these through the frontend.
