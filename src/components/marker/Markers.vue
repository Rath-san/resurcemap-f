<template>
    <div v-if="markerPane" class="markers">
        <MarkerItem v-for="(item, index) in markers" :key="item.id" :marker="item" />
    </div>
</template>

<script>
import { defineComponent, watch, onMounted, ref } from "@vue/runtime-core";
import { useMap } from "../map/useMap";
import { useMarkers } from "../map/useMarkers";
import MarkerItem from './Marker.vue';

export default defineComponent({
    name: 'MarkersContainer',
    components: { MarkerItem },
    setup(props) {
        const { mapContainer, registerMapEvents } = useMap();
        const { markers } = useMarkers()
        const markerPane = ref(null);

        onMounted(() => {
            markerPane.value = document.querySelector(".leaflet-marker-pane")
        }),

        watch(mapContainer, (c, p) => {
            registerMapEvents([
                {
                    name: 'move',
                    cb: (event => {
                        // console.log(event);
                    })
                },
                {
                    name: 'viewreset',
                    cb: (event => {
                        console.log(event);
                    })
                }
            ])
        })

        return {
            markers,
            markerPane
        }
    }
})
</script>

<style lang="scss">
</style>