-- =====================================================
-- Run this AFTER connecting to the electricity_billing DB, e.g.:
--   psql -U postgres -d electricity_billing -f 02_create_tables.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS bill_records (
    id                SERIAL PRIMARY KEY,
    consumer_name     VARCHAR(100)      NOT NULL,
    consumer_number   VARCHAR(50)       NOT NULL,
    units_consumed    DOUBLE PRECISION  NOT NULL CHECK (units_consumed >= 0),
    bill_amount       DOUBLE PRECISION  NOT NULL CHECK (bill_amount >= 0),
    billing_date      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_records_date ON bill_records (billing_date DESC);
CREATE INDEX IF NOT EXISTS idx_bill_records_consumer ON bill_records (consumer_number);

-- Sample rows so the History / Dashboard views have data immediately
INSERT INTO bill_records (consumer_name, consumer_number, units_consumed, bill_amount)
VALUES
    ('Ramesh Kumar', 'CN-1001', 120, 455.00),
    ('Priya Sharma', 'CN-1002', 300, 1420.00),
    ('Anita Desai',  'CN-1003', 45,  157.50),
    ('Vikram Rao',   'CN-1004', 210, 887.00);
