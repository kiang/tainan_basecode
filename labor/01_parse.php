<?php
$result = $pool = array();
foreach(glob(__DIR__ . '/raw/*') AS $xlsFile) {
  $p = pathinfo($xlsFile);
  $csvFile = __DIR__ . '/csv/' . $p['filename'] . '.csv';
  if(!file_exists($csvFile)) {
    exec("/usr/bin/soffice --headless --convert-to csv --infilter=CSV:44,34,76,1 --outdir csv {$xlsFile} ");
  }
  $fh = fopen($csvFile, 'r');
  $lastName = '';

  while($line = fgetcsv($fh, 2048)) {
    if(isset($line[2]) && !empty($line[3]) && false !== strpos($line[2], '條') && $line[0] !== '項次') {
      foreach($line AS $k => $v) {
        $line[$k] = str_replace(array("\n", ' '), '', $v);
      }
      if(!empty($line[4]) && !isset($pool[$line[4]])) {
        $pool[$line[4]] = true;
      } else {
        continue;
      }
      if(empty($line[1])) {
        $line[1] = $lastName;
      } else {
        $lastName = $line[1];
      }
      $pos = strpos($line[1], '公司');
      if(false !== $pos) {
        $line[1] = substr($line[1], 0, $pos) . '公司';
      }
      $pos = strpos($line[1], '大學');
      if(false !== $pos) {
        $line[1] = substr($line[1], 0, $pos) . '大學';
      }
      $pos = strpos($line[1], '協會');
      if(false !== $pos) {
        $line[1] = substr($line[1], 0, $pos) . '協會';
      }
      $pos = strpos($line[1], '旅館');
      if(false !== $pos) {
        $line[1] = substr($line[1], 0, $pos) . '旅館';
      }
      $pos = strpos($line[1], '即');
      if(false !== $pos) {
        $parts = preg_split('/(（即|）|\\(即|\\)|「|」)/', $line[1]);
        $line[1] = $parts[1];
      }
      if(!isset($result[$line[1]])) {
        $result[$line[1]] = array();
      }
      $result[$line[1]][] = array($line[2],$line[3],$line[4],$line[5],);
    }
  }
}

$addressRef = array(
  '臺南市永康區鹽洲里仁愛街117號' => array('lat' => 23.0462793, 'lng' => 120.2376304),
  '臺南市仁德區新田里新田路115號' => array('lat' => 22.9527523, 'lng' => 120.2614447),
  '臺南市安南區科技五路19號' => array('lat' => 23.0468373, 'lng' => 120.1421509),
  '臺南市安南區安順里安和路三段190巷59號' => array('lat' => 23.0480044, 'lng' => 120.2174503),
  '臺南市永康區鹽行里中正五街11巷33號' => array('lat' => 23.038086, 'lng' => 120.242216),
  '臺南市中西區府前路2段283號3樓' => array('lat' => 22.9920524, 'lng' => 120.1871385),
  '臺南市安南區長溪路2段455號1樓' => array('lat' => 23.052144, 'lng' => 120.2002505),
  '臺南市永康區中華路12號4樓之6' => array('lat' => 23.0001457, 'lng' => 120.232973),
  '臺南市六甲區龍湖里成功街30號' => array('lat' => 23.2231068, 'lng' => 120.3457742),
  '臺南市仁德區仁義里義林路160號' => array('lat' => 22.9666114, 'lng' => 120.2611691),
  '臺南市永康區王行里興工路23號' => array('lat' => 23.049047, 'lng' => 120.267222),
  '臺南市新營區四維路22號' => array('lat' => 23.3077567, 'lng' => 120.276277),
  '臺南市麻豆區南勢里關帝廟16-1號1樓' => array('lat' => 23.1927259, 'lng' => 120.2602186),
  '臺南市永康區塩行里中正五街85號' => array('lat' => 23.0361519, 'lng' => 120.245362),
  '臺南市安定區中沙里中崙175號' => array('lat' => 23.077071, 'lng' => 120.2087166),
  '臺南市仁德區保安里開發四路19號' => array('lat' => 22.9224099, 'lng' => 120.2452643),
  '臺南市安南區科技一路50號' => array('lat' => 23.0365326, 'lng' => 120.1437262),
  '臺南市南區新樂路72之2號' => array('lat' => 22.9685951, 'lng' => 120.172047),
  '臺南市永康區鹽洲里國聖街246號1樓' => array('lat' => 23.0344867, 'lng' => 120.2244036),
  '臺南市南區彰南里新信路13之1號' => array('lat' => 22.9729936, 'lng' => 120.1794781),
  '臺南市仁德區保安里開發三路23號' => array('lat' => 22.923702, 'lng' => 120.245654),
  '臺南市南區彰南里中華西路一段23號' => array('lat' => 22.9658239, 'lng' => 120.1813956),
  '臺南市安南區顯宮里工業五路13號' => array('lat' => 23.0578362, 'lng' => 120.2054922),
  '臺南市中西區府前路2段283號2樓' => array('lat' => 22.9920524, 'lng' => 120.1871385),
  '臺南市仁德區新田里勝利一街9號' => array('lat' => 22.9574155, 'lng' => 120.2562322),
  '臺南市山上區明和里256號' => array('lat' => 23.1130806, 'lng' => 120.340838),
  '臺南市南區新信路6號' => array('lat' => 22.973969, 'lng' => 120.179884),
);
foreach(glob(__DIR__ . '/tgos/*.csv') AS $csvFile) {
  $fh = fopen($csvFile, 'r');
  fgetcsv($fh, 2048);
  while($line = fgetcsv($fh, 2048)) {
    foreach($line AS $k => $v) {
      $line[$k] = mb_convert_encoding($v, 'utf-8', 'big5');
    }
    if(!empty($line[0])) {
      $addressRef[$line[2]] = twd97_to_latlng($line[0], $line[1]);
    }
  }
}

$finalResult = array();
foreach($result AS $companyName => $logs) {
  $jsonResult = __DIR__ . '/tmp/' . $companyName;
  if(!file_exists($jsonResult)) {
    file_put_contents($jsonResult, file_get_contents('http://gcis.nat.g0v.tw/api/search?q=' . urlencode($companyName)));
  }
  $json = json_decode(file_get_contents($jsonResult), true);
  if(isset($json['data'][0])) {
    if(isset($json['data'][0]['公司所在地'])) {
      $address = $json['data'][0]['公司所在地'];
    } elseif(isset($json['data'][0]['地址'])) {
      $address = $json['data'][0]['地址'];
    } elseif(isset($json['data'][0]['分公司所在地'])) {
      $address = $json['data'][0]['分公司所在地'];
    } else {
      continue;
    }
    if(isset($addressRef[$address])) {
      $finalResult[$companyName] = array(
        'address' => $address,
        'point' => $addressRef[$address],
        'logs' => $logs,
      );
    } else {
      $c = count($logs);
      echo "{$companyName}({$c}) - {$address}\n";
    }
  }
}

file_put_contents(__DIR__ . '/data.json', json_encode($finalResult));

function twd97_to_latlng($x, $y) {
    $a = 6378137.0;
    $b = 6356752.314245;
    $lng0 = 121 * M_PI / 180;
    $k0 = 0.9999;
    $dx = 250000;
    $dy = 0;
    $e = pow((1 - pow($b, 2) / pow($a, 2)), 0.5);
    $x -= $dx;
    $y -= $dy;
    $M = $y / $k0;
    $mu = $M / ($a * (1.0 - pow($e, 2) / 4.0 - 3 * pow($e, 4) / 64.0 - 5 * pow($e, 6) / 256.0));
    $e1 = (1.0 - pow((1.0 - pow($e, 2)), 0.5)) / (1.0 + pow((1.0 - pow($e, 2)), 0.5));
    $J1 = (3 * $e1 / 2 - 27 * pow($e1, 3) / 32.0);
    $J2 = (21 * pow($e1, 2) / 16 - 55 * pow($e1, 4) / 32.0);
    $J3 = (151 * pow($e1, 3) / 96.0);
    $J4 = (1097 * pow($e1, 4) / 512.0);
    $fp = $mu + $J1 * sin(2 * $mu) + $J2 * sin(4 * $mu) + $J3 * sin(6 * $mu) + $J4 * sin(8 * $mu);
    $e2 = pow(($e * $a / $b), 2);
    $C1 = pow($e2 * cos($fp), 2);
    $T1 = pow(tan($fp), 2);
    $R1 = $a * (1 - pow($e, 2)) / pow((1 - pow($e, 2) * pow(sin($fp), 2)), (3.0 / 2.0));
    $N1 = $a / pow((1 - pow($e, 2) * pow(sin($fp), 2)), 0.5);
    $D = $x / ($N1 * $k0);
    $Q1 = $N1 * tan($fp) / $R1;
    $Q2 = (pow($D, 2) / 2.0);
    $Q3 = (5 + 3 * $T1 + 10 * $C1 - 4 * pow($C1, 2) - 9 * $e2) * pow($D, 4) / 24.0;
    $Q4 = (61 + 90 * $T1 + 298 * $C1 + 45 * pow($T1, 2) - 3 * pow($C1, 2) - 252 * $e2) * pow($D, 6) / 720.0;
    $lat = $fp - $Q1 * ($Q2 - $Q3 + $Q4);
    $Q5 = $D;
    $Q6 = (1 + 2 * $T1 + $C1) * pow($D, 3) / 6;
    $Q7 = (5 - 2 * $C1 + 28 * $T1 - 3 * pow($C1, 2) + 8 * $e2 + 24 * pow($T1, 2)) * pow($D, 5) / 120.0;
    $lng = $lng0 + ($Q5 - $Q6 + $Q7) / cos($fp);
    $lat = ($lat * 180) / M_PI;
    $lng = ($lng * 180) / M_PI;
    return array(
        'lat' => round($lat, 7),
        'lng' => round($lng, 7)
    );
}
