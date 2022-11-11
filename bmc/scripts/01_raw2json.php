<?php
$config = require __DIR__ . '/config.php';
$fc = [
    'type' => 'FeatureCollection',
    'features' => [],
];
$rawPath = __DIR__ . '/raw';
$fh = fopen(__DIR__ . '/raw.csv', 'r');
$head = fgetcsv($fh, 2048);
$head[0] = 'id';
while ($line = fgetcsv($fh, 2048)) {
    $data = array_combine($head, $line);
    $data['成立核准文號'] = trim($data['成立核准文號'], '\'');
    $parts = explode('/', $data['成立核准日期']);
    $dateApproved = '';
    if (!empty($parts[0])) {
        $parts[0] = 1911 + intval($parts[0]);
        $dateApproved = implode('-', $parts);
    }
    $data['成立核准日期'] = $dateApproved;
    $pos = strrpos($data['建築物地址'], '號');
    $address = '台南市' . substr($data['建築物地址'], 0, $pos) . '號';

    $rawFile = $rawPath . '/' . $address . '.json';
    if (!file_exists($rawFile)) {
        $apiUrl = $config['tgos']['url'] . '?' . http_build_query([
            'oAPPId' => $config['tgos']['APPID'], //應用程式識別碼(APPId)
            'oAPIKey' => $config['tgos']['APIKey'], // 應用程式介接驗證碼(APIKey)
            'oAddress' => $address, //所要查詢的門牌位置
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
            'oIsSupportPast' => 'true',
            'oIsShowCodeBase' => 'true',
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
            $fc['features'][] = [
                'type' => 'Feature',
                'properties' => $data,
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [
                        $json['AddressList'][0]['X'],
                        $json['AddressList'][0]['Y']
                    ],
                ],
            ];
        }
    }
}

file_put_contents(dirname(__DIR__) . '/points.json', json_encode($fc, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));