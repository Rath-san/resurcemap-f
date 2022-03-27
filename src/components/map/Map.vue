<template>
    <div id="map"></div>
</template>

<script>
import { defineComponent, ref, unref, onUnmounted, onMounted, watch } from "vue";
import { useMap } from "./useMap";
import { useMarkers } from "./useMarkers";

export default defineComponent({
    name: "MapContainer",
    setup(props) {

        const { registerMapEvents } = useMap('map');
        const { addMarker } = useMarkers();

        onMounted(() => {
            registerMapEvents([
                {
                    name: 'click',
                    cb: addMarker
                }
            ])
        })

        return {
        }
    }
})

</script>

<style lang="scss">
#map {
    background-color: #000;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
}

.leaflet-tile-container {
    pointer-events: all;
}

.leaflet-tile {
    border: solid red 1px;
    visibility: visible;
}

@import url("https://unpkg.com/leaflet@1.7.1/dist/leaflet.css");
</style>