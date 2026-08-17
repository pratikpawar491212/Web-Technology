<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<% pageContext.setAttribute("pageTitle", "calculate"); %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill Summary &mdash; VoltCalc</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body>

<%@ include file="/WEB-INF/includes/navbar.jsp" %>

<section class="hero" style="padding-bottom: 5rem;">
    <div class="container">
        <span class="hero-eyebrow"><i class="bi bi-check-circle"></i> Bill generated</span>
        <h1>Here's your bill summary</h1>
        <p class="lead">Reviewed, calculated, and saved to your billing history.</p>
    </div>
</section>

<div class="container content-shift pb-5">
    <div class="row g-4 justify-content-center">
        <div class="col-12 col-lg-8">

            <% if (request.getAttribute("dbError") != null) { %>
                <div class="alert alert-warning d-flex align-items-center gap-2" role="alert">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <div><%= request.getAttribute("dbError") %></div>
                </div>
            <% } %>

            <div class="card card-elevated mb-4">
                <div class="card-body p-4 p-md-5">

                    <div class="result-hero-amount mb-4">
                        <div class="amount-label">Total Bill Amount</div>
                        <div class="amount-value">Rs. <%= request.getAttribute("billAmount") %></div>
                    </div>

                    <div class="row g-3 mb-4">
                        <div class="col-12 col-sm-4">
                            <div class="text-muted small">Consumer Name</div>
                            <div class="fw-semibold"><%= request.getAttribute("consumerName") %></div>
                        </div>
                        <div class="col-12 col-sm-4">
                            <div class="text-muted small">Consumer Number</div>
                            <div class="fw-semibold"><%= request.getAttribute("consumerNumber") %></div>
                        </div>
                        <div class="col-12 col-sm-4">
                            <div class="text-muted small">Units Consumed</div>
                            <div class="fw-semibold"><%= request.getAttribute("units") %> kWh</div>
                        </div>
                    </div>

                    <div class="section-title mb-2"><i class="bi bi-list-check"></i> Slab-wise Breakup</div>
                    <div class="table-responsive">
                        <table class="table breakup-table mb-0">
                            <thead>
                                <tr>
                                    <th>Slab</th>
                                    <th>Rate</th>
                                    <th class="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <%= request.getAttribute("breakup") %>
                            </tbody>
                        </table>
                    </div>

                    <div class="d-flex flex-column flex-sm-row gap-2 mt-4">
                        <a href="index.jsp" class="btn btn-primary flex-fill">
                            <i class="bi bi-plus-lg me-1"></i> Calculate Another Bill
                        </a>
                        <a href="BillHistory" class="btn btn-outline-light-brand flex-fill">
                            <i class="bi bi-clock-history me-1"></i> View Bill History
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<%@ include file="/WEB-INF/includes/footer.jsp" %>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
