<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_admin();

// ---- Top-line totals ----
$totals = $pdo->query(
    "SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COUNT(*) FROM bills) AS bills,
        (SELECT COALESCE(SUM(total_amount),0) FROM bills) AS revenue,
        (SELECT COALESCE(AVG(total_amount),0) FROM bills) AS avg_bill"
)->fetch();

// ---- Revenue by month (last 12 months of data present) ----
$monthly = $pdo->query(
    "SELECT billing_month, COUNT(*) AS bill_count, SUM(total_amount) AS revenue
     FROM bills GROUP BY billing_month ORDER BY billing_month ASC"
)->fetchAll();

// ---- Slab-wise revenue distribution across ALL bills ----
$slabTotals = $pdo->query(
    "SELECT
        SUM(slab1_cost) AS slab1, SUM(slab2_cost) AS slab2,
        SUM(slab3_cost) AS slab3, SUM(slab4_cost) AS slab4
     FROM bills"
)->fetch();

// ---- Top consumers ----
$topConsumers = $pdo->query(
    "SELECT u.name, u.meter_number, COUNT(b.id) AS bill_count, SUM(b.total_amount) AS total_paid
     FROM users u JOIN bills b ON b.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id ORDER BY total_paid DESC LIMIT 5"
)->fetchAll();

// ---- Most recent bills across all customers ----
$recentBills = $pdo->query(
    "SELECT b.*, u.name, u.meter_number FROM bills b
     JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC LIMIT 8"
)->fetchAll();

$pageTitle = 'Admin reports';
$extraScripts = [
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js',
    h(base_url('assets/js/admin.js')),
];
require_once __DIR__ . '/../includes/header.php';
?>

<section class="hero hero--compact">
  <span class="hero-eyebrow">Admin</span>
  <h1>Reports</h1>
  <p>Overview across every customer account.</p>
</section>

<div class="row g-4 stat-row">
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Customers</span>
      <span class="stat-value"><?= (int)$totals['customers'] ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Bills generated</span>
      <span class="stat-value"><?= (int)$totals['bills'] ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Total revenue</span>
      <span class="stat-value">₹<?= number_format((float)$totals['revenue'], 0) ?></span>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="panel stat-card">
      <span class="stat-label">Average bill</span>
      <span class="stat-value">₹<?= number_format((float)$totals['avg_bill'], 0) ?></span>
    </div>
  </div>
</div>

<div class="row g-4 mt-1">
  <div class="col-12 col-lg-7">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Revenue by month</div>
      <?php if (!$monthly): ?>
        <div class="empty-state">No bills yet — data will show up here once customers start calculating.</div>
      <?php else: ?>
        <canvas id="revenueChart" height="220"></canvas>
      <?php endif; ?>
    </div>
  </div>
  <div class="col-12 col-lg-5">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Revenue by slab</div>
      <?php if ((float)$totals['revenue'] <= 0): ?>
        <div class="empty-state">No bills yet.</div>
      <?php else: ?>
        <canvas id="slabChart" height="220"></canvas>
      <?php endif; ?>
    </div>
  </div>
</div>

<div class="row g-4 mt-1">
  <div class="col-12 col-lg-6">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Top consumers</div>
      <?php if (!$topConsumers): ?>
        <div class="empty-state">No data yet.</div>
      <?php else: ?>
        <table class="breakdown-table">
          <thead><tr><th>Customer</th><th class="num">Bills</th><th class="num">Total paid</th></tr></thead>
          <tbody>
            <?php foreach ($topConsumers as $c): ?>
              <tr>
                <td><?= h($c['name']) ?><br><span class="muted-small"><?= h($c['meter_number']) ?></span></td>
                <td class="num"><?= (int)$c['bill_count'] ?></td>
                <td class="num">₹<?= number_format((float)$c['total_paid'], 2) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>

  <div class="col-12 col-lg-6">
    <div class="panel">
      <div class="panel-title">
        <span class="dot"></span>Recent bills
        <a href="<?= h(base_url('admin/customers.php')) ?>" class="panel-title-link">All customers →</a>
      </div>
      <?php if (!$recentBills): ?>
        <div class="empty-state">No bills yet.</div>
      <?php else: ?>
        <table class="breakdown-table">
          <thead><tr><th>Customer</th><th>Month</th><th class="num">Amount</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($recentBills as $b): ?>
              <tr>
                <td><?= h($b['name']) ?></td>
                <td><?= h($b['billing_month']) ?></td>
                <td class="num">₹<?= number_format((float)$b['total_amount'], 2) ?></td>
                <td class="num"><a href="<?= h(base_url('bill.php?id=' . $b['id'])) ?>" class="row-link">View</a></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>
</div>

<script>
  window.__adminChartData = {
    monthly: <?= json_encode($monthly) ?>,
    slabs: <?= json_encode($slabTotals) ?>
  };
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
