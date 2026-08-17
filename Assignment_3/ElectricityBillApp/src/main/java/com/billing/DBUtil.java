package com.billing;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Central point of database connectivity.
 *
 * Uses a HikariCP connection pool rather than opening a fresh JDBC
 * connection on every request. This is what keeps the app "well connected"
 * to PostgreSQL under real traffic: connections are reused, health-checked,
 * capped at a sane maximum, and cleanly released back to the pool.
 *
 * Update the four constants below to match your local PostgreSQL setup.
 */
public final class DBUtil {

    private static final String DB_HOST = "localhost";
    private static final String DB_PORT = "5432";
    private static final String DB_NAME = "electricity_billing";
    private static final String DB_USER = "postgres";
    private static final String DB_PASSWORD = "4912"; // change to your Postgres password

    private static volatile HikariDataSource dataSource;

    private DBUtil() {
    }

    /** Called once at application startup by {@link AppLifecycleListener}. */
    public static void initPool() {
        if (dataSource != null) {
            return;
        }
        synchronized (DBUtil.class) {
            if (dataSource == null) {
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl("jdbc:postgresql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME);
                config.setUsername(DB_USER);
                config.setPassword(DB_PASSWORD);
                config.setDriverClassName("org.postgresql.Driver");

                config.setPoolName("ElectricityBillPool");
                config.setMaximumPoolSize(10);
                config.setMinimumIdle(2);
                config.setConnectionTimeout(10_000);   // 10s
                config.setIdleTimeout(600_000);         // 10 min
                config.setMaxLifetime(1_800_000);       // 30 min
                config.setConnectionTestQuery("SELECT 1");

                dataSource = new HikariDataSource(config);
            }
        }
    }

    public static Connection getConnection() throws SQLException {
        if (dataSource == null) {
            initPool();
        }
        return dataSource.getConnection();
    }

    /** Called once at application shutdown by {@link AppLifecycleListener}. */
    public static void closePool() {
        if (dataSource != null) {
            dataSource.close();
            dataSource = null;
        }
    }

    public static boolean isPoolHealthy() {
        return dataSource != null && !dataSource.isClosed();
    }
}
