<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<% pageContext.setAttribute("pageTitle", "calculate"); %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VoltCalc &mdash; Electricity Bill Calculator</title>

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
        <span class="hero-eyebrow"><i class="bi bi-shield-check"></i> Accurate slab-wise billing</span>
        <h1>Calculate your electricity bill in seconds</h1>
        <p class="lead">Enter your consumer details and units consumed &mdash; VoltCalc applies the correct
            tariff slab automatically and stores every bill securely in PostgreSQL.</p>
    </div>
</section>

<div class="container content-shift">
    <div class="row g-4 justify-content-center">

        <div class="col-12 col-lg-7">
            <div class="card card-elevated">
                <div class="card-body p-4 p-md-5">

                    <div class="section-title mb-1"><i class="bi bi-calculator"></i> Bill Details</div>
                    <p class="text-muted small mb-4">All fields are required. Units accept decimals (e.g. 182.5).</p>

                    <% if (request.getAttribute("errorMessage") != null) { %>
                        <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <div><%= request.getAttribute("errorMessage") %></div>
                        </div>
                    <% } %>

                    <form id="billForm" action="CalculateBill" method="post" novalidate>
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <label for="consumerName" class="form-label">Consumer Name</label>
                                <div class="input-icon-group">
                                    <i class="bi bi-person icon"></i>
                                    <input type="text" class="form-control" id="consumerName"
                                           name="consumerName" placeholder="Ramesh Kumar" required>
                                </div>
                                <div class="invalid-feedback">Please enter the consumer name.</div>
                            </div>

                            <div class="col-12 col-md-6">
                                <label for="consumerNumber" class="form-label">Consumer Number</label>
                                <div class="input-icon-group">
                                    <i class="bi bi-hash icon"></i>
                                    <input type="text" class="form-control" id="consumerNumber"
                                           name="consumerNumber" placeholder="CN-1001" required>
                                </div>
                                <div class="invalid-feedback">Please enter the consumer number.</div>
                            </div>

                            <div class="col-12">
                                <label for="units" class="form-label">Units Consumed (kWh)</label>
                                <div class="input-icon-group">
                                    <i class="bi bi-lightning-charge icon"></i>
                                    <input type="number" step="0.01" min="0" class="form-control" id="units"
                                           name="units" placeholder="e.g. 180" required>
                                </div>
                                <div class="invalid-feedback">Please enter a valid, non-negative number of units.</div>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 mt-4">
                            <i class="bi bi-lightning-charge-fill me-1"></i> Calculate Bill
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-12 col-lg-5">
            <div class="card h-100">
                <div class="card-body p-4">
                    <div class="section-title mb-3"><i class="bi bi-layers"></i> Tariff Slabs</div>

                    <div class="table-responsive">
                        <table class="table tariff-table mb-3">
                            <thead>
                                <tr><th>Units</th><th class="text-end">Rate</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>First 50 units</td><td class="text-end"><span class="tariff-badge">Rs. 3.50</span></td></tr>
                                <tr><td>Next 100 units (51&ndash;150)</td><td class="text-end"><span class="tariff-badge">Rs. 4.00</span></td></tr>
                                <tr><td>Next 100 units (151&ndash;250)</td><td class="text-end"><span class="tariff-badge">Rs. 5.20</span></td></tr>
                                <tr><td>Above 250 units</td><td class="text-end"><span class="tariff-badge">Rs. 6.50</span></td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="d-flex align-items-start gap-2 text-muted small">
                        <i class="bi bi-info-circle mt-1"></i>
                        <span>Billing is progressive &mdash; each slab is charged only on the units that
                            fall within it, not your entire usage.</span>
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-body p-4">
                    <div class="section-title mb-3"><i class="bi bi-check2-circle"></i> Why VoltCalc</div>
                    <ul class="list-unstyled small mb-0 d-flex flex-column gap-2">
                        <li><i class="bi bi-check-lg text-success me-1"></i> Instant, accurate slab-wise calculation</li>
                        <li><i class="bi bi-check-lg text-success me-1"></i> Every bill saved to PostgreSQL</li>
                        <li><i class="bi bi-check-lg text-success me-1"></i> Full bill history &amp; search</li>
                    </ul>
                </div>
            </div>
        </div>

    </div>
</div>

<%@ include file="/WEB-INF/includes/footer.jsp" %>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/validate.js"></script>
</body>
</html>
