package com.billing;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Boots the PostgreSQL connection pool when the app starts, and shuts it
 * down cleanly when the app stops - so every request from the very first
 * one is served through a warm, healthy connection pool.
 */
@WebListener
public class AppLifecycleListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        DBUtil.initPool();
        System.out.println("[ElectricityBillApp] Started - PostgreSQL connection pool initialized.");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        DBUtil.closePool();
        System.out.println("[ElectricityBillApp] Stopped - PostgreSQL connection pool closed.");
    }
}
