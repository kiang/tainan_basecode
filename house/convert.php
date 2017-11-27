<?php
$fh = fopen(__DIR__ . '/data/raw.csv', 'r');
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
fgetcsv($fh, 2048);
while($line = fgetcsv($fh, 2048)) {
  $p = array();
  switch($line[2]) {
    case '台南市 鹽田六街90號':
    $p = array(
      'lat' => 23.032897,
      'lng' => 120.146342,
    );
    break;
    case '台南市 城東段556地號':
    $p = array(
      'lat' => 23.0629856,
      'lng' => 120.13132868,
    );
    break;
    case '台南市 虎尾寮段0320-0003地號':
    $p = array(
      'lat' => 22.9848742,
      'lng' => 120.2383855,
    );
    break;
    case '台南市 怡中段0376-0地號':
    $p = array(
      'lat' => 23.0486076,
      'lng' => 120.1977432,
    );
    break;
    case '台南市 公塭段0919地號':
    $p = array(
      'lat' => 23.0697491,
      'lng' => 120.1637508,
    );
    break;
    case '台南市 鹽田路105號':
    $p = array(
      'lat' => 23.033737,
      'lng' => 120.145269,
    );
    break;
    default:
    if(!empty($line[0])) {
      $p = twd97_to_latlng($line[0], $line[1]);
    }
  }
  if(!empty($p)) {
    $fc['features'][] = array(
      'type' => 'Feature',
      'properties' => array(
        'orig' => $line[2],
        'marker' => $line[3],
      ),
      'geometry' => array(
        'type' => 'Point',
        'coordinates' => array(floatval($p['lng']), floatval($p['lat'])),
      ),
    );
  }
}

file_put_contents(__DIR__ . '/data/points.json', json_encode($fc));

function twd97_to_latlng($x, $y) {
    $a = 6378137.0;
    $b = 6356752.314245;
    $lng0 = 121 * M_PI / 180;
    $k0 = 0.9999;
    $dx = 250000;
    $dy = 0;
    $e = pow((1 - pow($b, 2) / pow($a, 2)), 0.5);
    $x -= $dx;
    $y -= $dy;
    $M = $y / $k0;
    $mu = $M / ($a * (1.0 - pow($e, 2) / 4.0 - 3 * pow($e, 4) / 64.0 - 5 * pow($e, 6) / 256.0));
    $e1 = (1.0 - pow((1.0 - pow($e, 2)), 0.5)) / (1.0 + pow((1.0 - pow($e, 2)), 0.5));
    $J1 = (3 * $e1 / 2 - 27 * pow($e1, 3) / 32.0);
    $J2 = (21 * pow($e1, 2) / 16 - 55 * pow($e1, 4) / 32.0);
    $J3 = (151 * pow($e1, 3) / 96.0);
    $J4 = (1097 * pow($e1, 4) / 512.0);
    $fp = $mu + $J1 * sin(2 * $mu) + $J2 * sin(4 * $mu) + $J3 * sin(6 * $mu) + $J4 * sin(8 * $mu);
    $e2 = pow(($e * $a / $b), 2);
    $C1 = pow($e2 * cos($fp), 2);
    $T1 = pow(tan($fp), 2);
    $R1 = $a * (1 - pow($e, 2)) / pow((1 - pow($e, 2) * pow(sin($fp), 2)), (3.0 / 2.0));
    $N1 = $a / pow((1 - pow($e, 2) * pow(sin($fp), 2)), 0.5);
    $D = $x / ($N1 * $k0);
    $Q1 = $N1 * tan($fp) / $R1;
    $Q2 = (pow($D, 2) / 2.0);
    $Q3 = (5 + 3 * $T1 + 10 * $C1 - 4 * pow($C1, 2) - 9 * $e2) * pow($D, 4) / 24.0;
    $Q4 = (61 + 90 * $T1 + 298 * $C1 + 45 * pow($T1, 2) - 3 * pow($C1, 2) - 252 * $e2) * pow($D, 6) / 720.0;
    $lat = $fp - $Q1 * ($Q2 - $Q3 + $Q4);
    $Q5 = $D;
    $Q6 = (1 + 2 * $T1 + $C1) * pow($D, 3) / 6;
    $Q7 = (5 - 2 * $C1 + 28 * $T1 - 3 * pow($C1, 2) + 8 * $e2 + 24 * pow($T1, 2)) * pow($D, 5) / 120.0;
    $lng = $lng0 + ($Q5 - $Q6 + $Q7) / cos($fp);
    $lat = ($lat * 180) / M_PI;
    $lng = ($lng * 180) / M_PI;
    return array(
        'lat' => round($lat, 7),
        'lng' => round($lng, 7)
    );
}
