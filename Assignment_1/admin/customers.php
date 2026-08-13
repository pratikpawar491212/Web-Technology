<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';
require_admin();

$customers = $pdo->query(
    "SELECT u.id, u.name, u.email, u.meter_number, u.phone, u.created_at,
            COUNT(b.id) AS bill_count, COALESCE(SUM(b.total_amount),0) AS total_paid
     FROM users u
     LEFT JOIN bills b ON b.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id
     ORDER BY u.created_at DESC"
)->fetchAll();

$pageTitle = 'Customers';
$extraScripts = [h(base_url('assets/js/customers.js'))];
require_once __DIR__ . '/../includes/header.php';
?>

<section class="hero hero--compact">
  <span class="hero-eyebrow">Admin</span>
  <h1>Customers</h1>
  <p><?= count($customers) ?> registered accounts.</p>
</section>

<div class="panel">
  <div class="filter-row">
    <label class="form-label" for="customerSearch">Search</label>
    <input type="text" id="customerSearch" class="text-input text-input--inline" placeholder="Name, email or meter number">
  </div>

  <?php if (!$customers): ?>
    <div class="empty-state">No customers have registered yet.</div>
  <?php else: ?>
    <table class="breakdown-table" id="customerTable">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Meter no.</th><th class="num">Bills</th><th class="num">Total paid</th><th>Joined</th><th></th></tr>
      </thead>
      <tbody>
        <?php foreach ($customers as $c): ?>
          <tr>
            <td><?= h($c['name']) ?></td>
            <td><?= h($c['email']) ?></td>
            <td><?= h($c['meter_number']) ?></td>
            <td class="num"><?= (int)$c['bill_count'] ?></td>
            <td class="num">₹<?= number_format((float)$c['total_paid'], 2) ?></td>
            <td><?= h(date('d M Y', strtotime($c['created_at']))) ?></td>
            <td class="num"><a href="<?= h(base_url('admin/customer.php?id=' . $c['id'])) ?>" class="row-link">View</a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
