var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var style0 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [0, 102, 255, 0.1]
  })
});

var style1 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [154,205,50, 0.4]
  })
});

var style2 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [60,179,113, 0.4]
  })
});

var style3 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [46,139,87, 0.7]
  })
});

var style4 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [128,128,0, 0.7]
  })
});

var style5 = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [85,107,47, 0.7]
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
    url: 'gridcode.json',
    format: new ol.format.TopoJSON()
  }),
  style: function(f) {
    switch(f.get('gridcode')) {
      case 0:
        return style0;
      case 1:
        return style1;
      case 2:
        return style2;
      case 3:
        return style3;
      case 4:
        return style4;
      case 5:
        return style5;
    }
  }
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
  layers: [baseLayer, vector],
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
  var clickTriggered = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if(false === clickTriggered) {
      clickTriggered = true;
      var p = feature.getProperties();
      var message = '<div class="table-responsive"><table class="table">';
      var fCenter = evt.coordinate;
      for(k in p) {
        if(k !== 'geometry') {
          message += '<tr><td>' + k + '</td><td>' + p[k] + '</td></tr>';
        }
      }
      message += '</table></div>';
      $('#sidebar-main-block').html(message);
      sidebar.open('home');
      content.innerHTML = $('#gridcode' + p['gridcode']).parent().html();
      popup.setPosition(fCenter);
      map.getView().setCenter(fCenter);
    }
  });
});
