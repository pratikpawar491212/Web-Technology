<?php
/**
 * includes/billing.php
 * Slab-based electricity bill calculation, shared by every page that
 * needs it (calculate.php, and anywhere reports recompute from raw units).
 *
 *   0   - 50   units : Rs 3.50 / unit
 *   51  - 150  units : Rs 4.00 / unit
 *   151 - 250  units : Rs 5.20 / unit
 *   251+       units : Rs 6.50 / unit
 */

const SLAB_1_LIMIT = 50;
const SLAB_2_LIMIT = 150;
const SLAB_3_LIMIT = 250;

const RATE_1 = 3.50;
const RATE_2 = 4.00;
const RATE_3 = 5.20;
const RATE_4 = 6.50;

/**
 * @return array{
 *   units: float, total: float,
 *   slab1_units: float, slab1_cost: float,
 *   slab2_units: float, slab2_cost: float,
 *   slab3_units: float, slab3_cost: float,
 *   slab4_units: float, slab4_cost: float,
 *   breakdown: array
 * }
 */
function calculate_electricity_bill(float $units): array
{
    $units = max(0, $units);
    $remaining = $units;
    $total = 0.0;

    $slab1Units = min($remaining, SLAB_1_LIMIT);
    $slab1Cost = $slab1Units * RATE_1;
    $remaining -= $slab1Units;
    $total += $slab1Cost;

    $slab2Units = $remaining > 0 ? min($remaining, SLAB_2_LIMIT - SLAB_1_LIMIT) : 0;
    $slab2Cost = $slab2Units * RATE_2;
    $remaining -= $slab2Units;
    $total += $slab2Cost;

    $slab3Units = $remaining > 0 ? min($remaining, SLAB_3_LIMIT - SLAB_2_LIMIT) : 0;
    $slab3Cost = $slab3Units * RATE_3;
    $remaining -= $slab3Units;
    $total += $slab3Cost;

    $slab4Units = $remaining > 0 ? $remaining : 0;
    $slab4Cost = $slab4Units * RATE_4;
    $total += $slab4Cost;

    $breakdown = [];
    if ($slab1Units > 0) $breakdown[] = ['label' => 'First 50 units', 'units' => round($slab1Units, 2), 'rate' => RATE_1, 'cost' => round($slab1Cost, 2)];
    if ($slab2Units > 0) $breakdown[] = ['label' => 'Next 100 units (51-150)', 'units' => round($slab2Units, 2), 'rate' => RATE_2, 'cost' => round($slab2Cost, 2)];
    if ($slab3Units > 0) $breakdown[] = ['label' => 'Next 100 units (151-250)', 'units' => round($slab3Units, 2), 'rate' => RATE_3, 'cost' => round($slab3Cost, 2)];
    if ($slab4Units > 0) $breakdown[] = ['label' => 'Above 250 units', 'units' => round($slab4Units, 2), 'rate' => RATE_4, 'cost' => round($slab4Cost, 2)];

    return [
        'units' => round($units, 2),
        'total' => round($total, 2),
        'slab1_units' => round($slab1Units, 2), 'slab1_cost' => round($slab1Cost, 2),
        'slab2_units' => round($slab2Units, 2), 'slab2_cost' => round($slab2Cost, 2),
        'slab3_units' => round($slab3Units, 2), 'slab3_cost' => round($slab3Cost, 2),
        'slab4_units' => round($slab4Units, 2), 'slab4_cost' => round($slab4Cost, 2),
        'breakdown' => $breakdown,
    ];
}
