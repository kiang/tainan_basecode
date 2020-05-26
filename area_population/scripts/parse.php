<?php
/*
$zip = new ZipArchive;
$fileCount = 0;
foreach(glob(__DIR__ . '/*.rar') AS $f) {
    if($zip->open($f)) {
        ++$fileCount;
        copy("zip://".$f."#DataConsolidation.csv", __DIR__ . "/".$fileCount . '.csv');
    }
}
data from https://segis.moi.gov.tw/STAT/Web/Platform/DataConsolidation/STAT_DataConsolidation.aspx
*/
$data = array();
$csvPath = dirname(__DIR__) . '/raw';
foreach(glob($csvPath . '/*.csv') AS $csvFile) {
    $fh = fopen($csvFile, 'r');
    while($line = fgetcsv($fh, 2048)) {
        if(false === strpos($line[0], 'Y')) {
            continue;
        }
        $part = explode('Y', $line[0]);
        if(strlen($part[0]) === 2) {
            $line[0] = '0' . $part[0] . 'Y' . $part[1];
        }
        foreach($line AS $k => $v) {
            $line[$k] = mb_convert_encoding($v, 'utf-8', 'big5');
        }
        $key = mb_substr($line[4], 0, -1, 'utf-8');
        if(!isset($data[$key])) {
            $data[$key] = array();
        }
        $data[$key][$line[0]] = array($line[5], $line[6]);
    }
}
foreach($data AS $area => $v1) {
    ksort($data[$area]);
}
$labels = false;
$dataset1 = $dataset2 = array();
// from https://colourco.de/
$colors = array('#FE4365', '#FC9D9A', '#F9CDAD', '#C8C8A9', '#83AF9B', '#efa2e1', '#d6e532', '#ca82dd', '#e59ccb', '#e24931', '#f9dcb8', '#d6ed82', '#dab3ef', '#efb0fc', '#fcad99', '#bffbff', '#e8f7a5', '#899de5', '#4bd8c1', '#efa862', '#010872', '#c84bd8', '#8615ea', '#d2b4f7', '#2510b2', '#bca6ea', '#dd1a04', '#96ffdd', '#4f0ec9', '#93eda5', '#9464e5', '#e283c9', '#d18d4d', '#21d1bc', '#d34356', '#e2cc71', '#e3fc3f', '#b51b07', '#9af767', '#dbe86a', '#44b5e2', '#24bbc9', '#d8588c', '#3ed1b6', '#80c5ce', '#e67bf7', '#7d42aa', '#63ffef', '#9980fc');
$colorI = 0;
foreach($data AS $area => $v1) {
    if(false === $labels) {
        $labels = array_keys($v1);
    }
    $dataset1[$area] = $dataset2[$area] = array(
        'label' => $area,
        'fill' => false,
        'backgroundColor' => $colors[$colorI],
        'borderColor' => $colors[$colorI],
        'data' => array(),
    );
    foreach($v1 AS $v2) {
        $dataset1[$area]['data'][] = $v2[0];
        $dataset2[$area]['data'][] = $v2[1];
    }
    ++$colorI;
}
$jsonPath = dirname(__DIR__) . '/json';
file_put_contents($jsonPath . '/data1.json', json_encode(array('labels' => $labels, 'datasets' => array_values($dataset1))));
file_put_contents($jsonPath . '/data2.json', json_encode(array('labels' => $labels, 'datasets' => array_values($dataset2))));