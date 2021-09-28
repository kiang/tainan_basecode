<?php
/*
raw data from https://data.tainan.gov.tw/dataset/narrow-roads
 */
$config = require __DIR__ . '/config.php';
$fh = fopen(__DIR__ . '/ref/ref.csv', 'r');
$ref = [];
while ($line = fgetcsv($fh, 2048)) {
  $ref[$line[0]] = $line;
}

$fh = fopen(__DIR__ . '/raw/110.csv', 'r');
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
$head = fgetcsv($fh, 2048);

while ($line = fgetcsv($fh, 2048)) {
  $data = array_combine($head, $line);
  $data['點位住址'] = '';
  $lane = $data['巷道名稱'];
  $pos = strrpos($lane, '號');
  $hasNumber = false;
  if (false !== $pos) {
    $lane = substr($lane, 0, $pos) . '號';
    $hasNumber = true;
  } else {
    $pos = strrpos($lane, '弄');
    if (false !== $pos) {
      $lane = substr($lane, 0, $pos) . '弄';
    } else {
      $pos = strrpos($lane, '巷');
      if (false !== $pos) {
        $lane = substr($lane, 0, $pos) . '巷';
      }
    }
  }
  if (false === $hasNumber) {
    $lane .= '1號';
  }
  $lane = '台南市' . $data['行政區'] . $lane;
  if (isset($ref[$lane])) {
    $data['點位住址'] = $ref[$lane][1];
    $fc['features'][] = array(
      'type' => 'Feature',
      'properties' => $data,
      'geometry' => array(
        'type' => 'Point',
        'coordinates' => [(float)$ref[$lane][2], (float)$ref[$lane][3]],
      ),
    );
  } else {
    $rawFile = __DIR__ . '/ref/' . $lane . '.json';
    if (!file_exists($rawFile)) {
      $apiUrl = $config['tgos']['url'] . '?' . http_build_query([
        'oAPPId' => $config['tgos']['APPID'], //應用程式識別碼(APPId)
        'oAPIKey' => $config['tgos']['APIKey'], // 應用程式介接驗證碼(APIKey)
        'oAddress' => $lane, //所要查詢的門牌位置
        'oSRS' => 'EPSG:4326', //回傳的坐標系統
        'oFuzzyType' => '2', //模糊比對的代碼
        'oResultDataType' => 'JSON', //回傳的資料格式
        'oFuzzyBuffer' => '0', //模糊比對回傳門牌號的許可誤差範圍
        'oIsOnlyFullMatch' => 'false', //是否只進行完全比對
        'oIsLockCounty' => 'true', //是否鎖定縣市
        'oIsLockTown' => 'false', //是否鎖定鄉鎮市區
        'oIsLockVillage' => 'false', //是否鎖定村里
        'oIsLockRoadSection' => 'false', //是否鎖定路段
        'oIsLockLane' => 'false', //是否鎖定巷
        'oIsLockAlley' => 'false', //是否鎖定弄
        'oIsLockArea' => 'false', //是否鎖定地區
        'oIsSameNumber_SubNumber' => 'true', //號之、之號是否視為相同
        'oCanIgnoreVillage' => 'true', //找不時是否可忽略村里
        'oCanIgnoreNeighborhood' => 'true', //找不時是否可忽略鄰
        'oReturnMaxCount' => '0', //如為多筆時，限制回傳最大筆數
      ]);
      $content = file_get_contents($apiUrl);
      $pos = strpos($content, '{');
      $posEnd = strrpos($content, '}') + 1;
      $resultline = substr($content, $pos, $posEnd - $pos);
      if (strlen($resultline) > 10) {
        file_put_contents($rawFile, substr($content, $pos, $posEnd - $pos));
      }
    }
    if (file_exists($rawFile)) {
      $json = json_decode(file_get_contents($rawFile), true);
      if (!empty($json['AddressList'][0]['X'])) {
        $data['點位住址'] = $json['AddressList'][0]['FULL_ADDR'];
        $fc['features'][] = array(
          'type' => 'Feature',
          'properties' => $data,
          'geometry' => array(
            'type' => 'Point',
            'coordinates' => [(float)$json['AddressList'][0]['X'], (float)$json['AddressList'][0]['Y']],
          ),
        );
      }
    }
  }
}

file_put_contents(__DIR__ . '/result.json', json_encode($fc));
