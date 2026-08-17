# VoltCalc — Electricity Bill Calculator

A professional, responsive web app that calculates electricity bills using
progressive tariff slabs, persists every bill to **PostgreSQL** through a
pooled connection, and gives you a live dashboard of billing history.

## Tariff Slabs

| Units               | Rate / Unit |
|----------------------|-------------|
| First 50 units       | Rs. 3.50    |
| Next 100 (51–150)    | Rs. 4.00    |
| Next 100 (151–250)   | Rs. 5.20    |
| Above 250            | Rs. 6.50    |

Billing is **progressive** — e.g. for 180 units:
`50×3.50 + 100×4.00 + 30×5.20 = 831.00`

## Tech Stack

- **Backend:** Java Servlets (Jakarta EE 5.0), JSP
- **Database:** PostgreSQL via JDBC, pooled with **HikariCP** (no raw
  connection-per-request — connections are reused, health-checked, and
  capped, so the app stays reliably connected under real traffic)
- **Frontend:** Bootstrap 5.3, Bootstrap Icons, Google Fonts (Inter), jQuery
  — fully responsive, custom design system (see `css/style.css`)
- **Build:** Maven, packaged as a `.war`

## What "well connected" means here

- `AppLifecycleListener` opens the PostgreSQL connection pool once when the
  app starts (`@WebListener`) and closes it cleanly on shutdown — no pool
  leaks, no cold-start latency on the first request.
- `DBUtil` hands out pooled connections (`HikariDataSource`) instead of
  opening a new socket per request; a broken connection is health-checked
  and replaced automatically.
- Every page shares the same navbar/footer (`WEB-INF/includes/`) with
  active-link highlighting, so navigation between Calculate → Result →
  History always feels like one connected app, not three separate pages.
- The History page also runs a live aggregate query (count, total revenue,
  average bill, highest bill) so you can see the database is actually
  backing the UI, not just storing rows silently.

## Project Structure

```
ElectricityBillApp/
├── pom.xml
├── sql/
│   ├── 01_create_database.sql       # run first, as a superuser
│   └── 02_create_tables.sql         # run second, against the new DB
└── src/main/
    ├── java/com/billing/
    │   ├── DBUtil.java              # HikariCP pool wrapper (PostgreSQL)
    │   ├── AppLifecycleListener.java# starts/stops the pool with the app
    │   ├── BillCalculatorServlet.java
    │   └── BillHistoryServlet.java  # list + aggregate stats query
    └── webapp/
        ├── WEB-INF/
        │   ├── web.xml
        │   └── includes/
        │       ├── navbar.jsp       # shared, active-state nav
        │       └── footer.jsp
        ├── css/style.css            # design system (colors, cards, etc.)
        ├── js/validate.js           # jQuery client-side validation
        ├── index.jsp                # hero + calculator form
        ├── result.jsp               # bill summary + slab breakup
        ├── history.jsp              # dashboard stats + searchable table
        └── error.jsp
```

## Setup

### 1. Create the database

```bash
psql -U postgres -f sql/01_create_database.sql
psql -U postgres -d electricity_billing -f sql/02_create_tables.sql
```

The second script creates `bill_records` (with indexes and `CHECK`
constraints) and inserts four sample rows so the dashboard isn't empty on
first load.

### 2. Configure the DB connection

Edit `src/main/java/com/billing/DBUtil.java`:

```java
private static final String DB_HOST = "localhost";
private static final String DB_PORT = "5432";
private static final String DB_NAME = "electricity_billing";
private static final String DB_USER = "postgres";
private static final String DB_PASSWORD = "postgres";   // <-- your password
```

### 3. Build the WAR

```bash
mvn clean package
```

Produces `target/ElectricityBillApp.war`.

### 4. Deploy to Tomcat

- Copy `target/ElectricityBillApp.war` into Tomcat's `webapps/` folder, **or**
- Import as a Maven project in Eclipse/IntelliJ, add a Tomcat server, and
  deploy the module.

Maven pulls in the PostgreSQL driver and HikariCP automatically — no manual
jar wrangling needed.

### 5. Run

```
http://localhost:8080/ElectricityBillApp/
```

- **Calculate** — enter consumer name, consumer number, units consumed.
- **Result** — slab-wise breakup and total, saved to PostgreSQL immediately.
- **Bill History** — dashboard stat cards (total bills, revenue, average,
  highest bill) plus a live jQuery-filtered table of every bill.

## Notes

- Server-side validation lives in `BillCalculatorServlet`; jQuery
  (`js/validate.js`) adds instant feedback before the form is even submitted.
- The whole UI is responsive via Bootstrap's grid + custom breakpoints in
  `style.css` — resize the browser or open on a phone to see it adapt.
- If you're on an older Tomcat (9 or below, `javax.servlet.*` instead of
  `jakarta.servlet.*`), swap the imports in the Java classes, the `web.xml`
  namespace, and use `javax.servlet:javax.servlet-api` in `pom.xml`.
