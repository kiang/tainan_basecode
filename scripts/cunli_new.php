<?php
$basePath = dirname(__DIR__);
foreach(glob($basePath . '/raw/cunli_new/*.pdf') AS $pdfFile) {
  $txtFile = substr($pdfFile, 0, -3) . 'txt';
  if(!file_exists($txtFile)) {
    exec("/usr/bin/pdftotext -layout {$pdfFile} {$txtFile}");
  }
  echo "{$txtFile}\n";
  $lines = explode("\n", file_get_contents($txtFile));
  foreach($lines AS $line) {
    $parts = preg_split('/ +/', $line);
    print_r($parts);
  }
}
