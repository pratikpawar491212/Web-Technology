<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List, com.billing.BillHistoryServlet.BillRecord, com.billing.BillHistoryServlet.Stats" %>
<% pageContext.setAttribute("pageTitle", "history"); %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill History &mdash; VoltCalc</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body>

<%@ include file="/WEB-INF/includes/navbar.jsp" %>

<section class="hero">
    <div class="container">
        <span class="hero-eyebrow"><i class="bi bi-bar-chart"></i> Live from PostgreSQL</span>
        <h1>Bill History &amp; Overview</h1>
        <p class="lead">Every bill VoltCalc has ever calculated, with running totals pulled straight from the database.</p>
    </div>
</section>

<div class="container content-shift pb-5">

    <% if (request.getAttribute("dbError") != null) { %>
        <div class="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div><%= request.getAttribute("dbError") %></div>
        </div>
    <% }
       Stats stats = (Stats) request.getAttribute("stats");
       if (stats == null) stats = new Stats(0, 0, 0, 0);
    %>

    <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="bi bi-receipt"></i></div>
                <div class="stat-value"><%= stats.getTotalBills() %></div>
                <div class="stat-label">Total Bills</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-card">
                <div class="stat-icon green"><i class="bi bi-cash-stack"></i></div>
                <div class="stat-value">Rs. <%= String.format("%.0f", stats.getTotalRevenue()) %></div>
                <div class="stat-label">Total Revenue</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-card">
                <div class="stat-icon amber"><i class="bi bi-graph-up"></i></div>
                <div class="stat-value">Rs. <%= String.format("%.2f", stats.getAvgBill()) %></div>
                <div class="stat-label">Average Bill</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-card">
                <div class="stat-icon cyan"><i class="bi bi-trophy"></i></div>
                <div class="stat-value">Rs. <%= String.format("%.0f", stats.getHighestBill()) %></div>
                <div class="stat-label">Highest Bill</div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-body p-4">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div class="section-title mb-0"><i class="bi bi-table"></i> All Records</div>
                <div class="input-icon-group" style="max-width: 280px; width: 100%;">
                    <i class="bi bi-search icon"></i>
                    <input type="text" id="searchBox" class="form-control"
                           placeholder="Search by name or consumer number...">
                </div>
            </div>

            <%
                List<BillRecord> records = (List<BillRecord>) request.getAttribute("records");
            %>

            <% if (records != null && !records.isEmpty()) { %>
                <div class="table-responsive">
                    <table class="table table-hover align-middle" id="historyTable">
                        <thead>
                            <tr>
                                <th>Consumer Name</th>
                                <th>Consumer Number</th>
                                <th>Units</th>
                                <th>Bill Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% for (BillRecord r : records) { %>
                            <tr>
                                <td class="fw-semibold"><%= r.getConsumerName() %></td>
                                <td><span class="badge text-bg-light border"><%= r.getConsumerNumber() %></span></td>
                                <td><%= r.getUnits() %> kWh</td>
                                <td><span class="amount-chip">Rs. <%= String.format("%.2f", r.getAmount()) %></span></td>
                                <td class="text-muted small"><%= r.getDate() %></td>
                            </tr>
                            <% } %>
                        </tbody>
                    </table>
                </div>
            <% } else { %>
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p class="mb-1 fw-semibold">No bill records yet</p>
                    <p class="small mb-3">Calculate your first bill to see it appear here.</p>
                    <a href="index.jsp" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-lg me-1"></i> Calculate a Bill
                    </a>
                </div>
            <% } %>
        </div>
    </div>
</div>

<%@ include file="/WEB-INF/includes/footer.jsp" %>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    $(function () {
        $("#searchBox").on("keyup", function () {
            const term = $(this).val().toLowerCase();
            $("#historyTable tbody tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(term) > -1);
            });
        });
    });
</script>
</body>
</html>
