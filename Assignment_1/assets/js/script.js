$(function () {
  const $form = $('#billForm');
  const $unitsInput = $('#units');
  const $monthInput = $('#billing_month');
  const $error = $('#errorMsg');
  const $resultPanel = $('#resultPanel');
  const $emptyState = $('#emptyState');
  const $meterDigits = $('#meterDigits');
  const $meterSub = $('#meterSub');
  const $breakdownBody = $('#breakdownBody');
  const $calcBtn = $('#calcBtn');

  const slabColors = ['#f5a623', '#2dd4bf', '#8b8ff5', '#ef5b5b'];

  function formatRupees(amount) {
    return Number(amount).toFixed(2);
  }

  function renderMeterDigits(amount) {
    const text = '\u20B9' + formatRupees(amount);
    $meterDigits.empty();
    text.split('').forEach((char) => {
      const isSymbol = !/[0-9]/.test(char);
      const $tile = $('<div>').addClass('meter-digit');
      if (isSymbol) $tile.addClass('is-symbol');
      $tile.append($('<span>').addClass('digit-inner').text(char));
      $meterDigits.append($tile);
    });
  }

  function renderBreakdown(breakdown, totalUnits) {
    $breakdownBody.empty();
    breakdown.forEach((slab, i) => {
      const pct = totalUnits > 0 ? ((slab.units / totalUnits) * 100).toFixed(1) : 0;
      const color = slabColors[i % slabColors.length];

      const $row = $('<tr>');
      $row.append($('<td>').html(
        `${slab.label}<div class="slab-bar-track"><div class="slab-bar-fill" style="background:${color}"></div></div>`
      ));
      $row.append($('<td>').addClass('num').text(slab.units));
      $row.append($('<td>').addClass('num').text('\u20B9' + formatRupees(slab.rate)));
      $row.append($('<td>').addClass('num').text('\u20B9' + formatRupees(slab.cost)));
      $breakdownBody.append($row);

      setTimeout(() => { $row.find('.slab-bar-fill').css('width', pct + '%'); }, 30 + i * 80);
    });
  }

  function showError(message) {
    $error.text(message).show();
  }

  function clearError() {
    $error.hide().text('');
  }

  $form.on('submit', function (e) {
    e.preventDefault();
    clearError();

    const units = $unitsInput.val().trim();
    const month = $monthInput.val();

    if (units === '') { showError('Please enter the number of units consumed.'); return; }
    if (isNaN(units) || Number(units) < 0) { showError('Enter a valid, non-negative number of units.'); return; }
    if (!month) { showError('Please choose a billing month.'); return; }

    $calcBtn.prop('disabled', true).text('Calculating…');

    $.ajax({
      url: 'calculate.php',
      method: 'POST',
      dataType: 'json',
      data: $form.serialize(),
      success: function (res) {
        if (!res.success) {
          showError(res.message || 'Something went wrong. Please try again.');
          return;
        }
        const data = res.data;
        $emptyState.addClass('d-none');
        $resultPanel.removeClass('d-none');

        renderMeterDigits(data.total);
        $meterSub.text(data.units + ' units · ' + data.billing_month + ' · saved to your account');
        renderBreakdown(data.breakdown, data.units);
      },
      error: function (xhr) {
        const msg = xhr.status === 401
          ? 'Your session has expired. Please log in again.'
          : 'Could not reach the server. Please try again.';
        showError(msg);
      },
      complete: function () {
        $calcBtn.prop('disabled', false).text('Calculate & save bill');
      },
    });
  });

  $unitsInput.on('input', clearError);
});
