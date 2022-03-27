import L from "leaflet";
import { onMounted, ref, onUnmounted } from "vue";
import { LAYER_NAMES, TILE_SERVER } from "../../constants";
import { unproject } from "./utils";

const createMap = (mapId) => {
  return L.map(mapId, {
    minZoom: 0,
    maxZoom: 7,
    crs: L.CRS.Simple,
    fadeAnimation: false,
    markerZoomAnimation: false
  }).setView([0, 0], 0);
};

const mapContainer = ref(null);
const markerLayer = ref(null);

export const useMap = (mapId) => {
  const registerMapEvents = (events) => {
    if (!mapContainer.value) return;
    if (events?.length) {
      events.forEach((event) => {
        mapContainer.value.on(event.name, event.cb);
      });
    }
  };

  const setupMap = (mapElement) => {
    const continent_dims = [81920, 114688];

    const southWest = unproject([0, 0], mapElement);
    const northEast = unproject(continent_dims, mapElement);
    const mapBounds = new L.LatLngBounds(southWest, northEast);

    console.log(mapBounds);

    mapElement.setMaxBounds(mapBounds);

    L.TileLayer.WikiTileLayer = L.TileLayer.extend({
        getTileUrl: function(coords) {
            // if ( wiki_tile_whitelist[this.options.continent][coords.z].indexOf('X' + coords.x + '_Y' + coords.y) == -1 ) {
            //     return 'https://wiki.guildwars2.com/images/c/cb/World_map_tile_under_construction.png';
            // }

            // console.log(this.options);
            var file = 'World_map_tile_C' + this.options.continent + '_F' + this.options.floor + '_Z' + coords.z + '_X' + coords.x + '_Y' + coords.y + '.jpg';
            console.log(file);
            // var md5file = md5(file);
            return 'https://wiki.guildwars2.com/images/' + file;
        }
    });
    L.tileLayer.wikiTileLayer = function(templateUrl, options) {
        return new L.TileLayer.WikiTileLayer(templateUrl, options);
    }

    // const tileLayer = L.tileLayer.wikiTileLayer(null, {
    //     minNativeZoom: 1, // furthest zoomed out folder value
    //     noWrap: true,
    //     bounds: mapBounds,
    //     continent: 1,
    //     floor: 1,
    //     attribution: 'Map data and imagery &copy; <a href="https://www.arena.net/" target="_blank">ArenaNet</a> | Additional imagery <a href="https://blog.thatshaman.com/" target="_blank">that_shaman</a>'
    // }).addTo(mapElement);

    L.GridLayer.GridDebug = L.GridLayer.extend({
        createTile: function (coords) {
            const tile = document.createElement('div');
            tile.style.outline = '1px solid green';
            tile.style.fontWeight = 'bold';
            tile.style.fontSize = '12px';
            tile.innerHTML = '&nbsp;Tile: Z=' + coords.z + ', X=' + coords.x + ', Y=' + coords.y + '<br>' + '&nbsp;[' + (coords.x)*256*Math.pow(2, mapElement.getMaxZoom() - coords.z) + ', ' + (coords.y)*256*Math.pow(2, mapElement.getMaxZoom() - coords.z) + ']';
            if (coords.z < this.options.mapMinNativeZoom ) {
                tile.style.color = 'red';
            } else {
                tile.style.color = 'white';
            }
            return tile;
        },
    });
    L.gridLayer.gridDebug = function (opts) {
        return new L.GridLayer.GridDebug(opts);
    };

    // layers
    const tileLayer = L.tileLayer(TILE_SERVER, {
      accessToken: LAYER_NAMES.TILES,
      minNativeZoom: 1,
      bounds: mapBounds,
      noWrap: true
    }).addTo(mapElement);

    // mapElement.addLayer(tileLayer);

    markerLayer.value = L.layerGroup([], {}).addTo(mapElement);

    mapElement.addLayer(L.gridLayer.gridDebug({
        mapMinNativeZoom: 1, // pass from parent map
        bounds: mapBounds
    }));
  };

  const getMarkers = () => {
    return markerLayer.value.getLayers();
  };

  onMounted(() => {
    if (mapContainer.value || !mapId) return;
    mapContainer.value = createMap(mapId);
    setupMap(mapContainer.value);
  });

  onUnmounted(() => {
    if (!mapContainer.value) return;
    mapContainer.value.off();
    mapContainer.value.remove();
    mapContainer.value = null;
  });

  return {
    mapContainer,
    markerLayer,
    getMarkers,
    registerMapEvents,
  };
};
