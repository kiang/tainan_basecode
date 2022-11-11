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

var styleBase = new ol.style.Style({
  image: new ol.style.RegularShape({
    radius: 15,
    points: 3,
    fill: new ol.style.Fill({
      color: '#48c774'
    })
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

function pointStyleFunction(f) {
  var p = f.getProperties(), stroke, radius;
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
  let pointStyle = new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: radius,
      points: 3,
      fill: new ol.style.Fill({
        color: '#48c774'
      }),
      stroke: stroke
    }),
    text: new ol.style.Text({
      font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
      fill: new ol.style.Fill({
        color: 'rgba(0,0,255,0.7)'
      })
    })
  });
  pointStyle.getText().setText(p['地上層數']);
  
  return pointStyle;
}
var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});

var vectorPoints = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'points.json',
    format: new ol.format.GeoJSON()
  }),
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
      var lonLat = ol.proj.toLonLat(p.geometry.getCoordinates());
      var message = '<table class="table table-dark">';
      message += '<tbody>';
      message += '<tr><th scope="row" style="width: 80px;">名稱</th><td>' + p['管理委員會'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">建築物地址</th><td>' + p['建築物地址'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">棟數</th><td>' + p['棟數'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">地上層數</th><td>' + p['地上層數'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">地下層數</th><td>' + p['地下層數'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">成立核准日期</th><td>' + p['成立核准日期'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">成立核准文號</th><td>' + p['成立核准文號'] + '</td></tr>';
      message += '<tr><th scope="row" style="width: 80px;">使用執照</th><td>' + p['使用執照'] + '</td></tr>';
      message += '<tr><td colspan="2">';
      message += '<hr /><div class="btn-group-vertical" role="group" style="width: 100%;">';
      message += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lonLat[1] + ',' + lonLat[0] + '&travelmode=driving" target="_blank" class="btn btn-info btn-lg btn-block">Google 導航</a>';
      message += '<a href="https://wego.here.com/directions/drive/mylocation/' + lonLat[1] + ',' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Here WeGo 導航</a>';
      message += '<a href="https://bing.com/maps/default.aspx?rtp=~pos.' + lonLat[1] + '_' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Bing 導航</a>';
      message += '</div></td></tr>';
      message += '</tbody></table>';
      sidebarTitle.innerHTML = p['管理委員會'];
      content.innerHTML = message;
      sidebar.open('home');
      pointClicked = true;
    }
  });
});

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