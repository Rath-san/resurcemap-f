<template lang="">
    <div class="interface">
        <NodeSelector />
    </div>
</template>
<script>
import { defineComponent } from "@vue/runtime-core";
import NodeSelector from './nodeSelector/NodeSelector.vue';


export default defineComponent({
    name: 'UserInterface',
    components: { NodeSelector },
    props: {},
    setup(props) {

        return {
            
        }
    }
})

</script>
<style lang="scss">
</style>