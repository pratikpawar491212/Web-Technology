<?php
/**
 * config/db.php
 * Single PDO connection used across the whole app.
 * Edit these four values to match your MySQL setup (XAMPP defaults shown).
 */

const DB_HOST = 'localhost';
const DB_NAME = 'electricity_billing';
const DB_USER = 'root';
const DB_PASS = ''; // XAMPP's default root password is empty

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // Never leak DB credentials/errors to the browser in a real deployment;
    // this message is deliberately generic.
    http_response_code(500);
    die('Database connection failed. Make sure MySQL is running and the '
        . 'electricity_billing database has been imported (see database/schema.sql).');
}
