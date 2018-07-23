<?php
$fh = fopen(__DIR__ . '/points.csv', 'r');
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
while($line = fgetcsv($fh, 2048)) {
  $fc['features'][] = array(
    'type' => 'Feature',
    'properties' => array(
      'name' => $line[2],
    ),
    'geometry' => array(
      'type' => 'Point',
      'coordinates' => array(floatval($line[6]), floatval($line[5])),
    ),
  );
}

file_put_contents(__DIR__ . '/points.json', json_encode($fc));
