<?php
$basePath = dirname(__DIR__);
$targetPath = $basePath . '/cunli/json';
if(!file_exists($targetPath)) {
  mkdir($targetPath, 0777, true);
}

$base = json_decode(file_get_contents($basePath . '/raw/VILLAGE_MOI_1060831.json'), true);
print_r($base['objects']['VILLAGE_MOI_1060831']['geometries']);
