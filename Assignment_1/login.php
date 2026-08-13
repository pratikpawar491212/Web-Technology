<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

if (is_logged_in()) {
    header('Location: ' . base_url(is_admin() ? 'admin/dashboard.php' : 'dashboard.php'));
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf($_POST['csrf_token'] ?? null);

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        login_user($user);
        header('Location: ' . base_url($user['role'] === 'admin' ? 'admin/dashboard.php' : 'dashboard.php'));
        exit;
    }

    $error = 'Incorrect email or password.';
}

$pageTitle = 'Log in';
require_once __DIR__ . '/includes/header.php';
?>

<div class="row justify-content-center">
  <div class="col-12 col-md-6 col-lg-5">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Log in</div>

      <?php if ($error): ?>
        <div class="alert-box"><?= h($error) ?></div>
      <?php endif; ?>

      <form method="post" novalidate>
        <input type="hidden" name="csrf_token" value="<?= h(csrf_token()) ?>">

        <div class="mb-3">
          <label class="form-label" for="email">Email</label>
          <input type="email" id="email" name="email" class="text-input" required autofocus>
        </div>

        <div class="mb-3">
          <label class="form-label" for="password">Password</label>
          <input type="password" id="password" name="password" class="text-input" required>
        </div>

        <button type="submit" class="btn-calc">Log in</button>
      </form>

      <p class="form-footnote">No account yet? <a href="<?= h(base_url('register.php')) ?>">Create one</a></p>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
