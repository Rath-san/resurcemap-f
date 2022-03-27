<template lang="">
    <teleport :to="markerIdQueryString" >
        <div ref="target" :class="['marker', {'marker--active': active, 'marker--dragged': dragged}]"
        >
        <div :class="['marker-icon', 'marker__main']">
          <img :src="currentNodeIcon" :alt="currentNodeName" @click.stop="toggleActive">
        </div>
        <div class="marker__options">
          <div
            :class="['marker-icon', 'marker__option', {'marker__option--current' : isCurrentNode(markerIcon[0])}]"
            v-for="(markerIcon, index) in markerIcons" :key="index"
                @click.stop="changeCurrentNode(markerIcon[0])"
                :style="`--r-index: ${index}`"
        >
            <img :src="markerIcon[1]" :alt="markerIcon[0]">
          </div>
            <!-- delete marker -->
          <div
            :class="['marker-icon', 'marker__option', 'marker__option--delete']"
            @click.stop="handleRemoveMarker"
            :style="'--r-index: 5'"
        >
            <span>x</span>
          </div>
        </div>
      </div>
    </teleport>
</template>
<script>import { defineComponent, computed, onMounted, ref, onUnmounted, watch } from "@vue/runtime-core";
import { MAKER_ICONS } from "../../constants";
import { onClickOutside } from '@vueuse/core'
import { useMarkers } from "../map/useMarkers";

export default defineComponent({
    name: 'MarkerItem',
    components: {},
    props: {
        marker: {
            type: Object,
            default: () => { },
            required: false
        },
    },
    setup(props) {
        const { markerDefault, saveMarker, removeMarkerEntry } = useMarkers();
        const markerIdQueryString = computed(() => `[data-uuid="${props.marker.id}"]`)
        const markerIcons = Object.entries(MAKER_ICONS)
        const dragged = ref(false);

        const registerMarkerEvents = () => {
            props.marker.on('dragstart', () => {
                console.log('dragqueen');
                dragged.value = true;
            })
            props.marker.on('dragend', async () => {
                console.log(props.marker);
                const { lat, lng } = props.marker.getLatLng();
                await saveMarker(props.marker.id, {
                    latlng: { lat, lng }
                })
            })
        }

        const unRegisterMarkerEvents = () => {

        }

        onMounted(() => {
            registerMarkerEvents();
        })

        onUnmounted(() => {
            unRegisterMarkerEvents();
        })

        const active = ref(false);
        const toggleActive = () => {
            if (!dragged.value) {
                active.value = !active.value;
            }
            dragged.value = false;
        }

        const target = ref(null)
        onClickOutside(target, () => active.value = false)

        const currentNodeName = ref(props.marker.nodeType); // this will have to some default
        const currentNodeIcon = computed(() => MAKER_ICONS[currentNodeName.value]);

        const changeCurrentNode = (nodeName) => {
            console.log(props.marker);
            currentNodeName.value = nodeName

            saveMarker(props.marker.id, {
                nodeType: nodeName
            })
            
        }

        const isCurrentNode = (nodeName) => currentNodeName.value === nodeName

        const handleRemoveMarker = () => {
            removeMarkerEntry(props.marker)
        }

        return {
            markerIdQueryString,
            markerIcons,
            currentNodeName,
            currentNodeIcon,
            isCurrentNode,
            changeCurrentNode,
            active,
            toggleActive,
            target,
            dragged,
            handleRemoveMarker
        }
    }
})

</script>
<style lang="scss">
@use "sass:math";

.leaflet-div-icon {
    border: none;
    background: none;
}

@mixin square($size: 10px) {
    width: $size;
    height: $size;
}

@mixin debugBorder($color: red) {
    // border: 1px solid $color;
}

$icon-width: 64px;

%marker-border {
    border: 1px solid white;
    border-radius: 50%;
    background-color: #ffffff25;
}

.marker {
    @include debugBorder(blue);
    border-bottom-right-radius: 100%;
    display: inline-grid;
    justify-content: center;
    align-items: center;
    &--active {
        // &:hover {
        $displacement: 55px;
        padding-right: $displacement;
        padding-bottom: $displacement;
        .marker__main {
            @include square($icon-width);
        }
        .marker__option {
            // padding-left: $displacement;
            opacity: 1;
            transform: rotate(calc(var(--r-index) * 45deg))
                translateX(#{$displacement});
            z-index: 1;
            margin-left: math.div($icon-width, 4);
        }
    }
    > * {
        grid-column: 1 / 2;
        grid-row: 1 / 1;
    }
    &-icon {
        @extend %marker-border;
        @include square(math.div($icon-width, 2));
        img {
            filter: drop-shadow(0px 0px 3px #fff);
            // filter: grayscale(.5);
            @include debugBorder(cyan);
            display: block;
            width: 100%;
            height: 100%;
        }
    }
    &__main {
        @extend %marker-border;
        @include square($icon-width);
        // transition-property: width, height;
        // transition-duration: .25s;
        // transition-timing-function: linear;
        // transform: translate(25%, 50%);
        display: flex;
        justify-content: center;
        align-items: center;
        img {
            width: auto;
            height: auto;
            filter: drop-shadow();
        }
    }
    &__options {
        display: inline-grid;
        // justify-content: center;
        align-items: center;
        > * {
            grid-column: 1 / 2;
            grid-row: 1 / 1;
        }
    }
    &__option {
        // border: 1px solid red;
        transform: rotate(calc(var(--r-index) * 45deg));
        transition: transform 0.2s ease-in-out, opacity 0.25s linear;
        transition-delay: calc(10ms + var(--r-index) * 0.05s);
        margin-left: math.div($icon-width, 4);
        z-index: -1;
        opacity: 0;
        &--current {
            .marker--active & {
                pointer-events: none;
                opacity: 0.5;
            }
        }
        > * {
            transform: rotate(calc(var(--r-index) * -45deg));
        }

        &--delete {
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
}
</style>