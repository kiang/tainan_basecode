window.app = {};
var app = window.app;

app.Button = function(opt_options) {
  var options = opt_options || {};
  var button = document.createElement('button');
  button.innerHTML = options.bText;
  var this_ = this;
  var handleButtonClick = function() {
    window.open(options.bHref);
  };

  button.addEventListener('click', handleButtonClick, false);
  button.addEventListener('touchstart', handleButtonClick, false);

  var element = document.createElement('div');
  element.className = options.bClassName + ' ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
}
ol.inherits(app.Button, ol.control.Control);

var layerRed = new ol.style.Style({
    image: new ol.style.RegularShape({
        fill: new ol.style.Fill({
            color: 'rgba(200,0,0,0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(0,0,0,0.3)',
            width: 2
        }),
        points: 3,
        radius: 10,
        radius2: 5
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
var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var laborData = {};
$.getJSON('data.json', {}, function(r) {
  laborData = r;
  var vectorSource = new ol.source.Vector();
  for(k in laborData) {
    var f = new ol.Feature(new ol.geom.Point(ol.proj.transform([laborData[k].point.lng, laborData[k].point.lat], 'EPSG:4326', 'EPSG:3857')));
    f.setProperties({
      name: k,
      address: laborData[k].address
    });
    vectorSource.addFeature(f);
  }
  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: layerRed,
    map: map
  });
});

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'http://wmts.nlsc.gov.tw/wmts',
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
    opacity: 0.5
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 11
});

var map = new ol.Map({
  layers: [baseLayer],
  overlays: [popup],
  target: 'map',
  view: appView,
  controls: ol.control.defaults().extend([
    new app.Button({
      bClassName: 'app-button1',
      bText: '原',
      bHref: 'https://github.com/kiang/tainan_basecode'
    }),
    new app.Button({
      bClassName: 'app-button2',
      bText: '江',
      bHref: 'http://k.olc.tw/'
    })
  ])
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

var changeTriggered = false;
geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
    if(false === changeTriggered) {
      var lonLat = ol.proj.toLonLat(coordinates);
      if(lonLat[0] >= 120.19962474795 && lonLat[0] <= 120.21603569449 && lonLat[1] >= 23.06772210296 && lonLat[1] <= 23.081301926211) {
        var mapView = map.getView();
        mapView.setCenter(coordinates);
        mapView.setZoom(17);
      }
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

/**
 * Add a click handler to the map to render the popup.
 */
map.on('singleclick', function(evt) {
  var coordinate = evt.coordinate;
  var message = '';
  var weight = 0;

  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      var p = feature.getProperties();
      message += '<h3>' + p.name + '</h3>';
      message += p.address;
      if(laborData[p.name]) {
        message += '<table boarded="1"><tr><th>違反法規</th><th>違反細節</th><th>發文字號</th><th>日期</th></tr>';
        for(k in laborData[p.name].logs) {
          message += '<tr>';
          for(j in laborData[p.name].logs[k]) {
            message += '<td>' + laborData[p.name].logs[k][j] + '</td>';
          }
          message += '</tr>';
        }
        message += '</table>';
      }
  });
  map.getView().setCenter(coordinate);
  if(message !== '') {
    content.innerHTML = message;
    popup.setPosition(coordinate);
  } else {
    popup.setPosition(undefined);
    closer.blur();
  }

});
