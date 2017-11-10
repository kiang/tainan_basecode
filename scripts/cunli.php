<?php
$basePath = dirname(__DIR__);

$json = json_decode(file_get_contents($basePath . '/cunli/cunli.json'), true);
foreach($json['objects']['VILLAGE_MOI_1060831']['geometries'] AS $obj) {
  $cunliKey = "{$obj['properties']['COUNTYNAME']}{$obj['properties']['TOWNNAME']}{$obj['properties']['VILLNAME']}";
  echo $cunliKey . "\n";
}
exit();

foreach(glob($basePath . '/raw/cunli_population/*.csv') AS $csvFile) {
  $fh = fopen($csvFile, 'r');
  fgetcsv($fh, 8096);
  $steps = array();
  $title = fgetcsv($fh, 8096);
  foreach($title AS $k => $v) {
    $pos = strpos($v, '歲');
    if(false !== $pos) {
      $y = substr($v, 0, $pos);
      $step = floor($y / 10) * 10;
      if(!isset($steps[$step])) {
        $steps[$step] = array();
      }
      $steps[$step][] = $k;
    }
  }

  while($line = fgetcsv($fh, 8096)) {
    $data = array();
    foreach($steps AS $step => $keys) {
      foreach($keys AS $key) {
        if(!isset($data[$step])) {
          $data[$step] = 0;
        }
        $data[$step] += intval($line[$key]);
      }
    }
/*
[0] => 10501
[1] => 新北市板橋區
[2] => 留侯里
[3] => 694
[4] => 1662
[5] => 791
[6] => 871
*/
    $cunliKey = $line[1] . $line[2];
    print_r($data); exit();
  }

}
