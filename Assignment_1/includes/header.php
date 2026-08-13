<?php
/**
 * includes/header.php
 * Expects $pageTitle to be set by the including page.
 * Requires includes/auth.php to already be included (for current_user()).
 */
$user = current_user();
$pageTitle = $pageTitle ?? 'VoltMeter';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= h($pageTitle) ?> — VoltMeter</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap.min.css" rel="stylesheet">
  <link href="<?= h(base_url('assets/css/style.css')) ?>" rel="stylesheet">
</head>
<body>
<div class="site-wrap">
  <header class="site-header">
    <a class="brand" href="<?= h(base_url($user ? (is_admin() ? 'admin/dashboard.php' : 'dashboard.php') : 'index.php')) ?>">
      <span class="brand-mark">V</span>VoltMeter
    </a>

    <nav class="main-nav">
      <?php if ($user): ?>
        <?php if (is_admin()): ?>
          <a href="<?= h(base_url('admin/dashboard.php')) ?>" class="nav-link">Reports</a>
          <a href="<?= h(base_url('admin/customers.php')) ?>" class="nav-link">Customers</a>
        <?php else: ?>
          <a href="<?= h(base_url('dashboard.php')) ?>" class="nav-link">Calculate</a>
          <a href="<?= h(base_url('history.php')) ?>" class="nav-link">Bill history</a>
        <?php endif; ?>
        <span class="nav-user"><?= h($user['name']) ?><span class="role-pill"><?= h($user['role']) ?></span></span>
        <a href="<?= h(base_url('logout.php')) ?>" class="nav-link nav-link--logout">Log out</a>
      <?php else: ?>
        <a href="<?= h(base_url('login.php')) ?>" class="nav-link">Log in</a>
        <a href="<?= h(base_url('register.php')) ?>" class="nav-link nav-link--cta">Sign up</a>
      <?php endif; ?>
    </nav>
  </header>
</div>
