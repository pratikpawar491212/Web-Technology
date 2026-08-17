<nav class="navbar navbar-expand-md navbar-dark sticky-top app-navbar">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="${pageContext.request.contextPath}/index.jsp">
            <span class="brand-icon"><i class="bi bi-lightning-charge-fill"></i></span>
            <span class="brand-text">VoltCalc</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#appNav"
                aria-controls="appNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="appNav">
            <ul class="navbar-nav ms-auto align-items-md-center gap-md-1">
                <li class="nav-item">
                    <a class="nav-link ${pageTitle == 'calculate' ? 'active' : ''}"
                       href="${pageContext.request.contextPath}/index.jsp">
                        <i class="bi bi-calculator me-1"></i>Calculate
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${pageTitle == 'history' ? 'active' : ''}"
                       href="${pageContext.request.contextPath}/BillHistory">
                        <i class="bi bi-clock-history me-1"></i>Bill History
                    </a>
                </li>
                <li class="nav-item ms-md-2">
                    <a class="btn btn-nav-cta" href="${pageContext.request.contextPath}/index.jsp#billForm">
                        New Bill <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
