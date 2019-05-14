window.app = {};
var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
var clickedCoordinate, populationLayer, gPopulation;
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
    placement: 'point',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
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
    opacity: 0.3
});

var wetlandStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255, 193, 7, 1)',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 35, 7, 0.5)'
    })
});

var sunStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(193, 255, 7, 1)',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(35, 255, 7, 0.5)'
    })
});

// or official from https://data.gov.tw/dataset/35587
var wetland = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'json/base.json', // downloaded from https://www.twreporter.org/a/dangerous-fault-architect
        format: new ol.format.GeoJSON()
    }),
    style: wetlandStyle
});

var sunProj = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'json/result.json', // downloaded from https://www.twreporter.org/a/dangerous-fault-architect
        format: new ol.format.GeoJSON()
    }),
    style: sunStyle
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301507, 23.124694]),
  zoom: 10
});

var map = new ol.Map({
  layers: [baseLayer, sunProj, wetland],
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
  clickedCoordinate = evt.coordinate;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      var p = feature.getProperties();
      console.log(p);
      var message = '';
      for(k in p) {
        if(k !== 'geometry') {
          message += k + ': ' + p[k] + '<br />';
        }
      }
      if(message !== '') {
        content.innerHTML = message;
        popup.setPosition(clickedCoordinate);
      } else {
        popup.setPosition(undefined);
        closer.blur();
      }
  });
});
