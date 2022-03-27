<template>
    <!-- <HelloWorld msg="Hello Vue 3 + Vite" /> -->
    <MapContainer />
    <MarkersContainer />
    <UserInterface/>
</template>

<script>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { defineComponent } from 'vue';
// import HelloWorld from './components/HelloWorld.vue'
import MapContainer from './components/map/Map.vue';
import MarkersContainer from './components/marker/Markers.vue';
import UserInterface from './components/interface/UserInterface.vue';
import db from './services/db';

export default defineComponent({
    name: "App",
    components: { MapContainer, MarkersContainer, UserInterface },
    setup(props) {
        // const db = db('markers');
        // console.log(db);
        return {
            
        }
    },
})

</script>

<style lang="scss">
// #app {
//   font-family: Avenir, Helvetica, Arial, sans-serif;
//   -webkit-font-smoothing: antialiased;
//   -moz-osx-font-smoothing: grayscale;
//   text-align: center;
//   color: #2c3e50;
//   margin-top: 60px;
// }
</style>
