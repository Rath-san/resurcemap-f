import L from 'leaflet';
import { ref, reactive, toRefs, watch } from 'vue';
import db from '../../services/db';
import { useMap } from './useMap';
import { ITEM_NAMES } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

const markerDB = db('markers');
const { markerLayer } = useMap();

const markerDefaultEvents = [
  {
    name: 'click',
    cb: (event) => {
      event.originalEvent.stopPropagation();
    },
  },
  {
    name: 'move',
    cb: (event) => {
      // console.log(event);
    },
  },
];

const createNodeIcon = (id) => {
  const iconSize = 32; // image size (projected)

  return L.divIcon({
    html: `<div data-uuid=${id} class="icon"></div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize, iconSize],
  });
};

const state = reactive({
  markers: [],
  markerDefault: 'mining',
});

const setActiveNodeType = (newNodeType) => {
    state.markerDefault = newNodeType;
}

const initializeMarkers = async () => {
  try {
    const entries = await markerDB.get();

    if (entries.length) {
      entries.forEach(entry => {
        createMarker(entry);
      })
    }
  } catch (error) {
    console.log(error);
  }
};

initializeMarkers();

const createMarker = ({
  id,
  latlng: { lat, lng },
  name,
  title,
  nodeType,
  events,
}) => {
  const newMarker = L.marker([lat, lng], {
    draggable: true,
    title,
    icon: createNodeIcon(id),
  });

  newMarker.id = id;
  newMarker.name = name;
  newMarker.nodeType = nodeType;

  if (events?.length) {
    events.forEach((event) => {
      newMarker.on(event.name, event.cb);
    });
  }

  addMarkerToMap(newMarker);
  updateMarkers();

  return newMarker;
};

const saveMarker = async (id, markerData) => {
  await markerDB.createOrUpdate(id, markerData);
};

const addMarker = async (event) => {
  const newMarker = await createMarker({
    id: uuidv4(),
    latlng: event.latlng,
    name: state.markerDefault,
    nodeType: state.markerDefault, // this should be selected by user
    events: markerDefaultEvents,
    title: state.markerDefault,
  });

  // newMarker.getLatLng

  await saveMarker(newMarker.id, {
    latlng: event.latlng,
    name: newMarker.name,
    nodeType: newMarker.nodeType,
    title: newMarker.options.title
  });
};

const removeMarkerEntry = async (marker) => {
    marker.remove()
    await markerDB.remove(marker.id);

    return {

    }
}

const addMarkerToMap = (marker) => {
  markerLayer.value.addLayer(marker);
};

const updateMarkers = () => {
  state.markers = [...markerLayer.value.getLayers()];
};

export const useMarkers = () => {
  return {
    ...toRefs(state),
    createMarker,
    addMarker,
    updateMarkers,
    saveMarker,
    removeMarkerEntry,
    setActiveNodeType
  };
};
