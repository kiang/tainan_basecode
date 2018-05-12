<?php
include '/home/kiang/public_html/add/taiwan-address-data-master/lookup.php';
$fh = fopen(__DIR__ . '/106.csv', 'r');
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
$head = fgetcsv($fh, 2048);
$count = 0;
while($line = fgetcsv($fh, 2048)) {
  $data = array_combine($head, $line);
  $data['點位住址'] = '';
  $lane = $data['巷道名稱'];
  $pos = strrpos($lane, '號');
  $hasNumber = false;
  if(false !== $pos) {
    $lane = substr($lane, 0, $pos) . '號';
    $hasNumber = true;
  } else {
    $pos = strrpos($lane, '弄');
    if(false !== $pos) {
      $lane = substr($lane, 0, $pos) . '弄';
    } else {
      $pos = strrpos($lane, '巷');
      if(false !== $pos) {
        $lane = substr($lane, 0, $pos) . '巷';
      }
    }
  }
  if(false === $hasNumber) {
    $lane .= '1號';
  }
  $query = AddressLookup::lookup("台南市{$data['行政區']}{$lane}");
  if(is_array($query)) {
    $data['點位住址'] = $query[0]->FULL_ADDR;
    $fc['features'][] = array(
      'type' => 'Feature',
      'properties' => $data,
      'geometry' => array(
        'type' => 'Point',
        'coordinates' => array((float)$query[0]->X, (float)$query[0]->Y),
      ),
    );
  } else {
    ++$count;
  }
}

file_put_contents(__DIR__ . '/result.json', json_encode($fc));
echo $count;
