export const LAYER_NAMES = {
  TILES: "tiles",
  MARKERS: "markers",
};

const RENDER_SERVICE_URL = (signature, itemId) =>
  `https://render.guildwars2.com/file/${signature}/${itemId}.png`;

export const ITEM_NAMES = {
    MINING: 'mining',
    LOGGING: 'logging',
    HARVESTING: 'harvesting',
}

const ITEM_IDS = {
  mining: {
    signature: "A89EB66C39C7C006A4A6CBEDA28061F16847E9BC",
    id: "157334",
  },
  logging: {
    signature: "FC01BB452D5327A0E5B2E4A3F5EFDF03F8264A7B",
    id: "157333",
  },
  harvesting: {
    signature: "995534EBE5D26804AE605E205E50539821C0CBCB",
    id: "157332",
  },
};

export const MAKER_ICONS = Object.fromEntries(
  Object.entries(ITEM_IDS).map(([key, value]) => [
    key,
    RENDER_SERVICE_URL(value.signature, value.id),
  ])
);

export const TILE_SERVER =
  // "https://tiles{s}.guildwars2.com/1/1/{z}/{x}/{y}.jpg";
  "http://localhost:4000/public/1/1/{z}/{x}/{y}.jpg";

export const API_URL =
  "https://sheet.best/api/sheets/250dcc3a-5189-470c-800f-b782725fa317";
