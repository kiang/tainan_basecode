<?php
$path = __DIR__;
$targetFile = dirname($path) . '/cunli/cunli.json';
$geoFile = $path . '/VILLAGE_MOI_1060831.geo.json';
$sourceFile = $path . '/VILLAGE_MOI_1060831/VILLAGE_MOI_1060831.shp';
if(file_exists($targetFile)) {
  unlink($targetFile);
}
if(file_exists($geoFile)) {
  unlink($geoFile);
}
exec("ogr2ogr -f \"GeoJSON\" {$geoFile} {$sourceFile} -simplify 0.00001");

$json = json_decode(file_get_contents($geoFile), true);
foreach($json['features'] AS $k => $v) {
  if($v['properties']['COUNTYNAME'] !== '臺南市') {
    unset($json['features'][$k]);
  }
}
$json['features'] = array_values($json['features']);
file_put_contents($geoFile, json_encode($json));

exec("mapshaper -i {$geoFile} -o format=topojson {$targetFile}");
unlink($geoFile);
