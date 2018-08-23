var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var styleRed = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    fill: new ol.style.Fill({
      color: '#ff0000'
    })
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var lineRed = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(255,0,0,0.6)',
      width: 6
  }),
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
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'rgba(0,0,0,1)'
    })
  })
});

var lineGreen = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,255,0,0.6)',
      width: 6
  }),
  image: new ol.style.RegularShape({
      fill: new ol.style.Fill({
          color: 'rgba(0,200,0,0.6)'
      }),
      stroke: new ol.style.Stroke({
          color: 'rgba(0,0,0,0.3)',
          width: 2
      }),
      points: 3,
      radius: 10,
      radius2: 5
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'rgba(0,0,0,1)'
    })
  })
});

var lineBlue = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,0,255,0.6)',
      width: 6
  }),
  image: new ol.style.RegularShape({
      fill: new ol.style.Fill({
          color: 'rgba(0,0,200,0.6)'
      }),
      stroke: new ol.style.Stroke({
          color: 'rgba(0,0,0,0.3)',
          width: 2
      }),
      points: 3,
      radius: 10,
      radius2: 5
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'rgba(0,0,0,1)'
    })
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

var styleFunction = function(feature) {
  var p = feature.getProperties();
  if(p['編號'] === 'V-95' || p['編號'] === 'IV-19' || p['編號'] === 'V-64') {
    return null;
  }
  var s = styleRed.clone();
  var t = p['尖峰交通時段1'] + ':' + p['尖峰交通量1(PCU)'];
  if(p['尖峰交通時段2'] !== '') {
    t += "\n" + p['尖峰交通時段2'] + ':' + p['尖峰交通量2(PCU)'];
  }
  s.getText().setText(t);
  return s;
};

var styleLine = function(feature) {
  var p = feature.getProperties(), lineStyle;
  switch(p['路線']) {
    case '紅線':
    lineStyle = lineRed.clone();
    break;
    case '綠線':
    lineStyle = lineGreen.clone();
    break;
    case '藍線':
    lineStyle = lineBlue.clone();
    break;
  }
  if(p['站名']) {
    lineStyle.getText().setText(p['站名']);
  }
  return lineStyle;
};

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'points.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleFunction
});
var lines = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'lines.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleLine
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
  center: ol.proj.fromLonLat([120.20047187805177, 22.997666465378202]),
  zoom: 14
});

var map = new ol.Map({
  layers: [baseLayer, vector, lines],
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

var lastFeature = false;
var lastStyle;

map.on('singleclick', function(evt) {
  var message = '<div class="table-responsive"><table class="table">';
  var roadFetched = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if(false !== roadFetched) {
      return;
    }
    var p = feature.getProperties();
    for(k in p) {
      if(k !== 'geometry') {
        message += '<tr><td>' + k + '</td><td>' + p[k] + '</td></tr>';
      }
    }
  });
  message += '</table></div>';
  $('#sidebar-main-block').html(message);
  sidebar.open('home');
});
