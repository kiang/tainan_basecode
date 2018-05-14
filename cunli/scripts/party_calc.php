<?php
$fh = fopen(__DIR__ . '/ref.csv', 'r');
$head = fgetcsv($fh, 2048);
$ref = array();
$party = array();
while($line = fgetcsv($fh, 2048)) {
  $data = array_combine($head, $line);
  $ref[$data['code']] = $data;
  if(!isset($party[$data['party']])) {
    $party[$data['party']] = 0;
  }
  ++$party[$data['party']];
}

$basePath = dirname(__DIR__);
$json = json_decode(file_get_contents($basePath . '/data.json'), true);
foreach($json AS $cunliCode => $logs) {
  $code = substr($cunliCode, 0, -3) . '-' . substr($cunliCode, -3);
  $ref[$code]['logs'] = $logs;
}

$newCunli = json_decode(file_get_contents($basePath . '/cunli_new.json'), true);
$newStack = $party = array();
foreach($newCunli['features'] AS $f) {
  $code = substr($f['properties']['VILLCODE'], 0, -3) . '-' . substr($f['properties']['VILLCODE'], -3);
  $newStack[$code] = true;
  if(isset($ref[$code])) {
    if(!isset($party[$ref[$code]['party']])) {
      $party[$ref[$code]['party']] = 0;
    }
    ++$party[$ref[$code]['party']];
  } else {
    if(!isset($party['新'])) {
      $party['新'] = 0;
    }
    ++$party['新'];
  }
}

/*
台南市里鄰編組由 752 里調整為 649 里，1萬4730鄰調整為9660鄰
異動前 752 村里，異動後 649 村里減少了 103 個村里

更動前
[無] => 605 / 752 = 80.45%
[民主進步黨] => 76 / 752 = 10.11%
[中國國民黨] => 71 / 752 = 9.44%

更動後
[無] => 463 / 649 = 71.34%
[民主進步黨] => 60 / 649 = 9.24%
[中國國民黨] => 50 / 649 = 7.70%
[新] => 76 / 649 = 11.71%
*/

/*
里鄰異動後，消失的里代號
[無] => 142
[民主進步黨] => 16
[中國國民黨] => 21
*/
$party = array();
foreach($ref AS $code => $cunli) {
  if(!isset($newStack[$code])) {
    if(!isset($party[$cunli['party']])) {
      $party[$cunli['party']] = 0;
    }
    ++$party[$cunli['party']];
  }
}

//
/* 政黨村里異動比例
[無] => 252
[中國國民黨] => 28
[民主進步黨] => 27
*/
/*
$party = array();
foreach($ref AS $cunli) {
  if(!isset($party[$cunli['party']])) {
    $party[$cunli['party']] = 0;
  }
  if(isset($cunli['logs'])) {
    ++$party[$cunli['party']];
  }
}
*/
