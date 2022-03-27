import L from 'leaflet';

export const unproject = (coord, map) => {
  return map.unproject(coord, map.getMaxZoom());
};

export const project = (coord, map) => {
  return map.project(coord, map.getMaxZoom());
};

export const createNodeIcon = (id) => {
  const iconSize = 32; // image size (projected)

  return L.divIcon({
    html: `<div data-uuid=${id} class="icon"></div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize, iconSize],
  });
};
