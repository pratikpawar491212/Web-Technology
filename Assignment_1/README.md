# VoltMeter — Electricity Bill Calculator

A full PHP + MySQL web app: customers register, log in, calculate bills
(auto-saved to their account), view bill history, and print any bill.
Admins get a reports dashboard with charts and a customer directory.

## Slab rates
| Units          | Rate       |
|----------------|------------|
| 0 – 50         | ₹3.50/unit |
| 51 – 150       | ₹4.00/unit |
| 151 – 250      | ₹5.20/unit |
| 250+           | ₹6.50/unit |

## Project structure
```
electricity-bill/
├── config/db.php          ← DB credentials (edit this)
├── database/schema.sql    ← import this into MySQL
├── includes/              ← shared PHP (auth, header/footer, billing logic)
├── setup/create_admin.php ← run once, then delete
├── assets/css, assets/js  ← styling + jQuery
├── admin/                 ← admin-only pages
├── index.php               (public landing page)
├── register.php / login.php / logout.php
├── dashboard.php           (customer: calculate + save a bill)
├── history.php             (customer: full bill history)
├── bill.php                (single printable bill)
└── calculate.php           (AJAX endpoint used by dashboard.php)
```

## Setup (XAMPP)

**1. Start MySQL and Apache** in the XAMPP Control Panel.

**2. Create the database.**
Open `http://localhost/phpmyadmin`, click **Import**, choose
`database/schema.sql`, and click **Go**.
(Or from a terminal: `mysql -u root -p < database/schema.sql`.)

**3. Check your DB credentials.**
Open `config/db.php`. XAMPP's defaults (`root` / empty password) are
already set — only change this if your MySQL setup differs.

**4. Copy the project into `htdocs`.**
```
C:\xampp\htdocs\electricity-bill\
```

**5. Create the admin account.**
Visit:
```
http://localhost/electricity-bill/setup/create_admin.php
```
This creates one admin login:
- Email: `admin@voltmeter.test`
- Password: `Admin@123`

**Then delete `setup/create_admin.php`** (or move it outside `htdocs`) —
leaving it live would let anyone recreate an admin account.

**6. Use the site.**
```
http://localhost/electricity-bill/
```
- New customers click **Sign up** to register (name, email, meter number, password).
- After logging in, customers land on **Calculate**, where every calculation is saved to their account.
- **Bill history** lists all saved bills, filterable by month.
- Any bill can be opened and printed from its **View** link.
- Log in as the admin account above to see **Reports** (revenue charts, top consumers) and **Customers** (every registered account and their bills).

## Notes
- Passwords are hashed with PHP's `password_hash()` (bcrypt) — never stored in plain text.
- All database queries use prepared statements (PDO).
- Forms are protected with CSRF tokens.
- A customer can only view their own bills; admins can view all of them.
