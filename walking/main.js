var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var styleRed = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [255, 0, 0, 0.3]
  })
});

var styleGreen = new ol.style.Style({
  stroke: new ol.style.Stroke({
    width: 3,
    color: [0, 255, 0, 0.7]
  })
});

var styleBlue = new ol.style.Style({
  stroke: new ol.style.Stroke({
    width: 5,
    color: [0, 0, 255, 0.7]
  })
});

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
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

var nlscMatrixIds = new Array(21);
for (var i=0; i<21; ++i) {
  nlscMatrixIds[i] = i;
}

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'history_streets.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleRed
});

var roadL = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'Road_l.geo.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleBlue
});

var roadS = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'Road_s.geo.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleGreen
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
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.5
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 11
});

var map = new ol.Map({
  layers: [baseLayer, vector, roadL, roadS],
  overlays: [popup],
  target: 'map',
  view: appView
});

map.addControl(sidebar);

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

var changeTriggered = false;
geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
    if(false === changeTriggered) {
      var mapView = map.getView();
      mapView.setCenter(coordinates);
      mapView.setZoom(17);
      changeTriggered = true;
    }
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

map.on('singleclick', function(evt) {
  map.getView().setZoom(17);
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    var p = feature.getProperties();
    var message = '<div class="table-responsive"><table class="table">';
    var fCenter = feature.getGeometry().getCoordinates();
    for(k in p) {
      if(k !== 'geometry') {
        message += '<tr><td>' + k + '</td><td>' + p[k] + '</td></tr>';
      }
    }
    message += '</table></div>';
    $('#sidebar-main-block').html(message);
    sidebar.open('home');
    content.innerHTML = p['巷道名稱'];
    popup.setPosition(fCenter);
    map.getView().setCenter(fCenter);
  });
});
