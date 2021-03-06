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
    stroke: new ol.style.Stroke({
        color: 'rgba(255,0,0,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(200,0,0,0.1)'
    })
});

var layerYellow = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255,255,0,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(100,100,0,0.1)'
    })
});

var layerBlue = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0,0,255,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(0,0,200,0.1)'
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

var factories = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'factories.json',
        format: new ol.format.TopoJSON()
    }),
    style: layerRed
});

var ia = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'ia.json',
        format: new ol.format.TopoJSON()
    }),
    style: layerBlue
});

var zones = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'zones.json',
        format: new ol.format.GeoJSON()
    }),
    style: layerYellow
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 11
});

/*
new ol.layer.Tile({
          source: new ol.source.OSM()
        })
*/
var map = new ol.Map({
  layers: [baseLayer, factories, ia, zones],
  overlays: [popup],
  target: 'map',
  view: appView,
  controls: ol.control.defaults().extend([
    new app.Button({
      bClassName: 'app-button1',
      bText: '原',
      bHref: 'https://github.com/kiang/tainan_basecode/'
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

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
          new ol.geom.Point(coordinates) : null);
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
      for(k in p) {
        if(k !== 'geometry') {
          message += k + ': ' + p[k] + '<br />';
        }
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

$(function() {
  //s_d0：PM2.5
  $.getJSON('https://data.lass-net.org/data/last-all-airbox.json', {}, function(d) {
    var airbox = [];
    for(k in d.feeds) {
      var box = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([d.feeds[k].gps_lon, d.feeds[k].gps_lat])),
        pm25: d.feeds[k].s_d0
      });
      airbox.push(box);
    }
    var airboxLayer = new ol.layer.Vector({
      map: map,
      source: new ol.source.Vector({
        features: airbox
      }),
      style: function(f) {
        var p = f.getProperties();
        var boxColor = '';
        if(p.pm25 < 12) {
          boxColor = '#8cdd8f';
        } else if(p.pm25 < 24) {
          boxColor = '#36dd12';
        } else if(p.pm25 < 36) {
          boxColor = '#36b712';
        } else if(p.pm25 < 42) {
          boxColor = '#dbdd12';
        } else if(p.pm25 < 48) {
          boxColor = '#dbb712';
        } else if(p.pm25 < 54) {
          boxColor = '#db8d12';
        } else if(p.pm25 < 59) {
          boxColor = '#db6162';
        } else if(p.pm25 < 65) {
          boxColor = '#db1112';
        } else if(p.pm25 < 71) {
          boxColor = '#8a1112';
        } else {
          boxColor = '#b438de';
        }

        var boxStyle = new ol.style.Style({
          image: new ol.style.Circle({
            radius: 15,
            stroke: new ol.style.Stroke({
              color: '#fff'
            }),
            fill: new ol.style.Fill({
              color: boxColor
            })
          }),
          text: new ol.style.Text({
            text: p.pm25.toString(),
            fill: new ol.style.Fill({
              color: '#fff'
            })
          })
        });
        return boxStyle;
      }
    });
    map.addLayer(airboxLayer);
  });
})
