-- ============================================================
-- SunPower Solutions - PostgreSQL Database Schema
-- Run with: psql -U <user> -d <dbname> -f database/schema.sql
-- This script is idempotent: safe to re-run.
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Drop tables in reverse dependency order ────────────────
DROP TABLE IF EXISTS subsidies            CASCADE;
DROP TABLE IF EXISTS expenses             CASCADE;
DROP TABLE IF EXISTS service_tickets      CASCADE;
DROP TABLE IF EXISTS warranties           CASCADE;
DROP TABLE IF EXISTS installation_photos  CASCADE;
DROP TABLE IF EXISTS installations        CASCADE;
DROP TABLE IF EXISTS dispatch_items       CASCADE;
DROP TABLE IF EXISTS dispatches           CASCADE;
DROP TABLE IF EXISTS serial_numbers       CASCADE;
DROP TABLE IF EXISTS inventory            CASCADE;
DROP TABLE IF EXISTS payments             CASCADE;
DROP TABLE IF EXISTS orders               CASCADE;
DROP TABLE IF EXISTS quotation_items      CASCADE;
DROP TABLE IF EXISTS quotations           CASCADE;
DROP TABLE IF EXISTS package_items        CASCADE;
DROP TABLE IF EXISTS packages             CASCADE;
DROP TABLE IF EXISTS products             CASCADE;
DROP TABLE IF EXISTS surveys              CASCADE;
DROP TABLE IF EXISTS leads                CASCADE;
DROP TABLE IF EXISTS technicians          CASCADE;
DROP TABLE IF EXISTS customers            CASCADE;
DROP TABLE IF EXISTS users                CASCADE;

-- ─── Drop custom types ──────────────────────────────────────
DROP TYPE IF EXISTS user_role             CASCADE;
DROP TYPE IF EXISTS system_type           CASCADE;
DROP TYPE IF EXISTS lead_status           CASCADE;
DROP TYPE IF EXISTS survey_status         CASCADE;
DROP TYPE IF EXISTS quotation_status      CASCADE;
DROP TYPE IF EXISTS order_status          CASCADE;
DROP TYPE IF EXISTS payment_type          CASCADE;
DROP TYPE IF EXISTS serial_status         CASCADE;
DROP TYPE IF EXISTS dispatch_status       CASCADE;
DROP TYPE IF EXISTS installation_status   CASCADE;
DROP TYPE IF EXISTS warranty_status       CASCADE;
DROP TYPE IF EXISTS ticket_status         CASCADE;
DROP TYPE IF EXISTS subsidy_status        CASCADE;
DROP TYPE IF EXISTS product_category      CASCADE;

-- ─── Enum Types ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT', 'CUSTOMER');

CREATE TYPE system_type AS ENUM ('ON_GRID', 'OFF_GRID');

CREATE TYPE lead_status AS ENUM (
  'NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'SURVEY_DONE',
  'QUOTED', 'NEGOTIATING', 'WON', 'LOST'
);

CREATE TYPE survey_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');

CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CONVERTED');

CREATE TYPE order_status AS ENUM (
  'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH',
  'DISPATCHED', 'DELIVERED', 'INSTALLATION_SCHEDULED',
  'INSTALLED', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE payment_type AS ENUM ('ADVANCE', 'PARTIAL', 'FINAL', 'REFUND');

CREATE TYPE serial_status AS ENUM ('AVAILABLE', 'RESERVED', 'DISPATCHED', 'INSTALLED', 'FAULTY', 'RETURNED');

CREATE TYPE dispatch_status AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');

CREATE TYPE installation_status AS ENUM (
  'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TYPE warranty_status AS ENUM ('ACTIVE', 'EXPIRED', 'VOIDED', 'CLAIMED');

CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

CREATE TYPE subsidy_status AS ENUM (
  'NOT_APPLIED', 'APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'
);

CREATE TYPE product_category AS ENUM (
  'SOLAR_PANEL', 'INVERTER', 'BATTERY', 'MOUNTING_STRUCTURE',
  'CABLE', 'CONNECTOR', 'CHARGE_CONTROLLER', 'METER', 'OTHER'
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              SERIAL        PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  email           VARCHAR(200)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            user_role     NOT NULL DEFAULT 'SALES',
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,
  email       VARCHAR(200),
  address     TEXT,
  user_id     INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================
-- TECHNICIANS
-- ============================================================
CREATE TABLE technicians (
  id              SERIAL        PRIMARY KEY,
  user_id         INT           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone           VARCHAR(20),
  specialization  VARCHAR(150),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id                      SERIAL        PRIMARY KEY,
  customer_id             INT           NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  capacity_kw             NUMERIC(8,2)  CHECK (capacity_kw > 0),
  system_type             system_type,
  monthly_electricity_bill NUMERIC(10,2) CHECK (monthly_electricity_bill >= 0),
  roof_area               NUMERIC(10,2) CHECK (roof_area > 0),
  subsidy_required        BOOLEAN       NOT NULL DEFAULT FALSE,
  source                  VARCHAR(100),
  status                  lead_status   NOT NULL DEFAULT 'NEW',
  notes                   TEXT,
  assigned_to             INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status      ON leads(status);

-- ============================================================
-- SURVEYS
-- ============================================================
CREATE TABLE surveys (
  id                SERIAL        PRIMARY KEY,
  customer_id       INT           NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  technician_id     INT           REFERENCES technicians(id) ON DELETE SET NULL,
  lead_id           INT           REFERENCES leads(id) ON DELETE SET NULL,
  scheduled_date    DATE,
  roof_area         NUMERIC(10,2) CHECK (roof_area > 0),
  shadow_free_area  NUMERIC(10,2) CHECK (shadow_free_area >= 0),
  roof_direction    VARCHAR(50),
  roof_tilt         NUMERIC(5,2)  CHECK (roof_tilt >= 0 AND roof_tilt <= 90),
  cable_distance    NUMERIC(8,2)  CHECK (cable_distance >= 0),
  grid_suitable     BOOLEAN,
  notes             TEXT,
  status            survey_status NOT NULL DEFAULT 'PENDING',
  approved_by       INT           REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surveys_customer_id   ON surveys(customer_id);
CREATE INDEX idx_surveys_technician_id ON surveys(technician_id);
CREATE INDEX idx_surveys_status        ON surveys(status);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id              SERIAL          PRIMARY KEY,
  name            VARCHAR(200)    NOT NULL,
  sku             VARCHAR(100)    NOT NULL UNIQUE,
  category        product_category NOT NULL,
  description     TEXT,
  purchase_price  NUMERIC(12,2)   NOT NULL CHECK (purchase_price >= 0),
  selling_price   NUMERIC(12,2)   NOT NULL CHECK (selling_price >= 0),
  minimum_stock   INT             NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku      ON products(sku);
CREATE INDEX idx_products_category ON products(category);

-- ============================================================
-- PACKAGES
-- ============================================================
CREATE TABLE packages (
  id           SERIAL        PRIMARY KEY,
  capacity_kw  NUMERIC(8,2)  NOT NULL CHECK (capacity_kw > 0),
  system_type  system_type   NOT NULL,
  base_price   NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  description  TEXT,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_capacity    ON packages(capacity_kw);
CREATE INDEX idx_packages_system_type ON packages(system_type);

-- ============================================================
-- PACKAGE ITEMS (Bill of Materials per package)
-- ============================================================
CREATE TABLE package_items (
  id          SERIAL  PRIMARY KEY,
  package_id  INT     NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  product_id  INT     NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INT     NOT NULL CHECK (quantity > 0),
  UNIQUE (package_id, product_id)
);

CREATE INDEX idx_package_items_package_id ON package_items(package_id);

-- ============================================================
-- QUOTATIONS
-- ============================================================
CREATE TABLE quotations (
  id           SERIAL            PRIMARY KEY,
  customer_id  INT               NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  survey_id    INT               REFERENCES surveys(id) ON DELETE SET NULL,
  package_id   INT               REFERENCES packages(id) ON DELETE SET NULL,
  capacity_kw  NUMERIC(8,2)      NOT NULL CHECK (capacity_kw > 0),
  system_type  system_type       NOT NULL,
  subtotal     NUMERIC(14,2)     NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax          NUMERIC(14,2)     NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount     NUMERIC(14,2)     NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total        NUMERIC(14,2)     NOT NULL DEFAULT 0 CHECK (total >= 0),
  status       quotation_status  NOT NULL DEFAULT 'DRAFT',
  valid_until  DATE,
  notes        TEXT,
  approved_by  INT               REFERENCES users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_by   INT               REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_status      ON quotations(status);
CREATE INDEX idx_quotations_survey_id   ON quotations(survey_id);

-- ============================================================
-- QUOTATION ITEMS
-- ============================================================
CREATE TABLE quotation_items (
  id            SERIAL        PRIMARY KEY,
  quotation_id  INT           NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id    INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity      INT           NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price   NUMERIC(14,2) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id              SERIAL        PRIMARY KEY,
  quotation_id    INT           NOT NULL UNIQUE REFERENCES quotations(id) ON DELETE RESTRICT,
  customer_id     INT           NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  total_amount    NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
  amount_paid     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  balance_due     NUMERIC(14,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status          order_status  NOT NULL DEFAULT 'CONFIRMED',
  notes           TEXT,
  created_by      INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id  ON orders(customer_id);
CREATE INDEX idx_orders_quotation_id ON orders(quotation_id);
CREATE INDEX idx_orders_status       ON orders(status);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                  SERIAL        PRIMARY KEY,
  order_id            INT           NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_type        payment_type  NOT NULL,
  payment_reference   VARCHAR(200)  NOT NULL UNIQUE,
  payment_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes               TEXT,
  recorded_by         INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id  ON payments(order_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE inventory (
  id                  SERIAL        PRIMARY KEY,
  product_id          INT           NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_available  INT           NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved   INT           NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by          INT           REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- ============================================================
-- SERIAL NUMBERS
-- ============================================================
CREATE TABLE serial_numbers (
  id             SERIAL        PRIMARY KEY,
  product_id     INT           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  serial_number  VARCHAR(200)  NOT NULL UNIQUE,
  order_id       INT           REFERENCES orders(id) ON DELETE SET NULL,
  dispatch_date  DATE,
  status         serial_status NOT NULL DEFAULT 'AVAILABLE',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_serial_numbers_product_id    ON serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_serial_number ON serial_numbers(serial_number);
CREATE INDEX idx_serial_numbers_order_id      ON serial_numbers(order_id);
CREATE INDEX idx_serial_numbers_status        ON serial_numbers(status);

-- ============================================================
-- DISPATCHES
-- ============================================================
CREATE TABLE dispatches (
  id            SERIAL          PRIMARY KEY,
  order_id      INT             NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  dispatched_at TIMESTAMPTZ,
  status        dispatch_status NOT NULL DEFAULT 'PENDING',
  notes         TEXT,
  dispatched_by INT             REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispatches_order_id ON dispatches(order_id);
CREATE INDEX idx_dispatches_status   ON dispatches(status);

-- ============================================================
-- DISPATCH ITEMS
-- ============================================================
CREATE TABLE dispatch_items (
  id                SERIAL  PRIMARY KEY,
  dispatch_id       INT     NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  serial_number_id  INT     NOT NULL REFERENCES serial_numbers(id) ON DELETE RESTRICT,
  UNIQUE (dispatch_id, serial_number_id)
);

CREATE INDEX idx_dispatch_items_dispatch_id ON dispatch_items(dispatch_id);

-- ============================================================
-- INSTALLATIONS
-- ============================================================
CREATE TABLE installations (
  id                    SERIAL              PRIMARY KEY,
  order_id              INT                 NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  technician_id         INT                 REFERENCES technicians(id) ON DELETE SET NULL,
  scheduled_date        DATE,
  start_time            TIMESTAMPTZ,
  completion_time       TIMESTAMPTZ,
  system_capacity       NUMERIC(8,2),
  installation_status   installation_status NOT NULL DEFAULT 'SCHEDULED',
  test_result           VARCHAR(100),
  customer_signature    TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installations_order_id      ON installations(order_id);
CREATE INDEX idx_installations_technician_id ON installations(technician_id);
CREATE INDEX idx_installations_status        ON installations(installation_status);

-- ============================================================
-- INSTALLATION PHOTOS
-- ============================================================
CREATE TABLE installation_photos (
  id               SERIAL       PRIMARY KEY,
  installation_id  INT          NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  image_url        TEXT         NOT NULL,
  caption          VARCHAR(255),
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installation_photos_installation_id ON installation_photos(installation_id);

-- ============================================================
-- WARRANTIES
-- ============================================================
CREATE TABLE warranties (
  id                 SERIAL          PRIMARY KEY,
  serial_number_id   INT             NOT NULL UNIQUE REFERENCES serial_numbers(id) ON DELETE CASCADE,
  start_date         DATE            NOT NULL,
  expiry_date        DATE            NOT NULL,
  warranty_status    warranty_status NOT NULL DEFAULT 'ACTIVE',
  notes              TEXT,
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_warranty_dates CHECK (expiry_date > start_date)
);

CREATE INDEX idx_warranties_serial_number_id ON warranties(serial_number_id);
CREATE INDEX idx_warranties_status           ON warranties(warranty_status);
CREATE INDEX idx_warranties_expiry           ON warranties(expiry_date);

-- ============================================================
-- SERVICE TICKETS
-- ============================================================
CREATE TABLE service_tickets (
  id                SERIAL        PRIMARY KEY,
  customer_id       INT           NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  serial_number_id  INT           REFERENCES serial_numbers(id) ON DELETE SET NULL,
  technician_id     INT           REFERENCES technicians(id) ON DELETE SET NULL,
  fault_code        VARCHAR(100),
  description       TEXT          NOT NULL,
  warranty_covered  BOOLEAN       NOT NULL DEFAULT FALSE,
  parts_cost        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
  labour_cost       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labour_cost >= 0),
  total_cost        NUMERIC(14,2) GENERATED ALWAYS AS (parts_cost + labour_cost) STORED,
  status            ticket_status NOT NULL DEFAULT 'OPEN',
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ
);

CREATE INDEX idx_service_tickets_customer_id      ON service_tickets(customer_id);
CREATE INDEX idx_service_tickets_serial_number_id ON service_tickets(serial_number_id);
CREATE INDEX idx_service_tickets_status           ON service_tickets(status);
CREATE INDEX idx_service_tickets_technician_id    ON service_tickets(technician_id);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id            SERIAL        PRIMARY KEY,
  order_id      INT           REFERENCES orders(id) ON DELETE SET NULL,
  category      VARCHAR(100)  NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description   TEXT,
  expense_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  recorded_by   INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_order_id    ON expenses(order_id);
CREATE INDEX idx_expenses_category    ON expenses(category);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- ============================================================
-- SUBSIDIES
-- ============================================================
CREATE TABLE subsidies (
  id                  SERIAL          PRIMARY KEY,
  customer_id         INT             NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id            INT             NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  application_status  subsidy_status  NOT NULL DEFAULT 'NOT_APPLIED',
  reference_number    VARCHAR(200),
  submitted_at        TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  disbursed_at        TIMESTAMPTZ,
  amount              NUMERIC(14,2)   CHECK (amount >= 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subsidies_customer_id ON subsidies(customer_id);
CREATE INDEX idx_subsidies_order_id    ON subsidies(order_id);
CREATE INDEX idx_subsidies_status      ON subsidies(application_status);

-- ============================================================
-- Trigger: auto-update updated_at on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'customers', 'leads', 'surveys', 'products',
    'packages', 'quotations', 'orders', 'serial_numbers',
    'dispatches', 'installations', 'warranties',
    'service_tickets', 'subsidies'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_update_%1$s ON %1$s;
       CREATE TRIGGER trg_update_%1$s
       BEFORE UPDATE ON %1$s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Trigger: keep orders.amount_paid in sync after payment insert
-- ============================================================
CREATE OR REPLACE FUNCTION sync_order_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET amount_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_amount_paid ON payments;
CREATE TRIGGER trg_sync_amount_paid
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION sync_order_amount_paid();

-- ============================================================
-- Trigger: auto-expire warranties by expiry_date
-- (status updated on SELECT via check; here we ensure a
--  periodic-style approach on every warranty read/update)
-- ============================================================
CREATE OR REPLACE FUNCTION auto_expire_warranty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE AND NEW.warranty_status = 'ACTIVE' THEN
    NEW.warranty_status = 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_expire_warranty ON warranties;
CREATE TRIGGER trg_auto_expire_warranty
BEFORE INSERT OR UPDATE ON warranties
FOR EACH ROW EXECUTE FUNCTION auto_expire_warranty();
