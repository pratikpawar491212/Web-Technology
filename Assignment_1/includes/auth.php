<?php
/**
 * includes/auth.php
 * Session-based authentication helpers. Include this (it starts the
 * session) before any output on pages that need to know who's logged in.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/** Returns the logged-in user's session data, or null if not logged in. */
function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function is_logged_in(): bool
{
    return isset($_SESSION['user']);
}

function is_admin(): bool
{
    return is_logged_in() && $_SESSION['user']['role'] === 'admin';
}

/** Redirects to login.php unless a customer/admin is logged in. */
function require_login(): void
{
    if (!is_logged_in()) {
        header('Location: ' . base_url('login.php'));
        exit;
    }
}

/** Redirects unless the logged-in user is an admin. */
function require_admin(): void
{
    require_login();
    if (!is_admin()) {
        header('Location: ' . base_url('dashboard.php'));
        exit;
    }
}

/** Stores the given DB user row (minus password) in the session. */
function login_user(array $user): void
{
    session_regenerate_id(true);
    unset($user['password']);
    $_SESSION['user'] = $user;
}

function logout_user(): void
{
    $_SESSION = [];
    session_destroy();
}

/**
 * Builds a path relative to the app root so links work whether the app
 * lives at http://localhost/ or http://localhost/electricity-bill/.
 * $path should NOT start with a slash, e.g. base_url('admin/dashboard.php').
 */
function base_url(string $path = ''): string
{
    $root = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    // When called from inside /admin/, strip that segment so links resolve
    // back to the app root instead of /admin/admin/...
    if (basename($root) === 'admin') {
        $root = rtrim(dirname($root), '/');
    }
    return $root . '/' . ltrim($path, '/');
}

/** Generates (or reuses) a CSRF token for the current session. */
function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/** Verifies a submitted CSRF token, dies with 400 if invalid. */
function verify_csrf(?string $token): void
{
    if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(400);
        die('Invalid or expired form submission. Please go back and try again.');
    }
}

function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}
