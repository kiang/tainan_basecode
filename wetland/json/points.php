<?php
$fh = fopen(__DIR__ . '/points.csv', 'r');
$time = array(
  'start' => false,
  'end' => false,
);
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(
    0 => array(
      'type' => 'Feature',
      'properties' => array(
        'name' => '黑面琵鷺調查點'
      ),
      'geometry' => array(
        'type' => 'MultiPoint',
        'coordinates' => array(),
      ),
    ),
  ),
);
$pool = array();
while($line = fgetcsv($fh, 2048)) {
  foreach($line AS $k => $v) {
    $line[$k] = mb_convert_encoding($v, 'utf-8', 'big5');
  }
  if($line[3] === '黑面琵鷺') {
    if(false === $time['start']) {
      $time['start'] = $line[0];
    }
    if(false === $time['end']) {
      $time['end'] = $line[0];
    }
    if($line[0] < $time['start']) {
      $time['start'] = $line[0];
    }
    if($line[0] > $time['end']) {
      $time['end'] = $line[0];
    }
    $key = implode('', array($line[6], $line[7]));
    if(!isset($pool[$key])) {
      $pool[$key] = true;
      $fc['features'][0]['geometry']['coordinates'][] = array(floatval($line[6]), floatval($line[7]));
    }
  }
}
$fc['features'][0]['properties']['start'] = $time['start'];
$fc['features'][0]['properties']['end'] = $time['end'];

file_put_contents(__DIR__ . '/points.json', json_encode($fc));
