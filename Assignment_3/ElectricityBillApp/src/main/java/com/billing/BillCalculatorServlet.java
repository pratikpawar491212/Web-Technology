package com.billing;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Calculates an electricity bill using the following slab structure:
 *
 *   0   - 50  units  : Rs. 3.50 / unit
 *   51  - 150 units  : Rs. 4.00 / unit
 *   151 - 250 units  : Rs. 5.20 / unit
 *   251+ units        : Rs. 6.50 / unit
 *
 * Each slab is billed only on the units that fall inside it (progressive slabs).
 */
@WebServlet("/CalculateBill")
public class BillCalculatorServlet extends HttpServlet {

    private static final double SLAB1_LIMIT = 50;
    private static final double SLAB2_LIMIT = 150;   // 50 + 100
    private static final double SLAB3_LIMIT = 250;   // 150 + 100

    private static final double SLAB1_RATE = 3.50;
    private static final double SLAB2_RATE = 4.00;
    private static final double SLAB3_RATE = 5.20;
    private static final double SLAB4_RATE = 6.50;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        String consumerName = trim(request.getParameter("consumerName"));
        String consumerNumber = trim(request.getParameter("consumerNumber"));
        String unitsStr = trim(request.getParameter("units"));

        double units;
        try {
            units = Double.parseDouble(unitsStr);
            if (units < 0 || consumerName.isEmpty() || consumerNumber.isEmpty()) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException e) {
            request.setAttribute("errorMessage",
                    "Please fill in all fields correctly. Units must be a positive number.");
            request.getRequestDispatcher("index.jsp").forward(request, response);
            return;
        }

        double billAmount = calculateBill(units);
        String breakup = buildBreakupHtml(units);

        try {
            saveToDatabase(consumerName, consumerNumber, units, billAmount);
        } catch (SQLException e) {
            // Don't fail the whole request just because the DB write failed;
            // still show the user their bill, but flag the storage issue.
            request.setAttribute("dbError",
                    "Bill calculated successfully, but could not be saved to the database: "
                            + e.getMessage());
        }

        request.setAttribute("consumerName", consumerName);
        request.setAttribute("consumerNumber", consumerNumber);
        request.setAttribute("units", units);
        request.setAttribute("billAmount", billAmount);
        request.setAttribute("breakup", breakup);

        request.getRequestDispatcher("result.jsp").forward(request, response);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendRedirect("index.jsp");
    }

    /** Progressive slab calculation. */
    private double calculateBill(double units) {
        double bill;

        if (units <= SLAB1_LIMIT) {
            bill = units * SLAB1_RATE;
        } else if (units <= SLAB2_LIMIT) {
            bill = SLAB1_LIMIT * SLAB1_RATE
                    + (units - SLAB1_LIMIT) * SLAB2_RATE;
        } else if (units <= SLAB3_LIMIT) {
            bill = SLAB1_LIMIT * SLAB1_RATE
                    + (SLAB2_LIMIT - SLAB1_LIMIT) * SLAB2_RATE
                    + (units - SLAB2_LIMIT) * SLAB3_RATE;
        } else {
            bill = SLAB1_LIMIT * SLAB1_RATE
                    + (SLAB2_LIMIT - SLAB1_LIMIT) * SLAB2_RATE
                    + (SLAB3_LIMIT - SLAB2_LIMIT) * SLAB3_RATE
                    + (units - SLAB3_LIMIT) * SLAB4_RATE;
        }

        return Math.round(bill * 100.0) / 100.0;
    }

    /** Human readable slab-wise breakup shown on the result page. */
    private String buildBreakupHtml(double units) {
        StringBuilder sb = new StringBuilder();
        double remaining = units;

        double slab1Units = Math.min(remaining, SLAB1_LIMIT);
        if (slab1Units > 0) {
            sb.append(row("First", slab1Units, SLAB1_RATE, slab1Units * SLAB1_RATE));
            remaining -= slab1Units;
        }

        double slab2Units = Math.min(remaining, SLAB2_LIMIT - SLAB1_LIMIT);
        if (slab2Units > 0) {
            sb.append(row("Next", slab2Units, SLAB2_RATE, slab2Units * SLAB2_RATE));
            remaining -= slab2Units;
        }

        double slab3Units = Math.min(remaining, SLAB3_LIMIT - SLAB2_LIMIT);
        if (slab3Units > 0) {
            sb.append(row("Next", slab3Units, SLAB3_RATE, slab3Units * SLAB3_RATE));
            remaining -= slab3Units;
        }

        if (remaining > 0) {
            sb.append(row("Above 250", remaining, SLAB4_RATE, remaining * SLAB4_RATE));
        }

        return sb.toString();
    }

    private String row(String label, double slabUnits, double rate, double amount) {
        return String.format(
                "<tr><td>%s %.0f units</td><td>Rs. %.2f / unit</td><td>Rs. %.2f</td></tr>",
                label, slabUnits, rate, amount);
    }

    private void saveToDatabase(String name, String number, double units, double amount)
            throws SQLException {
        String sql = "INSERT INTO bill_records "
                + "(consumer_name, consumer_number, units_consumed, bill_amount) "
                + "VALUES (?, ?, ?, ?)";

        try (Connection conn = DBUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setString(2, number);
            ps.setDouble(3, units);
            ps.setDouble(4, amount);
            ps.executeUpdate();
        }
    }

    private String trim(String s) {
        return s == null ? "" : s.trim();
    }
}
