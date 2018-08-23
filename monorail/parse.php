<?php
$xml = simplexml_load_file(__DIR__ . '/tainan.kml');
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
foreach($xml->Document->Folder->Placemark AS $p) {
  $lines = explode('<br>', (string)$p->description);
  $pcu1 = false;
  foreach($lines AS $line) {
    $parts = explode(':', $line);
    foreach($parts AS $k => $v) {
      $parts[$k] = trim($v);
    }
    if(false === $pcu1) {
      $time1 = $parts[0];
      $pcu1 = $parts[1];
    } else {
      $time2 = $parts[0];
      $pcu2 = $parts[1];
    }
  }
  $point = explode(',', (string)$p->Point->coordinates);
  foreach($point AS $k => $v) {
    $point[$k] = floatval($v);
  }
  $fc['features'][] = array(
    'type' => 'Feature',
    'properties' => array(
      '地點' => (string)$p->name,
      '尖峰交通量1(PCU)' => $pcu1,
      '尖峰交通量2(PCU)' => $pcu2,
      '尖峰交通時段1' => $time1,
      '尖峰交通時段2' => $time2,
      '資料來源' => '臺南市市區道路交通量調查及分析',
    ),
    'geometry' => array(
      'type' => 'Point',
      'coordinates' => array($point[0], $point[1]),
    ),
  );
}

$json = json_decode(file_get_contents('/home/kiang/public_html/traffic/points_thb.json'), true);
foreach($json['features'] AS $f) {
  if($f['properties']['縣市'] === '臺南市') {
    $f['properties']['資料來源'] = '公路總局公路交通量調查統計表';
    $fc['features'][] = $f;
  }
}

file_put_contents(__DIR__ . '/points.json', json_encode($fc));

$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);

$pointCount = 0;
foreach(glob(__DIR__ . '/raw/*.json') AS $jsonFile) {
  $i = pathinfo($jsonFile);
  $name = '';
  switch($i['filename']) {
    case 'green':
    $name = '綠線';
    break;
    case 'blue':
    $name = '藍線';
    break;
    case 'red':
    $name = '紅線';
    break;
  }
  $json = json_decode(file_get_contents($jsonFile), true);
  foreach($json['features'] AS $f) {
    $f['properties'] = array(
      '路線' => $name,
    );
    if($f['geometry']['type'] === 'Point') {
      $f['properties']['站名'] = ++$pointCount . '站';
    }
    $fc['features'][] = $f;
  }
}

file_put_contents(__DIR__ . '/lines.json', json_encode($fc, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
