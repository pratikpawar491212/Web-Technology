<?php
require_once __DIR__ . '/includes/auth.php';

// Already logged in? send them straight to their dashboard.
if (is_logged_in()) {
    header('Location: ' . base_url(is_admin() ? 'admin/dashboard.php' : 'dashboard.php'));
    exit;
}

$pageTitle = 'Home';
require_once __DIR__ . '/includes/header.php';
?>

<section class="hero">
  <span class="hero-eyebrow">Electricity bill calculator</span>
  <h1>Know your bill before it arrives.</h1>
  <p>VoltMeter calculates your electricity bill slab by slab, the same way your utility does it — then keeps a running history of every bill tied to your account, so you can track usage over time.</p>

  <div class="hero-cta">
    <a href="<?= h(base_url('register.php')) ?>" class="btn-calc btn-calc--inline">Create free account</a>
    <a href="<?= h(base_url('login.php')) ?>" class="btn-ghost">Log in</a>
  </div>

  <div class="rate-rail">
    <div class="rate-rail__seg rate-rail__seg--1">
      <span class="band">0 – 50 units</span>
      <span class="rate">₹3.50 <small>/unit</small></span>
    </div>
    <div class="rate-rail__seg rate-rail__seg--2">
      <span class="band">51 – 150 units</span>
      <span class="rate">₹4.00 <small>/unit</small></span>
    </div>
    <div class="rate-rail__seg rate-rail__seg--3">
      <span class="band">151 – 250 units</span>
      <span class="rate">₹5.20 <small>/unit</small></span>
    </div>
    <div class="rate-rail__seg rate-rail__seg--4">
      <span class="band">250+ units</span>
      <span class="rate">₹6.50 <small>/unit</small></span>
    </div>
  </div>
</section>

<section class="row g-4 feature-row">
  <div class="col-12 col-md-4">
    <div class="panel feature-card">
      <div class="feature-icon">01</div>
      <h3>Instant calculation</h3>
      <p>Enter your meter reading and get a slab-wise breakdown of your bill in real time.</p>
    </div>
  </div>
  <div class="col-12 col-md-4">
    <div class="panel feature-card">
      <div class="feature-icon">02</div>
      <h3>Saved history</h3>
      <p>Every bill you calculate is saved to your account, organised by billing month.</p>
    </div>
  </div>
  <div class="col-12 col-md-4">
    <div class="panel feature-card">
      <div class="feature-icon">03</div>
      <h3>Printable bills</h3>
      <p>Open any past bill and print or save it as a record for your files.</p>
    </div>
  </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
