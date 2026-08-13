-- ============================================================
-- VoltMeter — Electricity Bill Calculator
-- Database schema
-- Import this in phpMyAdmin, or run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS electricity_billing
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE electricity_billing;

-- ------------------------------------------------------------
-- users: both customers and the admin live here, split by role
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password      VARCHAR(255)        NOT NULL,
    meter_number  VARCHAR(50)         NOT NULL UNIQUE,
    phone         VARCHAR(20)         DEFAULT NULL,
    address       VARCHAR(255)        DEFAULT NULL,
    role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- bills: one row per calculated/saved bill, slab costs broken
-- out into columns so admin reports can SUM() them directly
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    billing_month  VARCHAR(7) NOT NULL,   -- 'YYYY-MM'
    total_units    DECIMAL(10,2) NOT NULL,

    slab1_units    DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab1_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab2_units    DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab2_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab3_units    DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab3_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab4_units    DECIMAL(10,2) NOT NULL DEFAULT 0,
    slab4_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,

    total_amount   DECIMAL(10,2) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_month (user_id, billing_month)
) ENGINE=InnoDB;
