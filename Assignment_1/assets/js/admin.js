$(function () {
  if (typeof Chart === 'undefined' || !window.__adminChartData) return;

  const data = window.__adminChartData;
  const amberish = ['#f5a623', '#2dd4bf', '#8b8ff5', '#ef5b5b'];

  Chart.defaults.color = '#8b96a3';
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.borderColor = '#2a3644';

  // ---- Revenue by month (line) ----
  const revenueCanvas = document.getElementById('revenueChart');
  if (revenueCanvas && data.monthly && data.monthly.length) {
    new Chart(revenueCanvas, {
      type: 'line',
      data: {
        labels: data.monthly.map((m) => m.billing_month),
        datasets: [{
          label: 'Revenue (₹)',
          data: data.monthly.map((m) => Number(m.revenue)),
          borderColor: '#f5a623',
          backgroundColor: '#f5a62322',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#f5a623',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#2a3644' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // ---- Revenue by slab (doughnut) ----
  const slabCanvas = document.getElementById('slabChart');
  if (slabCanvas && data.slabs) {
    const s = data.slabs;
    new Chart(slabCanvas, {
      type: 'doughnut',
      data: {
        labels: ['0-50 units', '51-150 units', '151-250 units', '250+ units'],
        datasets: [{
          data: [Number(s.slab1) || 0, Number(s.slab2) || 0, Number(s.slab3) || 0, Number(s.slab4) || 0],
          backgroundColor: amberish,
          borderColor: '#1b2530',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } },
        },
      },
    });
  }
});
