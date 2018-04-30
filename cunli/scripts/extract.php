<?php
$json = json_decode(file_get_contents('/home/kiang/public_html/taiwan_basecode/cunli/geo/20180330.json'), true);
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);

foreach($json['features'] AS $f) {
  if($f['properties']['COUNTYNAME'] === '臺南市') {
    $fc['features'][] = $f;
  }
}

file_put_contents(dirname(__DIR__) . '/cunli_new.json', json_encode($fc));
