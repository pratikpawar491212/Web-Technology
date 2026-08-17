package com.billing;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Fetches past bills from PostgreSQL for the History / Dashboard page,
 * along with aggregate stats (total bills, total revenue, average bill).
 */
@WebServlet("/BillHistory")
public class BillHistoryServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        List<BillRecord> records = new ArrayList<>();
        Stats stats = new Stats(0, 0, 0, 0);

        String listSql = "SELECT consumer_name, consumer_number, units_consumed, "
                + "bill_amount, billing_date FROM bill_records ORDER BY billing_date DESC";

        String statsSql = "SELECT COUNT(*) AS cnt, "
                + "COALESCE(SUM(bill_amount), 0) AS total_revenue, "
                + "COALESCE(AVG(bill_amount), 0) AS avg_bill, "
                + "COALESCE(MAX(bill_amount), 0) AS highest_bill "
                + "FROM bill_records";

        try (Connection conn = DBUtil.getConnection()) {

            try (PreparedStatement ps = conn.prepareStatement(listSql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    records.add(new BillRecord(
                            rs.getString("consumer_name"),
                            rs.getString("consumer_number"),
                            rs.getDouble("units_consumed"),
                            rs.getDouble("bill_amount"),
                            rs.getTimestamp("billing_date")
                    ));
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(statsSql);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    stats = new Stats(
                            rs.getInt("cnt"),
                            rs.getDouble("total_revenue"),
                            rs.getDouble("avg_bill"),
                            rs.getDouble("highest_bill")
                    );
                }
            }

        } catch (SQLException e) {
            request.setAttribute("dbError", "Could not load bill history: " + e.getMessage());
        }

        request.setAttribute("records", records);
        request.setAttribute("stats", stats);
        request.getRequestDispatcher("history.jsp").forward(request, response);
    }

    /** Read-only row for history.jsp */
    public static class BillRecord {
        private final String consumerName;
        private final String consumerNumber;
        private final double units;
        private final double amount;
        private final java.sql.Timestamp date;

        public BillRecord(String consumerName, String consumerNumber, double units,
                           double amount, java.sql.Timestamp date) {
            this.consumerName = consumerName;
            this.consumerNumber = consumerNumber;
            this.units = units;
            this.amount = amount;
            this.date = date;
        }

        public String getConsumerName() { return consumerName; }
        public String getConsumerNumber() { return consumerNumber; }
        public double getUnits() { return units; }
        public double getAmount() { return amount; }
        public java.sql.Timestamp getDate() { return date; }
    }

    /** Aggregate dashboard stats for history.jsp */
    public static class Stats {
        private final int totalBills;
        private final double totalRevenue;
        private final double avgBill;
        private final double highestBill;

        public Stats(int totalBills, double totalRevenue, double avgBill, double highestBill) {
            this.totalBills = totalBills;
            this.totalRevenue = totalRevenue;
            this.avgBill = avgBill;
            this.highestBill = highestBill;
        }

        public int getTotalBills() { return totalBills; }
        public double getTotalRevenue() { return totalRevenue; }
        public double getAvgBill() { return avgBill; }
        public double getHighestBill() { return highestBill; }
    }
}
