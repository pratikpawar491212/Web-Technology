<?php
/**
 * setup/create_admin.php
 * Run this ONCE in your browser to create the first admin account,
 * then delete this file (or at least move it out of the web root).
 *
 * Default login it creates:
 *   email:    admin@voltmeter.test
 *   password: Admin@123
 * Change ADMIN_EMAIL / ADMIN_PASSWORD below before running if you want
 * different credentials.
 */

require_once __DIR__ . '/../config/db.php';

const ADMIN_NAME     = 'Site Admin';
const ADMIN_EMAIL    = 'admin@voltmeter.test';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_METER    = 'ADMIN-0001';

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([ADMIN_EMAIL]);

if ($stmt->fetch()) {
    echo 'An account with this email already exists. Nothing was changed.';
    exit;
}

$stmt = $pdo->prepare(
    'INSERT INTO users (name, email, password, meter_number, role) VALUES (?, ?, ?, ?, "admin")'
);
$stmt->execute([
    ADMIN_NAME,
    ADMIN_EMAIL,
    password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT),
    ADMIN_METER,
]);

echo 'Admin account created.<br>Email: ' . htmlspecialchars(ADMIN_EMAIL)
    . '<br>Password: ' . htmlspecialchars(ADMIN_PASSWORD)
    . '<br><br><strong>Delete this file now (setup/create_admin.php) — '
    . 'leaving it live lets anyone recreate an admin account.</strong>';
