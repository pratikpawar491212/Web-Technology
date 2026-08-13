$(function () {
  const $search = $('#customerSearch');
  const $rows = $('#customerTable tbody tr');

  $search.on('input', function () {
    const q = $(this).val().trim().toLowerCase();
    $rows.each(function () {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.indexOf(q) !== -1);
    });
  });
});
