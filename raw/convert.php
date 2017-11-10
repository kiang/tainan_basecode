<?php
$path = __DIR__;
$targetFile = $path . '/VILLAGE_MOI_1060831.json';
$sourceFile = $path . '/VILLAGE_MOI_1060831/VILLAGE_MOI_1060831.shp';
if(file_exists($targetFile)) {
  unlink($targetFile);
}
exec("ogr2ogr -f \"GeoJSON\" {$targetFile}.t {$sourceFile} -simplify 0.00001");
exec("mapshaper -i {$targetFile}.t -o format=topojson {$targetFile}");
unlink($targetFile . '.t');
