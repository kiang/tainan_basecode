<?php
$targetPath = dirname(__DIR__) . '/water/json';
if(!file_exists($targetPath)) {
  mkdir($targetPath, 0777, true);
}
$jsonFiles = array();
foreach(glob(dirname(__DIR__) . '/water/json/*.json') AS $jsonFile) {
  $p = pathinfo($jsonFile);
  $parts = explode('r', $p['filename']);
  if(count($parts) !== 2) {
    continue;
  }
  if(!isset($jsonFiles[$parts[1]])) {
    $jsonFiles[$parts[1]] = array();
  }
  $jsonFiles[$parts[1]][] = $jsonFile;
}

foreach($jsonFiles AS $r => $files) {
  $fc = new stdClass();
  $fc->type = 'FeatureCollection';
  $fc->features = array();
  foreach($files AS $file) {
    $json = json_decode(file_get_contents($file));
    foreach($json->features AS $f) {
      $fc->features[] = $f;
    }
  }
  file_put_contents($targetPath . '/' . $r . '.json', json_encode($fc));
}
