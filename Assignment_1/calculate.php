<?php
/**
 * calculate.php
 * AJAX endpoint: computes the slab bill for the posted units, saves it
 * to the logged-in customer's bill history, and returns the breakdown.
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/billing.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => '', 'data' => null];

if (!is_logged_in()) {
    http_response_code(401);
    $response['message'] = 'Please log in to calculate and save a bill.';
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method.';
    echo json_encode($response);
    exit;
}

if (empty($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'] ?? '', $_POST['csrf_token'])) {
    http_response_code(400);
    $response['message'] = 'Your session expired. Please refresh the page and try again.';
    echo json_encode($response);
    exit;
}

$rawUnits = $_POST['units'] ?? null;
$billingMonth = trim($_POST['billing_month'] ?? '');

if ($rawUnits === null || $rawUnits === '') {
    $response['message'] = 'Please enter the number of units consumed.';
} elseif (!is_numeric($rawUnits)) {
    $response['message'] = 'Units must be a valid number.';
} elseif ((float) $rawUnits < 0) {
    $response['message'] = 'Units cannot be negative.';
} elseif (!preg_match('/^\d{4}-\d{2}$/', $billingMonth)) {
    $response['message'] = 'Please choose a valid billing month.';
} else {
    $result = calculate_electricity_bill((float) $rawUnits);
    $user = current_user();

    $stmt = $pdo->prepare(
        'INSERT INTO bills
            (user_id, billing_month, total_units,
             slab1_units, slab1_cost, slab2_units, slab2_cost,
             slab3_units, slab3_cost, slab4_units, slab4_cost, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $user['id'],
        $billingMonth,
        $result['units'],
        $result['slab1_units'], $result['slab1_cost'],
        $result['slab2_units'], $result['slab2_cost'],
        $result['slab3_units'], $result['slab3_cost'],
        $result['slab4_units'], $result['slab4_cost'],
        $result['total'],
    ]);

    $result['bill_id'] = $pdo->lastInsertId();
    $result['billing_month'] = $billingMonth;

    $response['success'] = true;
    $response['data'] = $result;
}

echo json_encode($response);
