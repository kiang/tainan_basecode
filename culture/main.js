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

var map, count, vectorPoints, cunli;
var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
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
    opacity: 0.3
});

var styleRed = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [255, 0, 0, 0.3]
  })
});

var streets = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'json/history_streets.json',
        format: new ol.format.GeoJSON()
    }),
    style: styleRed
});

var wall = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'json/wall.json',
        format: new ol.format.GeoJSON()
    })
});

map = new ol.Map({
  layers: [baseLayer, streets, wall],
  target: 'map',
  view: appView
});
map.addControl(sidebar);
map.on('singleclick', function(evt) {
  content.innerHTML = '';
  pointClicked = false;

  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if(false === pointClicked) {
      var message = '<table class="table table-dark">';
      message += '<tbody>';
      var p = feature.getProperties();
      if(p.VILLCODE) {
        message += '<h1>' + p.TOWNNAME + p.VILLNAME + '</h1>';
        if(count[p.VILLCODE]) {
          var keys = Object.keys(count[p.VILLCODE]);
          keys.sort(function(a,b) {
            return b-a;
          });
          message += '<table class="table table-dark"><thead>';
          message += '<tr><th>週次</th><th>調查單位</th><th>誘卵桶卵數</th><th>陽性率</th></tr>';
          message += '</thead><tbody>';
          for(k in keys) {
            for(unit in count[p.VILLCODE][keys[k]]) {
              message += '<tr><th scope="row">' + keys[k] + '</th>';
              message += '<td>' + unit + '</td>';
              message += '<td>' + count[p.VILLCODE][keys[k]][unit].countEggs + '</td>';
              message += '<td>' + Math.round((count[p.VILLCODE][keys[k]][unit].countPlus / count[p.VILLCODE][keys[k]][unit].countTotal * 100)) + '%</td></tr>';
            }
          }
          message += '</tbody></table>';
        }
        $('#sidebarCunli').html(message);
        return false;
      } else if(p.key) {
        sidebarTitle.innerHTML = jsonPoints[p.key].Address;
        for(k in jsonPoints[p.key]) {
          message += '<tr><th scope="row">' + k + '</th><td>' + jsonPoints[p.key][k] + '</td></tr>';
        }
      } else if(p.sickdate) {
        sidebarTitle.innerHTML = p.sickdate;
        message += '<tr><th scope="row">發病日期</th><td>' + p.sickdate + '</td></tr>';
      }
      message += '</tbody></table>';
      content.innerHTML = message;
      pointClicked = true;
    }
  });
  sidebar.open('home');
});

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
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

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');
var pointClicked;
