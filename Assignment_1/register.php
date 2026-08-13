<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

if (is_logged_in()) {
    header('Location: ' . base_url(is_admin() ? 'admin/dashboard.php' : 'dashboard.php'));
    exit;
}

$errors = [];
$old = ['name' => '', 'email' => '', 'meter_number' => '', 'phone' => '', 'address' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf($_POST['csrf_token'] ?? null);

    $old['name']         = trim($_POST['name'] ?? '');
    $old['email']        = trim($_POST['email'] ?? '');
    $old['meter_number'] = trim($_POST['meter_number'] ?? '');
    $old['phone']        = trim($_POST['phone'] ?? '');
    $old['address']      = trim($_POST['address'] ?? '');
    $password             = $_POST['password'] ?? '';
    $confirmPassword      = $_POST['confirm_password'] ?? '';

    if ($old['name'] === '') $errors[] = 'Name is required.';
    if (!filter_var($old['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid email address.';
    if ($old['meter_number'] === '') $errors[] = 'Meter number is required.';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
    if ($password !== $confirmPassword) $errors[] = 'Passwords do not match.';

    if (!$errors) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR meter_number = ?');
        $stmt->execute([$old['email'], $old['meter_number']]);
        if ($stmt->fetch()) {
            $errors[] = 'An account with that email or meter number already exists.';
        }
    }

    if (!$errors) {
        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password, meter_number, phone, address, role)
             VALUES (?, ?, ?, ?, ?, ?, "customer")'
        );
        $stmt->execute([
            $old['name'],
            $old['email'],
            password_hash($password, PASSWORD_DEFAULT),
            $old['meter_number'],
            $old['phone'] ?: null,
            $old['address'] ?: null,
        ]);

        $newUser = [
            'id' => $pdo->lastInsertId(),
            'name' => $old['name'],
            'email' => $old['email'],
            'meter_number' => $old['meter_number'],
            'role' => 'customer',
        ];
        login_user($newUser);
        header('Location: ' . base_url('dashboard.php'));
        exit;
    }
}

$pageTitle = 'Create account';
require_once __DIR__ . '/includes/header.php';
?>

<div class="row justify-content-center">
  <div class="col-12 col-md-7 col-lg-6">
    <div class="panel">
      <div class="panel-title"><span class="dot"></span>Create your account</div>

      <?php if ($errors): ?>
        <div class="alert-box">
          <ul class="mb-0">
            <?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?>
          </ul>
        </div>
      <?php endif; ?>

      <form method="post" novalidate>
        <input type="hidden" name="csrf_token" value="<?= h(csrf_token()) ?>">

        <div class="mb-3">
          <label class="form-label" for="name">Full name</label>
          <input type="text" id="name" name="name" class="text-input" value="<?= h($old['name']) ?>" required>
        </div>

        <div class="mb-3">
          <label class="form-label" for="email">Email</label>
          <input type="email" id="email" name="email" class="text-input" value="<?= h($old['email']) ?>" required>
        </div>

        <div class="mb-3">
          <label class="form-label" for="meter_number">Meter number</label>
          <input type="text" id="meter_number" name="meter_number" class="text-input" value="<?= h($old['meter_number']) ?>" placeholder="e.g. MTR-00231" required>
        </div>

        <div class="row">
          <div class="col-12 col-sm-6 mb-3">
            <label class="form-label" for="phone">Phone (optional)</label>
            <input type="text" id="phone" name="phone" class="text-input" value="<?= h($old['phone']) ?>">
          </div>
          <div class="col-12 col-sm-6 mb-3">
            <label class="form-label" for="address">Address (optional)</label>
            <input type="text" id="address" name="address" class="text-input" value="<?= h($old['address']) ?>">
          </div>
        </div>

        <div class="row">
          <div class="col-12 col-sm-6 mb-3">
            <label class="form-label" for="password">Password</label>
            <input type="password" id="password" name="password" class="text-input" required minlength="6">
          </div>
          <div class="col-12 col-sm-6 mb-3">
            <label class="form-label" for="confirm_password">Confirm password</label>
            <input type="password" id="confirm_password" name="confirm_password" class="text-input" required minlength="6">
          </div>
        </div>

        <button type="submit" class="btn-calc">Create account</button>
      </form>

      <p class="form-footnote">Already have an account? <a href="<?= h(base_url('login.php')) ?>">Log in</a></p>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
