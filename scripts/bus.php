<?php
$json = json_decode(file_get_contents(__DIR__ . '/bus/AllBusRoutes.json'), true);
$fc = new stdClass();
$fc->type = 'FeatureCollection';
$fc->features = array();
foreach($json AS $line) {
  $xmlFile = __DIR__ . '/bus/' . $line['RouteOSMRelation'] . '.xml';
  if(!file_exists($xmlFile) || filesize($xmlFile) == 0) {
    file_put_contents($xmlFile, file_get_contents('http://api.openstreetmap.org/api/0.6/relation/' . $line['RouteOSMRelation']));
  }
  $xml = simplexml_load_file($xmlFile);
  if(!isset($xml->relation)) {
    continue;
  }
  foreach($xml->relation->member AS $m) {
    if((string)$m->attributes()->type === 'relation') {
      $xmlFile = __DIR__ . '/bus/' . $m->attributes()->ref . '.xml';
      if(!file_exists($xmlFile)) {
        file_put_contents($xmlFile, file_get_contents('http://api.openstreetmap.org/api/0.6/relation/' . $m->attributes()->ref . '/full'));
      }
      $line = simplexml_load_file($xmlFile);
      $nodes = array();
      foreach($line->node AS $n) {
        $a = $n->attributes();
        $nodes[(int)$a->id] = array((float)$a->lon, (float)$a->lat);
      }
      $ways = array();
      foreach($line->way AS $w) {
        $nd = array();
        foreach($w->nd AS $n) {
          $nd[] = $nodes[(int)$n->attributes()->ref];
        }
        $ways[(int)$w->attributes()->id] = $nd;
      }
      foreach($line->relation AS $r) {
        $name = '';
        foreach($r->tag AS $tag) {
          if((string)$tag->attributes()->k === 'name') {
            $name = (string)$tag->attributes()->v;
          }
        }
        foreach($r->member AS $m) {
          switch((string)$m->attributes()->type) {
            case 'way':
            $lines = array();
            foreach($ways[(int)$m->attributes()->ref] AS $p) {
              $lines[] = $p;
            }
            $f = new stdClass();
            $f->type = 'Feature';
            $f->properties = array(
              'name' => $name,
            );
            $f->geometry = new stdClass();
            $f->geometry->type = 'LineString';
            $f->geometry->coordinates = $lines;
            $fc->features[] = $f;
            break;
          }
        }
      }
    }
  }
}
file_put_contents(dirname(__DIR__) . '/bus.json', json_encode($fc));
