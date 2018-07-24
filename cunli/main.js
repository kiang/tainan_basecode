var areaCode = {
  '﻿新營區': '01',
  '鹽水區': '02',
  '白河區': '03',
  '柳營區': '04',
  '後壁區': '05',
  '東山區': '06',
  '麻豆區': '07',
  '下營區': '08',
  '六甲區': '09',
  '官田區': '10',
  '大內區': '11',
  '佳里區': '12',
  '學甲區': '13',
  '西港區': '14',
  '七股區': '15',
  '將軍區': '16',
  '北門區': '17',
  '新化區': '18',
  '善化區': '19',
  '新市區': '20',
  '安定區': '21',
  '山上區': '22',
  '玉井區': '23',
  '楠西區': '24',
  '南化區': '25',
  '左鎮區': '26',
  '仁德區': '27',
  '歸仁區': '28',
  '關廟區': '29',
  '龍崎區': '30',
  '永康區': '31',
  '東區': '32',
  '南區': '33',
  '北區': '34',
  '中西區': '35',
  '安南區': '36',
  '安平區': '37'
};
var pdfUrl = 'http://village.tainan.gov.tw/assets/pdf/';
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

var layerYellow = new ol.style.Style({
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

var layerGreen = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,0,0,1)',
      width: 1
  }),
  fill: new ol.style.Fill({
      color: 'rgba(0,255,0,0.3)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new ol.style.Fill({
      color: 'blue'
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

var cunliData = {};
$.getJSON('data.json', {}, function(r) {
  cunliData = r;
  var cunli = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: 'cunli.json',
      format: new ol.format.TopoJSON()
    }),
    style: function(f) {
      if(cunliData[f.get('VILLCODE')]) {
        layerYellow.getText().setText(f.get('TOWNNAME') + f.get('VILLNAME'));
        return layerYellow;
      } else {
        layerGreen.getText().setText(f.get('TOWNNAME') + f.get('VILLNAME'));
        return layerGreen;
      }
    },
    map: map
  });
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

  var featureFound = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      var p = feature.getProperties();
      if(false === featureFound && p.VILLCODE) {
        featureFound = true;
        message += '<h3>' + p.VILLNAME + '</h3><ul>';
        message += '<li><a href="' + pdfUrl + areaCode[p.TOWNNAME] + '_1.pdf" target="_blank">' + p.TOWNNAME + '調整情形一覽表</a></li>';
        message += '<li><a href="' + pdfUrl + areaCode[p.TOWNNAME] + '_2.pdf" target="_blank">' + p.TOWNNAME + '調整示意圖</a></li>';
        message += '</ul>';
        if(cunliData[p.VILLCODE]) {
          message += '<table boarded="1"><tr><th>區別</th><th>調整後里別</th><th>調整前里別</th><th>實施日期</th></tr>';
          for(k in cunliData[p.VILLCODE]) {
            message += '<tr>';
            for(j in cunliData[p.VILLCODE][k]) {
              message += '<td>' + cunliData[p.VILLCODE][k][j] + '</td>';
            }
            message += '</tr>';
          }
          message += '</table>';
        } else {
          message += '沒有變動';
        }
        map.getView().fit(feature.getGeometry().getExtent());
      }
  });
  if(message !== '') {
    content.innerHTML = message;
    popup.setPosition(coordinate);
  } else {
    popup.setPosition(undefined);
    closer.blur();
  }

});
