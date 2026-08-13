<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';
require_login();
if (is_admin()) { header('Location: ' . base_url('admin/dashboard.php')); exit; }

$user = current_user();

// Recent bills snapshot for this customer
$stmt = $pdo->prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY created_at DESC LIMIT 5');
$stmt->execute([$user['id']]);
$recentBills = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT COUNT(*) c, COALESCE(SUM(total_amount),0) total FROM bills WHERE user_id = ?');
$stmt->execute([$user['id']]);
$summary = $stmt->fetch();

$pageTitle = 'Calculate';
$extraScripts = [h(base_url('assets/js/script.js'))];
require_once __DIR__ . '/includes/header.php';

$currentMonth = date('Y-m');
?>

<section class="hero hero--compact">
  <span class="hero-eyebrow">Welcome back</span>
  <h1><?= h($user['name']) ?></h1>
  <p>Meter <?= h($user['meter_number']) ?> · <?= (int)$summary['c'] ?> bills saved · ₹<?= number_format((float)$summary['total'], 2) ?> total paid</p>
</section>

<div class="row g-4">
  <!-- Input panel -->
  <div class="col-12 col-lg-5">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>New reading</div>

      <form id="billForm" novalidate>
        <input type="hidden" name="csrf_token" value="<?= h(csrf_token()) ?>">

        <label for="billing_month" class="form-label">Billing month</label>
        <input type="month" id="billing_month" name="billing_month" class="text-input mb-3" value="<?= h($currentMonth) ?>" required>

        <label for="units" class="form-label">Units consumed (kWh)</label>
        <input
          type="number" id="units" name="units" class="units-input"
          placeholder="e.g. 210" min="0" step="1" inputmode="decimal" autocomplete="off" required
        >
        <div class="unit-suffix">kWh this billing cycle</div>

        <button type="submit" id="calcBtn" class="btn-calc">Calculate &amp; save bill</button>
        <div id="errorMsg" class="error-msg"></div>
      </form>
    </div>
  </div>

  <!-- Result panel -->
  <div class="col-12 col-lg-7">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Bill breakdown</div>

      <div id="emptyState" class="empty-state">
        Enter your units and hit "Calculate &amp; save bill" to see the breakdown.
      </div>

      <div id="resultPanel" class="d-none">
        <div class="meter">
          <div class="meter-label">Total payable</div>
          <div class="meter-digits" id="meterDigits"></div>
          <div class="meter-sub" id="meterSub"></div>
        </div>

        <table class="breakdown-table">
          <thead>
            <tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Cost</th></tr>
          </thead>
          <tbody id="breakdownBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Recent bills -->
<div class="panel mt-4">
  <div class="panel-title">
    <span class="dot"></span>Recent bills
    <a href="<?= h(base_url('history.php')) ?>" class="panel-title-link">View all →</a>
  </div>

  <?php if (!$recentBills): ?>
    <div class="empty-state">No bills saved yet — your first calculation above will show up here.</div>
  <?php else: ?>
    <table class="breakdown-table">
      <thead>
        <tr><th>Month</th><th class="num">Units</th><th class="num">Amount</th><th></th></tr>
      </thead>
      <tbody>
        <?php foreach ($recentBills as $bill): ?>
          <tr>
            <td><?= h($bill['billing_month']) ?></td>
            <td class="num"><?= h($bill['total_units']) ?></td>
            <td class="num">₹<?= number_format((float)$bill['total_amount'], 2) ?></td>
            <td class="num"><a href="<?= h(base_url('bill.php?id=' . $bill['id'])) ?>" class="row-link">View</a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
