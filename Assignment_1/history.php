<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';
require_login();
if (is_admin()) { header('Location: ' . base_url('admin/dashboard.php')); exit; }

$user = current_user();

$monthFilter = trim($_GET['month'] ?? '');
if ($monthFilter && preg_match('/^\d{4}-\d{2}$/', $monthFilter)) {
    $stmt = $pdo->prepare('SELECT * FROM bills WHERE user_id = ? AND billing_month = ? ORDER BY created_at DESC');
    $stmt->execute([$user['id'], $monthFilter]);
} else {
    $monthFilter = '';
    $stmt = $pdo->prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user['id']]);
}
$bills = $stmt->fetchAll();

$pageTitle = 'Bill history';
require_once __DIR__ . '/includes/header.php';
?>

<section class="hero hero--compact">
  <span class="hero-eyebrow">Bill history</span>
  <h1>Every bill you've calculated</h1>
  <p>Meter <?= h($user['meter_number']) ?></p>
</section>

<div class="panel">
  <form method="get" class="filter-row">
    <label class="form-label" for="month">Filter by month</label>
    <input type="month" id="month" name="month" class="text-input text-input--inline" value="<?= h($monthFilter) ?>">
    <button type="submit" class="btn-ghost btn-ghost--sm">Filter</button>
    <?php if ($monthFilter): ?>
      <a href="<?= h(base_url('history.php')) ?>" class="btn-ghost btn-ghost--sm">Clear</a>
    <?php endif; ?>
  </form>

  <?php if (!$bills): ?>
    <div class="empty-state">No bills found<?= $monthFilter ? ' for that month' : '' ?>.</div>
  <?php else: ?>
    <table class="breakdown-table">
      <thead>
        <tr><th>Month</th><th class="num">Units</th><th class="num">Amount</th><th>Saved on</th><th></th></tr>
      </thead>
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

<?php require_once __DIR__ . '/includes/footer.php'; ?>
