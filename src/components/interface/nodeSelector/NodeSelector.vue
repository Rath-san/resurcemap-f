<template lang="">
    <div class="node-selector">
        <!-- <div class="node-selector__container">
            <div v-for="(markerIcon, index) in markerIcons" :key="index"
                @click.stop="handleChangeCurrent(markerIcon[0])"
                :class="['node-selector__node', {'node-selector__node--current' : isCurrentNode(markerIcon[0])}]"
            >
                <img :src="markerIcon[1]" :alt="markerIcon[0]">
            </div>
        </div> -->

    </div>
</template>
<script>
import { defineComponent } from "@vue/runtime-core";
import { MAKER_ICONS } from "../../../constants";
import { useMarkers } from "../../map/useMarkers";

export default defineComponent({
    name: 'NodeSelector',
    components: {},
    props: {},
    setup(props) {
        const { markerDefault } = useMarkers();
        const markerIcons = Object.entries(MAKER_ICONS)

        const isCurrentNode = (nodeName) => markerDefault.value === nodeName;

        const handleChangeCurrent = (newNode) => {
            markerDefault.value = newNode
        }

        return {
            markerDefault,
            markerIcons,
            isCurrentNode,
            handleChangeCurrent
        }
    }
})

</script>
<style lang="scss">
@mixin debug-border($color) {
    // border: 1px solid $color;
}

// @mixin inset-shadow($x: 0, $y: 0) {
//     box-shadow:
//         inset $x $y 0px 100px #000,
//         $x $y 80px 80px #000;
// }

.node-selector {
    @include debug-border(red);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    // background: radial-gradient(
    //         circle at 50% 50%,
    //         rgba(255, 0, 0, 1),
    //         rgba(255, 0, 0, 0) 100%
    //     );
    // background-repeat: no-repeat;
    // background-position: 50% 10px;

    &__container {
        @include debug-border(blue);
        display: flex;
        // background-color: #000;
        position: relative;
        &::after {
            content: "";
            background: #00000075;
            position: absolute;
            top: -40px;
            left: -200px;
            right: -200px;
            height: 510px;
            border-radius: 50%;
            z-index: -1;
            filter: blur(50px);
        }
    }

    &__node {
        @include debug-border(green);
        padding: 0.4rem 0.5rem;
        margin: 1rem;
        cursor: pointer;
        opacity: 0.5;

        img {
            // filter: drop-shadow(0px 0px 10px #fff);
        }

        &--current {
            opacity: 1;
            img {
                filter: drop-shadow(0px 0px 10px #fff);
            }
        }
    }
}
</style>