  <footer class="site-footer">
    <span>VoltMeter · slab rates for illustration only</span>
    <span>Built with PHP, MySQL, Bootstrap &amp; jQuery</span>
  </footer>
</div><!-- /.site-wrap -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/js/bootstrap.bundle.min.js"></script>
<?php if (!empty($extraScripts)): ?>
  <?php foreach ($extraScripts as $src): ?>
    <script src="<?= h($src) ?>"></script>
  <?php endforeach; ?>
<?php endif; ?>
</body>
</html>
