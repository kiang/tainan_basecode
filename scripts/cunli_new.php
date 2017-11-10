<?php
$basePath = dirname(__DIR__);

$cunli = json_decode(file_get_contents($basePath . '/cunli/cunli.json'), true);
$ref = array();
$dic = array(
  '[鹽]' => '塩',
  '[部]' => '廍',
  '[晉]' => '晋',
  '[腳]' => '脚',
  '[那]' => '𦰡',
  '[峰]' => '峯',
  '[曹]' => '𥕢',
  '[塭]' => '塭',
  '[慷]' => '槺',
);
foreach($cunli['objects']['VILLAGE_MOI_1060831']['geometries'] AS $g) {
  if(!isset($ref[$g['properties']['TOWNNAME']])) {
    $ref[$g['properties']['TOWNNAME']] = array();
  }
  $g['properties']['VILLNAME'] = strtr($g['properties']['VILLNAME'], $dic);
  $ref[$g['properties']['TOWNNAME']][$g['properties']['VILLNAME']] = $g['properties']['VILLCODE'];
}

$result = array();

foreach(glob($basePath . '/raw/cunli_new/*.pdf') AS $pdfFile) {
  $txtFile = substr($pdfFile, 0, -3) . 'txt';
  if(!file_exists($txtFile)) {
    exec("/usr/bin/pdftotext -layout {$pdfFile} {$txtFile}");
  }
  $lines = explode("\n", file_get_contents($txtFile));
  foreach($lines AS $line) {
    $parts = preg_split('/ +/', trim($line));
    if(isset($parts[3]) && false !== strpos($parts[3], '107')) {
      if($parts[1] != $parts[2]) {
        foreach($ref[$parts[0]] AS $cunliName => $cunliCode) {
          if(false !== strpos($parts[2], $cunliName)) {
            if(!isset($result[$cunliCode])) {
              $result[$cunliCode] = array();
            }
            $result[$cunliCode][] = $parts;
          }
        }
      }
    }
  }
}

file_put_contents($basePath . '/cunli/data.json', json_encode($result));
