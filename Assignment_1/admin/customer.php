<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_admin();

$customerId = (int) ($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND role = 'customer'");
$stmt->execute([$customerId]);
$customer = $stmt->fetch();

if (!$customer) {
    http_response_code(404);
    $pageTitle = 'Customer not found';
    require_once __DIR__ . '/../includes/header.php';
    echo '<div class="panel"><div class="empty-state">No such customer.</div></div>';
    require_once __DIR__ . '/../includes/footer.php';
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY created_at DESC');
$stmt->execute([$customerId]);
$bills = $stmt->fetchAll();

$totalPaid = array_sum(array_column($bills, 'total_amount'));

$pageTitle = $customer['name'];
require_once __DIR__ . '/../includes/header.php';
?>

<section class="hero hero--compact">
  <span class="hero-eyebrow">Admin · Customer</span>
  <h1><?= h($customer['name']) ?></h1>
  <p><?= h($customer['email']) ?> · Meter <?= h($customer['meter_number']) ?></p>
</section>

<div class="row g-4 stat-row">
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Bills</span>
      <span class="stat-value"><?= count($bills) ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Total paid</span>
      <span class="stat-value">₹<?= number_format($totalPaid, 0) ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Phone</span>
      <span class="stat-value stat-value--sm"><?= h($customer['phone'] ?: '—') ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Joined</span>
      <span class="stat-value stat-value--sm"><?= h(date('d M Y', strtotime($customer['created_at']))) ?></span>
    </div>
  </div>
</div>

<div class="panel mt-4">
  <div class="panel-title"><span class="dot"></span>Bill history</div>

  <?php if (!$bills): ?>
    <div class="empty-state">This customer hasn't calculated any bills yet.</div>
  <?php else: ?>
    <table class="breakdown-table">
      <thead><tr><th>Month</th><th class="num">Units</th><th class="num">Amount</th><th>Saved on</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($bills as $bill): ?>
          <tr>
            <td><?= h($bill['billing_month']) ?></td>
            <td class="num"><?= h($bill['total_units']) ?></td>
            <td class="num">₹<?= number_format((float)$bill['total_amount'], 2) ?></td>
            <td><?= h(date('d M Y, H:i', strtotime($bill['created_at']))) ?></td>
            <td class="num"><a href="<?= h(base_url('bill.php?id=' . $bill['id'])) ?>" class="row-link">View</a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>

<div class="mt-3">
  <a href="<?= h(base_url('admin/customers.php')) ?>" class="btn-ghost btn-ghost--sm">← All customers</a>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
