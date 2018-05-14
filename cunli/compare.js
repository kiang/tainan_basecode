var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
window.app = {};
var cunliData = {};
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

var styleYellow = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,0,0,1)',
      width: 1
  }),
  fill: new ol.style.Fill({
      color: 'rgba(255,255,0,0.3)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleRed = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,0,0,1)',
      width: 1
  }),
  fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.3)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleFunc = function(f) {
  var zoom = appView.getZoom();
  var styleTarget;
  var vcode = f.get('VILLCODE');
  if(cunliData[vcode] || !cunliBase[vcode]) {
    styleTarget = styleRed.clone();
  } else {
    styleTarget = styleYellow.clone();
  }
  if(zoom > 13) {
    styleTarget.getText().setText(f.get('TOWNNAME') + f.get('VILLNAME'));
  }
  return styleTarget;
}

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

var cunliNewSource = new ol.source.Vector({
  url: 'cunli_new.json',
  format: new ol.format.GeoJSON()
});
var cunliNew = new ol.layer.Vector({
  source: cunliNewSource,
  style: styleFunc
});

var cunliNewList = {};
cunliNewSource.once('change', function() {
  if(cunliNewSource.getState() === 'ready') {
    cunliNewSource.forEachFeature(function(f) {
      var p = f.getProperties();
      f.setId(p.VILLCODE);
      if(!cunliNewList[p.TOWNNAME]) {
        cunliNewList[p.TOWNNAME] = {};
      }
      cunliNewList[p.TOWNNAME][p.VILLCODE] = p.VILLNAME;
    });
    var townOptions = '<option>---</option>';
    for(k in cunliNewList) {
      townOptions += '<option value="' + k + '">' + k + '</option>';
    }
    $('select#townNew').html(townOptions);
    $('select#townNew').change(function() {
      var cunliOptions = '<option>---</option>';
      var selectedTown = $(this).val();
      if(cunliNewList[selectedTown]) {
        for(k in cunliNewList[selectedTown]) {
          cunliOptions += '<option value="' + k + '">' + cunliNewList[selectedTown][k] + '</option>';
        }
      }
      $('select#cunliNew').html(cunliOptions);
    });
    $('select#cunliNew').change(function() {
      var selectedCunli = $(this).val();
      var f = cunliNewSource.getFeatureById(selectedCunli);
      if(f) {
        map1.getView().fit(f.getGeometry().getExtent());
      }
    });
  }
})

var cunliSource = new ol.source.Vector({
  url: 'cunli.json',
  format: new ol.format.TopoJSON()
});
var cunli = new ol.layer.Vector({
  source: cunliSource,
  style: styleFunc
});
var cunliList = {};
var cunliBase = {};
cunliSource.once('change', function() {
  if(cunliSource.getState() === 'ready') {
    cunliSource.forEachFeature(function(f) {
      var p = f.getProperties();
      f.setId(p.VILLCODE);
      cunliBase[p.VILLCODE] = true;
      if(!cunliList[p.TOWNNAME]) {
        cunliList[p.TOWNNAME] = {};
      }
      cunliList[p.TOWNNAME][p.VILLCODE] = p.VILLNAME;
    });
    var townOptions = '<option>---</option>';
    for(k in cunliList) {
      townOptions += '<option value="' + k + '">' + k + '</option>';
    }
    $('select#town').html(townOptions);
    $('select#town').change(function() {
      var cunliOptions = '<option>---</option>';
      var selectedTown = $(this).val();
      if(cunliList[selectedTown]) {
        for(k in cunliList[selectedTown]) {
          cunliOptions += '<option value="' + k + '">' + cunliList[selectedTown][k] + '</option>';
        }
      }
      $('select#cunli').html(cunliOptions);
    });
    $('select#cunli').change(function() {
      var selectedCunli = $(this).val();
      var f = cunliSource.getFeatureById(selectedCunli);
      if(f) {
        map2.getView().fit(f.getGeometry().getExtent());
      }
    });
  }
})


setTimeout(function() {
  $.getJSON('data.json', {}, function(r) {
    cunliData = r;
    cunliSource.refresh();
    cunliNewSource.refresh();
  });
}, 350);

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
    opacity: 0.5
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 11
});

var map1 = new ol.Map({
  layers: [baseLayer, cunliNew],
  overlays: [popup],
  target: 'map1',
  view: appView
});

var map2 = new ol.Map({
  layers: [baseLayer, cunli],
  overlays: [popup],
  target: 'map2',
  view: appView
});

map2.addControl(sidebar);

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
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
  }
});

var dynamicPoint = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

map1.addLayer(dynamicPoint);
map2.addLayer(dynamicPoint);

/**
 * Add a click handler to the map to render the popup.
 */
 map1.on('singleclick', function(evt) {
   var coordinate = evt.coordinate;
   var message = '';
   map1.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
     map1.getView().fit(feature.getGeometry().getExtent());
   });
 });

 map2.on('singleclick', function(evt) {
   var coordinate = evt.coordinate;
   var message = '';
   map2.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
     map2.getView().fit(feature.getGeometry().getExtent());
   });
 });
