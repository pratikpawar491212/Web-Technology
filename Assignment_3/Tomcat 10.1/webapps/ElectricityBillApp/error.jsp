<%@ page contentType="text/html;charset=UTF-8" language="java" isErrorPage="true" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Something went wrong &mdash; VoltCalc</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body class="d-flex align-items-center justify-content-center vh-100" style="background: var(--brand-gradient);">
    <div class="card card-elevated text-center p-5" style="max-width: 26rem;">
        <i class="bi bi-exclamation-octagon text-danger" style="font-size: 2.75rem;"></i>
        <h2 class="mt-3">Something went wrong</h2>
        <p class="text-muted">We hit a snag processing your request. Please try again.</p>
        <a href="index.jsp" class="btn btn-primary mt-2">
            <i class="bi bi-house me-1"></i> Back to VoltCalc
        </a>
    </div>
</body>
</html>
