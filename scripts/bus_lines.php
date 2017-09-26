<?php
$targetPath = __DIR__ . '/bus_json';
if(!file_exists($targetPath)) {
  mkdir($targetPath, 0777);
}

$json = json_decode(file_get_contents(__DIR__ . '/bus/AllBusRoutes.json'), true);
foreach($json AS $line) {
  $targetFile = $targetPath . '/' . $line['RouteName'] . '.json';
  $xmlFile = __DIR__ . '/bus/' . $line['RouteOSMRelation'] . '.xml';
  if(!file_exists($xmlFile) || filesize($xmlFile) == 0) {
    file_put_contents($xmlFile, file_get_contents('http://api.openstreetmap.org/api/0.6/relation/' . $line['RouteOSMRelation']));
  }
  $xml = simplexml_load_file($xmlFile);
  if(!isset($xml->relation)) {
    continue;
  }
  $fc = new stdClass();
  $fc->type = 'FeatureCollection';
  $fc->features = array();
  $nodeTags = array();
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
        if(isset($n->tag)) {
          $nodeTags[(int)$a->id] = array();
          foreach($n->tag AS $tag) {
            $nodeTags[(int)$a->id][(string)$tag->attributes()->k] = (string)$tag->attributes()->v;
          }
        }
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
        $rTags = array();
        foreach($r->tag AS $tag) {
          $rTags["{$tag->attributes()->k}"] = "{$tag->attributes()->v}";
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
              $f->properties = $rTags;
              $f->geometry = new stdClass();
              $f->geometry->type = 'LineString';
              $f->geometry->coordinates = $lines;
              $fc->features[] = $f;
            break;
            case 'node':
              $f = new stdClass();
              $f->type = 'Feature';
              $f->properties = $nodeTags[(int)$m->attributes()->ref];
              $f->geometry = new stdClass();
              $f->geometry->type = 'Point';
              $f->geometry->coordinates = $nodes[(int)$m->attributes()->ref];
              $fc->features[] = $f;
            break;
          }
        }
      }
    }
  }
  file_put_contents($targetFile, json_encode($fc));
}
