<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';
require_login();

$billId = (int) ($_GET['id'] ?? 0);
$user = current_user();

if (is_admin()) {
    $stmt = $pdo->prepare('SELECT b.*, u.name, u.email, u.meter_number, u.address FROM bills b JOIN users u ON u.id = b.user_id WHERE b.id = ?');
    $stmt->execute([$billId]);
} else {
    $stmt = $pdo->prepare('SELECT b.*, u.name, u.email, u.meter_number, u.address FROM bills b JOIN users u ON u.id = b.user_id WHERE b.id = ? AND b.user_id = ?');
    $stmt->execute([$billId, $user['id']]);
}
$bill = $stmt->fetch();

if (!$bill) {
    http_response_code(404);
    $pageTitle = 'Bill not found';
    require_once __DIR__ . '/includes/header.php';
    echo '<div class="panel"><div class="empty-state">That bill doesn\'t exist or isn\'t linked to your account.</div></div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$slabs = [
    ['label' => 'First 50 units', 'units' => $bill['slab1_units'], 'rate' => 3.50, 'cost' => $bill['slab1_cost']],
    ['label' => 'Next 100 units (51-150)', 'units' => $bill['slab2_units'], 'rate' => 4.00, 'cost' => $bill['slab2_cost']],
    ['label' => 'Next 100 units (151-250)', 'units' => $bill['slab3_units'], 'rate' => 5.20, 'cost' => $bill['slab3_cost']],
    ['label' => 'Above 250 units', 'units' => $bill['slab4_units'], 'rate' => 6.50, 'cost' => $bill['slab4_cost']],
];

$pageTitle = 'Bill #' . $bill['id'];
require_once __DIR__ . '/includes/header.php';
?>

<div class="panel bill-print">
  <div class="bill-print__head">
    <div>
      <div class="panel-title"><span class="dot"></span>Electricity bill</div>
      <p class="bill-meta">Bill #<?= (int)$bill['id'] ?> · <?= h($bill['billing_month']) ?></p>
    </div>
    <button onclick="window.print()" class="btn-ghost btn-ghost--sm no-print">Print</button>
  </div>

  <div class="row g-3 bill-print__customer">
    <div class="col-6 col-md-3"><span class="bill-label">Customer</span><br><?= h($bill['name']) ?></div>
    <div class="col-6 col-md-3"><span class="bill-label">Meter no.</span><br><?= h($bill['meter_number']) ?></div>
    <div class="col-6 col-md-3"><span class="bill-label">Email</span><br><?= h($bill['email']) ?></div>
    <div class="col-6 col-md-3"><span class="bill-label">Saved on</span><br><?= h(date('d M Y, H:i', strtotime($bill['created_at']))) ?></div>
  </div>

  <div class="meter">
    <div class="meter-label">Total payable</div>
    <div class="meter-digits">
      <?php foreach (mb_str_split('₹' . number_format((float)$bill['total_amount'], 2)) as $char): ?>
        <div class="meter-digit<?= is_numeric($char) ? '' : ' is-symbol' ?>"><span class="digit-inner"><?= h($char) ?></span></div>
      <?php endforeach; ?>
    </div>
    <div class="meter-sub"><?= h($bill['total_units']) ?> units consumed</div>
  </div>

  <table class="breakdown-table">
    <thead><tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Cost</th></tr></thead>
    <tbody>
      <?php foreach ($slabs as $slab): if ((float)$slab['units'] <= 0) continue; ?>
        <tr>
          <td><?= h($slab['label']) ?></td>
          <td class="num"><?= h($slab['units']) ?></td>
          <td class="num">₹<?= number_format((float)$slab['rate'], 2) ?></td>
          <td class="num">₹<?= number_format((float)$slab['cost'], 2) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>

  <div class="no-print">
    <a href="<?= h(base_url(is_admin() ? 'admin/customer.php?id=' . $bill['user_id'] : 'history.php')) ?>" class="btn-ghost btn-ghost--sm">← Back</a>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
