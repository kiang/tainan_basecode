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

var map = new ol.Map({
  layers: [baseLayer, factories, ia, zones],
  overlays: [popup],
  target: 'map',
  view: new ol.View({
    center: ol.proj.fromLonLat([120.301507, 23.124694]),
    zoom: 11
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
