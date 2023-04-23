var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
var jsonFiles, filesLength, fileKey = 0;

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var filter = '';
function pointStyleFunction(f) {
  var p = f.getProperties().properties, color, stroke, radius;
  if(filter == 2) {
    if(!schools[p.key]['招生']['2歲']) {
      return null;
    }
  } else if(filter == 3) {
    if(!schools[p.key]['招生']['3歲以上']) {
      return null;
    }
  }
  if (f === currentFeature) {
    stroke = new ol.style.Stroke({
      color: '#000',
      width: 5
    });
    radius = 25;
  } else {
    stroke = new ol.style.Stroke({
      color: '#fff',
      width: 2
    });
    radius = 15;
  }

  if (p.count > 5) {
    color = '#48c774';
  } else if (p.count > 0) {
    color = '#ffdd57';
  } else {
    color = '#f00';
  }
  return new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: radius,
      points: 3,
      fill: new ol.style.Fill({
        color: color
      }),
      stroke: stroke
    })
  })
}
var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});

var vectorPoints = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: pointStyleFunction
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true,
    attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
  }),
  opacity: 0.8
});

var map = new ol.Map({
  layers: [baseLayer, vectorPoints],
  target: 'map',
  view: appView
});

map.addControl(sidebar);
var pointClicked = false;
var previousFeature = false;
var currentFeature = false;

map.on('singleclick', function (evt) {
  content.innerHTML = '';
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (false === pointClicked) {
      var p = feature.getProperties();
      currentFeature = feature;
      currentFeature.setStyle(pointStyleFunction(currentFeature));
      if (false !== previousFeature) {
        previousFeature.setStyle(pointStyleFunction(previousFeature));
      }
      previousFeature = currentFeature;
      appView.setCenter(feature.getGeometry().getCoordinates());
      appView.setZoom(15);
      var lonLat = ol.proj.toLonLat(p.geometry.getCoordinates());
      var message = '<table class="table table-dark">';
      message += '<tbody>';
      message += '<tr><th scope="row" style="width: 80px;">名稱</th><td>' + schools[p.properties.key]['幼兒園名稱'] + '</td></tr>';
      message += '<tr><th scope="row">電話</th><td>' + schools[p.properties.key]['幼兒園電話'] + '</td></tr>';
      message += '<tr><th scope="row">住址</th><td>' + schools[p.properties.key]['幼兒園住址'] + '</td></tr>';
      for (k in schools[p.properties.key]['招生']) {
        message += '<tr><th scope="row">' + k + '</th><td>'
        message += '<a href="' + schools[p.properties.key]['招生'][k]['招生簡章網址'] + '" target="_blank">招生簡章</a><br />';
        message += '名額：' + schools[p.properties.key]['招生'][k]['可招生名額'] + '<br />';
        message += '登記：' + schools[p.properties.key]['招生'][k]['登記名額'] + '<br />';
        message += '錄取：' + schools[p.properties.key]['招生'][k]['錄取名額'] + '<br />';
        message += '</td></tr>';
      }
      message += '<tr><td colspan="2">';
      message += '<hr /><div class="btn-group-vertical" role="group" style="width: 100%;">';
      message += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lonLat[1] + ',' + lonLat[0] + '&travelmode=driving" target="_blank" class="btn btn-info btn-lg btn-block">Google 導航</a>';
      message += '<a href="https://wego.here.com/directions/drive/mylocation/' + lonLat[1] + ',' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Here WeGo 導航</a>';
      message += '<a href="https://bing.com/maps/default.aspx?rtp=~pos.' + lonLat[1] + '_' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Bing 導航</a>';
      message += '</div></td></tr>';
      message += '</tbody></table>';
      sidebarTitle.innerHTML = schools[p.properties.key]['幼兒園名稱'];
      content.innerHTML = message;
      sidebar.open('home');
      pointClicked = true;
    }
  });
});

var schools = {};
$.getJSON('https://kiang.github.io/kid.tn.edu.tw/result.json', {}, function (c) {
  schools = c;
  var features = [];
  var stat = {};
  for (k in schools) {
    var count = 0;
    for (j in schools[k]['招生']) {
      schools[k]['招生'][j]['可招生名額'] = parseInt(schools[k]['招生'][j]['可招生名額']);
      schools[k]['招生'][j]['登記名額'] = parseInt(schools[k]['招生'][j]['登記名額']);
      count += schools[k]['招生'][j]['可招生名額'] - schools[k]['招生'][j]['登記名額'];
      if(!stat[j]) {
        stat[j] = {
          total: 0,
          available: 0
        };
      }
      stat[j].total += schools[k]['招生'][j]['可招生名額'];
      stat[j].available += count;
    }
    var f = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([schools[k].longitude, schools[k].latitude])),
      properties: {
        key: k,
        count: count
      }
    });
    features.push(f);
  }
  vectorPoints.getSource().addFeatures(features);
  var message = '報名概況<table class="table table-boarded"><tr><th>類型</th><th>剩餘名額</th><th>可招生名額</th></tr>';
  for(k in stat) {
    message += '<tr><td>' + k + '</td><td>' + stat[k].available + '</td><td>' + stat[k].total + '</td></tr>';
  }
  message += '</table>';
  $('#statContent').html(message);
})


var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var firstPosDone = false;
geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
  if (false === firstPosDone) {
    appView.setCenter(coordinates);
    firstPosDone = true;
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  var coordinates = geolocation.getPosition();
  if (coordinates) {
    appView.setCenter(coordinates);
  } else {
    alert('目前使用的設備無法提供地理資訊');
  }
  return false;
});

$('#btn-age2').click(function () {
  filter = 2;
  vectorPoints.getSource().refresh();
});

$('#btn-age3').click(function () {
  filter = 3;
  vectorPoints.getSource().refresh();
});

$('#btn-age-all').click(function () {
  filter = '';
  vectorPoints.getSource().refresh();
});