// User interface inputs
var continent_id = Number("1");
var floor_id = 1;
var map_whitelist_strings = "15";
var custom_markers = '';


// -------------------------------------------------------------------------------------------------------------------------------------
// Required to define this if initialising the map after the API calls are complete to avoid reference errors.
var leaflet_map, L, m, markerObj = {}, feature_groups = {}, overlayLayers = {}, layerControls, layerNames;
var wiki_continents, wiki_tile_whitelist;

// Defer loading script until jQuery is ready. Wait 40ms between attempts.
function defer(method) {
    if (window.jQuery) {
        method();
    } else {
        setTimeout(function() { defer(method) }, 40);
    }
}

// Initialisation
defer(function () {
    // Load external CSS
    $('<link>').appendTo('head').attr({type: 'text/css', rel: 'stylesheet', href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css" });

    // Load hardcoded data from [[Widget:Interactive map data builder/output.js]], (var wiki_continents, var wiki_tile_whitelist)
    $.ajaxSetup({ cache: true });
    $.getScript('/index.php?title=Widget:Interactive_map_data_builder/output.js&action=raw&ctype=text/javascript')
    .done(function( data, textStatus, jqxhr ) {
        // Load the main widget script
        worldMap();
    })
    .fail(function( jqxhr, settings, exception ) {
        console.log('Failed to load script', jqxhr, settings, exception);
    });
});

function worldMap() {
    // -------------------------------------------------------------------------------------------------------------------------------------
    // Extensions to leaflet


    // Fullscreen button - https://github.com/Leaflet/Leaflet.fullscreen
    (function(factory){if (typeof window.L === 'undefined'){throw new Error('Leaflet must be loaded first');}factory(window.L);}(function(L){L.Control.Fullscreen=L.Control.extend({options:{position:'topleft',title:{'false':'View Fullscreen','true':'Exit Fullscreen'}},onAdd:function(map){var container=L.DomUtil.create('div','leaflet-control-fullscreen leaflet-bar leaflet-control');this.link=L.DomUtil.create('a','leaflet-control-fullscreen-button leaflet-bar-part',container);this.link.href='#';this._map=map;this._map.on('fullscreenchange',this._toggleTitle,this);this._toggleTitle();L.DomEvent.on(this.link,'click',this._click,this);return container;},_click:function(e){L.DomEvent.stopPropagation(e);L.DomEvent.preventDefault(e);this._map.toggleFullscreen(this.options);},_toggleTitle:function(){this.link.title=this.options.title[this._map.isFullscreen()];}});L.Map.include({isFullscreen:function(){return this._isFullscreen || false;},toggleFullscreen:function(options){var container=this.getContainer();if (this.isFullscreen()){if (document.exitFullscreen){document.exitFullscreen();} else if (document.mozCancelFullScreen){document.mozCancelFullScreen();} else if (document.webkitCancelFullScreen){document.webkitCancelFullScreen();} else if (document.msExitFullscreen){document.msExitFullscreen();}} else {if (container.requestFullscreen){container.requestFullscreen();} else if (container.mozRequestFullScreen){container.mozRequestFullScreen();} else if (container.webkitRequestFullscreen){container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);} else if (container.msRequestFullscreen){container.msRequestFullscreen();}}},_setFullscreen:function(fullscreen){this._isFullscreen=fullscreen;var container=this.getContainer();if (fullscreen){L.DomUtil.addClass(container,'leaflet-fullscreen-on');} else {L.DomUtil.removeClass(container,'leaflet-fullscreen-on');}this.invalidateSize();},_onFullscreenChange:function(e){var fullscreenElement =document.fullscreenElement ||document.mozFullScreenElement ||document.webkitFullscreenElement ||document.msFullscreenElement;if (fullscreenElement === this.getContainer() && !this._isFullscreen){this._setFullscreen(true);this.fire('fullscreenchange');} else if (fullscreenElement !== this.getContainer() && this._isFullscreen){this._setFullscreen(false);this.fire('fullscreenchange');}}});L.Map.mergeOptions({fullscreenControl:false});L.Map.addInitHook(function(){if (this.options.fullscreenControl){this.fullscreenControl=new L.Control.Fullscreen(this.options.fullscreenControl);this.addControl(this.fullscreenControl);}var fullscreenchange;if ('onfullscreenchange' in document){fullscreenchange='fullscreenchange';} else if ('onmozfullscreenchange' in document){fullscreenchange='mozfullscreenchange';} else if ('onwebkitfullscreenchange' in document){fullscreenchange='webkitfullscreenchange';} else if ('onmsfullscreenchange' in document){fullscreenchange='MSFullscreenChange';}if (fullscreenchange){var onFullscreenChange=L.bind(this._onFullscreenChange,this);this.whenReady(function(){L.DomEvent.on(document,fullscreenchange,onFullscreenChange);});this.on('unload',function(){L.DomEvent.off(document,fullscreenchange,onFullscreenChange);});}});L.control.fullscreen=function(options){return new L.Control.Fullscreen(options);};}));

    // Grid debugging
    L.GridLayer.GridDebug = L.GridLayer.extend({
        createTile: function (coords) {
            const tile = document.createElement('div');
            tile.style.outline = '1px solid green';
            tile.style.fontWeight = 'bold';
            tile.style.fontSize = '12px';
            tile.innerHTML = '&nbsp;Tile: Z=' + coords.z + ', X=' + coords.x + ', Y=' + coords.y + '<br>' + '&nbsp;[' + (coords.x)*256*Math.pow(2, leaflet_map.getMaxZoom() - coords.z) + ', ' + (coords.y)*256*Math.pow(2, leaflet_map.getMaxZoom() - coords.z) + ']';
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

    // Custom tiles
    L.TileLayer.WikiTileLayer = L.TileLayer.extend({
        getTileUrl: function(coords) {
            if ( wiki_tile_whitelist[this.options.continent][coords.z].indexOf('X' + coords.x + '_Y' + coords.y) == -1 ) {
                return 'https://wiki.guildwars2.com/images/c/cb/World_map_tile_under_construction.png';
            }

            var file = 'World_map_tile_C' + this.options.continent + '_F' + this.options.floor + '_Z' + coords.z + '_X' + coords.x + '_Y' + coords.y + '.jpg';
            var md5file = md5(file);
            return 'https://wiki.guildwars2.com/images/' + md5file.slice(0,1) + '/' + md5file.slice(0,2) + '/' + file;
        }
    });
    L.tileLayer.wikiTileLayer = function(templateUrl, options) {
        return new L.TileLayer.WikiTileLayer(templateUrl, options);
    }


    // -------------------------------------------------------------------------------------------------------------------------------------
    // Main function


    // Examine whitelist, replacing spaces
    var map_whitelist = [];
    $.map(map_whitelist_strings.split(','), function(w) {
        w = w.trim();
        if (w !== "" && Number(w) > 0) {
            map_whitelist.push(w);
        }
    });

    // Create the leaflet map
    leaflet_map = L.map('map', {
        minZoom: wiki_continents[continent_id].min_zoom,
        maxZoom: wiki_continents[continent_id].max_zoom,
        crs: L.CRS.Simple,
        fadeAnimation: false,
        markerZoomAnimation: false
    });

    // Define the tiles and the bounds (where they stop loading)
    var mapbounds_rect = new L.LatLngBounds(unproject([0, 0]), unproject(wiki_continents[continent_id].continent_dims));
    L.tileLayer.wikiTileLayer(null, {
        minNativeZoom: ( continent_id == 1 ? 2 : 0), // furthest zoomed out folder value
        noWrap: true,
        bounds: mapbounds_rect,
        continent: continent_id,
        floor: floor_id,
        attribution: 'Map data and imagery &copy; <a href="https://www.arena.net/" target="_blank">ArenaNet</a> | Additional imagery <a href="https://blog.thatshaman.com/" target="_blank">that_shaman</a>'
    }).addTo(leaflet_map);

    // Set initial view position and zoom, but only if the whitelist is unset
    if ( map_whitelist.length == 0 ) {
        leaflet_map.fitBounds(mapbounds_rect);
    }


    // -------------------------------------------------------------------------------------------------------------------------------------
    // Enable add-ons


    // DEBUGGING: Add coordinate grid for tiles
    // leaflet_map.addLayer(L.gridLayer.gridDebug({
    //     mapMinNativeZoom: ( continent_id == 1 ? 2 : 0), // pass from parent map
    //     bounds: mapbounds_rect
    // }));

    // Add fullscreen controls
    leaflet_map.addControl(new L.Control.Fullscreen());

    // Bind event functions
    $('.leaflet-bottom.leaflet-left').append('<input id="coordsbox" class="leaflet-control leaflet-control-coords" placeholder="&lt;coords&gt;" readonly="true" size="16"></input>');
    $('#coordsbox').click(function(e) {
        e.stopPropagation();
        this.select();
    });
    leaflet_map.on('click', onMapClick); // return coordinates on click to the console
    leaflet_map.on('zoom', onMapZoom); onMapZoom(); // sets additional CSS at each zoom level. Also driven once.


    // -------------------------------------------------------------------------------------------------------------------------------------
    // Initialise marker panes


    // Note: continent/zone/sectors are first in this list, so that they appear lowest in the z-index stack
    layerNames = {
        continent_rect:     { name: "Continent boundaries", class: "very-low-detail" },
        zone_rect:          { name: "Zone boundaries", class: "very-low-detail" },
        zone_names:         { name: "Zone names", class: "low-detail" },
        sectors:            { name: "Area boundaries", class: "medium-detail" },
        sector_names:       { name: "Area names", class: "medium-detail" },
        tasks:              { name: "Hearts", class: "high-detail" },
        waypoint:           { name: "Waypoints", class: "high-detail" },
        landmark:           { name: "Points of interest", class: "high-detail" },
        points_of_interest: { name: "Landmarks", class: "high-detail" },
        skill_challenges:   { name: "Hero challenges", class: "high-detail" },
        vista:              { name: "Vistas", class: "high-detail" },
        adventures:         { name: "Adventures", class: "high-detail" },
        mastery_points:     { name: "Mastery points", class: "high-detail" },
        jumping_puzzles:    { name: "Jumping puzzles", class: "high-detail" },
        misc:               { name: "Miscellaneous", class: "high-detail" },
        custom:             { name: "Custom markers", class: "low-detail" }
    };

    // Add panes for each set of markers (above the default z-index of 600). Initialise markers object to stash markers in.
    var i = 0;
    $.each(layerNames, function(k, v){
        leaflet_map.createPane(k);
        leaflet_map.getPane(k).className += ' ' + v.class;
        leaflet_map.getPane(k).style.zIndex = (600+i);
        markerObj[k] = [];
        i++;
    });

    // Continent rectangle
    m = L.rectangle([unproject([0, 0]), unproject(wiki_continents[continent_id].continent_dims)], { clickable: false, color: 'rgba(0,0,255,0.8)', fillOpacity: 0, weight: 2, pane: 'continent_rect' })
    markerObj['continent_rect'].push(m);

    // Add markers to feature group, then add feature group as a layer to the map
    $.each(markerObj, function(type, markers){
        feature_groups[type] = L.featureGroup(markers);
        leaflet_map.addLayer(feature_groups[type]); // immediately add to the map (optional)
    });

    // Add marker controls, which require name + featuregroup
    $.each(layerNames, function(k, v) {
        overlayLayers[v.name] = feature_groups[k];
    });
    layerControls = L.control.layers(null, overlayLayers);
    layerControls.addTo(leaflet_map);


    // -------------------------------------------------------------------------------------------------------------------------------------
    // Add markers into the panes


    $.each(wiki_continents[continent_id].maps, function(map_id, map){

        // If whitelist is specified, and the map isn't in the whitelist, skip it.
        if (map_whitelist.length > 0) {
            if (map_whitelist.indexOf(map_id) == -1) {
                return;
            }
        }

        // Zone names
        m = L.marker(unproject([(map.continent_rect[0][0] + map.continent_rect[1][0]) / 2, (map.continent_rect[0][1] + map.continent_rect[1][1]) / 2]), { title: map.name, icon: L.divIcon({ className: 'leaflet-textlabel', html: map.name }), pane: 'zone_names' });
        m.bindPopup( createPopupText('zone_names', map) );
        markerObj['zone_names'].push(m);

        // Zone rectangles
        m = L.rectangle(unproject(map.continent_rect), { clickable: false, color: 'rgba(255,242,0,0.8)', fillOpacity: 0, weight: 2, pane: 'zone_rect' });
        markerObj['zone_rect'].push(m);

        // Sectors
        $.map(map.sectors, function(sector){
            // Sector names
            m = L.marker(unproject(sector.coord), { title: sector.name, icon: L.divIcon({ className: 'leaflet-textlabel', html: sector.name }), pane: 'sector_names' });
            m.bindPopup( createPopupText('sector_names', sector) );
            markerObj['sector_names'].push(m);

            // Sector polygons
            m = L.polygon(unproject(sector.bounds), { clickable: false, color: 'rgba(255,255,255,0.8)', fillOpacity: 0, weight: 3, pane: 'sectors' });
            markerObj['sectors'].push(m);
        });

        // Everything else
        $.map(['tasks', 'waypoint', 'points_of_interest', 'vista', 'landmark', 'mastery_points', 'adventures', 'jumping_puzzles', 'skill_challenges'], function(key){
            $.map(map[key], function(v) {
                m = createMarker(key, v);
                m.bindPopup( createPopupText(key, v) );
                markerObj[key].push(m);
            });
        });
    });
    // Remove old markers (only changed ones) and draw new ones
    updateLayers(['zone_names', 'zone_rect', 'sector_names', 'sectors', 'tasks', 'waypoint', 'points_of_interest', 'vista', 'landmark', 'mastery_points', 'adventures', 'jumping_puzzles', 'skill_challenges']);


    // Add custom markers
    if (custom_markers !== '') {
        var customMarkerText, customMarkerLink;

        // Convert string to JSON
        if (custom_markers[custom_markers.length-1] === ',') {
            custom_markers = custom_markers.substring(0, custom_markers.length-1);
        }
        var customMarkersJSON = JSON.parse('[' + custom_markers + ']');

        // Loop through custom marker JSON
        $.each(customMarkersJSON, function(){
            customMarkerText = (('text' in this) ? this.text : this.name);
            customMarkerText = customMarkerText.replace(/\[{2}([^|]*?)\]{2}/g, '<a href="/wiki/$1" title="$1">$1</a>');
            customMarkerText = customMarkerText.replace(/\[{2}([A-Z0-9\s\(\)\#\:]*?)\|([A-Z0-9\s\(\)\#\:]*?)\]{2}/gi, '<a href="/wiki/$1" title="$2">$2</a>');
            customMarkerText = customMarkerText.replace(/\n/g, '<br>');
            customMarkerText = '<br>' + customMarkerText;

            customMarkerLink = '';
            if ('link' in this) {
                customMarkerLink = '<br><b><a href="' + this.link + '" style="font-size:200%;">↑</a></b>';
            } else if ( !('text' in this) && ('id' in this) ) {
                customMarkerLink = '<br><b><a href="#' + this.id + '" style="font-size:200%;">↑</a></b>';
            }

            switch ( ('type' in this ? this.type : 'marker') ) {
                case 'rect':
                    m = L.rectangle(unproject(this.coord), {
                        color: ('color' in this ? this.color : 'rgba(0,205,0,0.8)'),
                        weight: ('weight' in this ? this.weight : 5 ),
                        fillOpacity: 0,
                        clickable: false,
                        pane: 'custom'
                    });
                    break;
                    
                case 'line':
                    m = L.polyline(unproject(this.coord), {
                        color: ('color' in this ? this.color : 'rgba(0,205,0,0.8)'),
                        weight: ('weight' in this ? this.weight : 5 ),
                        fillOpacity: 0,
                        pane: 'custom'
                    })
                    break;
                    
                case 'poly':
                    m = L.polygon(unproject(this.coord), {
                        color: ('color' in this ? this.color : 'rgba(0,205,0,0.8)'),
                        weight: ('weight' in this ? this.weight : 5 ),
                        fillOpacity: 0,
                        clickable: false,
                        pane: 'custom'
                    });
                    break;
                    
                case 'marker':
                default:
                    m = L.marker(unproject(this.coord), {
                        title: (('id' in this) ? this.name + ' (' + this.id + ')' : this.name),
                        icon: L.icon({ iconUrl: ('icon' in this ? ('/wiki/Special:Filepath/' + this.icon) : '/images/9/9e/Personal_waypoint_blue_(map_icon).png'), iconSize: [32, 32], popupAnchor: [0, -16] }),
                        pane: 'custom'
                    });
            }
            
            m.bindPopup('<b>' + (('id' in this) ? this.name + ' (' + this.id + ')' : this.name) + '</b>' + customMarkerText + customMarkerLink)
            markerObj['custom'].push(m);
        });
        updateLayers(['custom']);
    }

    // Finally set view if whitelist was set.
    if ( map_whitelist.length > 0 ) {
        leaflet_map.fitBounds(feature_groups['zone_rect'].getBounds() );
    }


    // -------------------------------------------------------------------------------------------------------------------------------------
    // Helper functions


    function unproject(coord) {
        if (coord[0].length > 0) {
            return $.map( coord, function(v) { return leaflet_map.unproject(v, leaflet_map.getMaxZoom()) })
        } else {
            return leaflet_map.unproject(coord, leaflet_map.getMaxZoom());
        }
    }

    function updateLayers(layer_array) {
        $.each(layer_array, function(i, type){
            // Remove old
            leaflet_map.removeLayer(feature_groups[type]);
            layerControls.removeLayer(feature_groups[type]);

            // Replace layer variable content with latest floor and continent
            feature_groups[type] = L.featureGroup(markerObj[type]);

            // Push to map
            leaflet_map.addLayer(feature_groups[type]);
            layerControls.addOverlay(feature_groups[type], layerNames[type].name);
        });
    }

    function createMarker(key, v) {
        switch (key) {
            case 'tasks':
            case 'waypoint':
            case 'points_of_interest':
            case 'vista':
            case 'landmark':
            case 'mastery_points':
            case 'adventures':
            case 'jumping_puzzles':
            case 'skill_challenges':
                return L.marker(unproject(v.coord), { title: v.name, icon: createIcon(key, v), pane: key });
                break;
            default:
                return L.marker(unproject(v.coord), { title: v.name, icon: L.divIcon({ className: 'leaflet-textlabel', html: v.name, popupAnchor: [0, -16] }), pane: 'misc' });
        }
    }

    function createIcon(key, v) {
        var iconUrl = 'https://wiki.guildwars2.com/images/9/9e/Personal_waypoint_blue_(map_icon).png', iconSize = [32, 32];
        switch (key) {
            case 'tasks':            iconUrl = 'https://wiki.guildwars2.com/images/6/6e/Renown_Heart_(map_icon).png'; break;
            case 'waypoint':         iconUrl = 'https://wiki.guildwars2.com/images/d/d2/Waypoint_(map_icon).png'; break;
            case 'landmark':         iconUrl = 'https://wiki.guildwars2.com/images/a/a8/Point_of_Interest_(map_icon).png'; break;
            case 'vista':            iconUrl = 'https://wiki.guildwars2.com/images/f/ff/Vista_(map_icon).png'; break;
            case 'adventures':       iconUrl = 'https://wiki.guildwars2.com/images/1/13/Adventure_(map_icon).png'; break;
            case 'custom':           iconUrl = 'https://wiki.guildwars2.com/images/9/9e/Personal_waypoint_blue_(map_icon).png'; break;
            case 'jumping_puzzles':  iconUrl = 'https://wiki.guildwars2.com/images/e/e8/Jumping_puzzle_(map_icon).png'; iconSize = [20, 20]; break;
            case 'skill_challenges':
                switch (v.region) {
                    case 'Core':     iconUrl = 'https://wiki.guildwars2.com/images/6/66/Hero_Challenge_(map_icon).png'; break;
                    default:         iconUrl = 'https://wiki.guildwars2.com/images/8/81/Hero_Challenge_(Heart_of_Thorns_map_icon).png'; break;
                }
                break;
            case 'mastery_points':
                switch (v.region) {
                    case 'Tyria':    iconUrl = 'https://wiki.guildwars2.com/images/3/32/Mastery_insight_(Central_Tyria)_(map_icon).png'; break;
                    case 'Maguuma':  iconUrl = 'https://wiki.guildwars2.com/images/4/45/Mastery_insight_(Heart_of_Thorns)_(map_icon).png'; break;
                    case 'Desert':   iconUrl = 'https://wiki.guildwars2.com/images/9/9e/Mastery_insight_(Path_of_Fire)_(map_icon).png'; break;
                    case 'Tundra':   iconUrl = 'https://wiki.guildwars2.com/images/d/df/Mastery_insight_(Icebrood_Saga)_(map_icon).png'; break;
                    case 'Unknown':  iconUrl = 'https://wiki.guildwars2.com/images/5/5d/Mastery_insight_(End_of_Dragons)_(map_icon).png'; break;
                }
                break;
            default:
                if ('icon' in v) {
                    iconUrl = v['icon'];
                }
                break;
        }
        return L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            popupAnchor: [ 0, -1*iconSize[0]/2 ]
        });
    }

    function createPopupText(key, v) {
        switch (key) {
            case 'sector_names':       return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a><br>Area<br>ID: ' + v.id; break;
            case 'zone_names':         return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a><br>Zone<br>ID: ' + v.id; break;
            case 'tasks':              return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a> (' + v.level + ')<br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'waypoint':           return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a><br>Waypoint<br><input class="mapchatlink" title="'+v.id+'" data-id="'+v.id+'" type="text" value="' + v.chat_link + '" readonly="readonly" onclick="this.select();return false;"/><br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'landmark':           return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a><br>Point of Interest<br><input class="mapchatlink" title="'+v.id+'" data-id="'+v.id+'" type="text" value="' + v.chat_link + '" readonly="readonly" onclick="this.select();return false;"/><br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'vista':              return '<u>' + ('name' in v ? v.name : 'Unnamed vista') + '</u><br>Vista #' + v.id +'<br><input class="mapchatlink" title="'+v.id+'" data-id="'+v.id+'" type="text" value="' + v.chat_link + '" readonly="readonly" onclick="this.select();return false;"/><br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'mastery_points':     return ('name' in v ? ('<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a>') : '<i>Unnamed mastery insight</i>' ) + '<br>Mastery insight<br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'adventures':         return '<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name + '</a><br>Adventure' + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'jumping_puzzles':    return '<a href="/wiki/' + encodeURIComponent( ('link' in v ? v.link : v.name) ) + '" target="_blank">' + v.name + '</a><br>Jumping puzzle' + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'skill_challenges':   return ('name' in v ? ('<a href="/wiki/' + encodeURIComponent(v.name) + '" target="_blank">' + v.name.replace(/ \((.*?)\)/,'') + '</a>') : '<i>Unnamed hero challenge</i>' ) + '<br>Hero challenge<br>ID: ' + v.id + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
            case 'points_of_interest': return '<u>' + v.name + '</u><br>Miscellaneous landmark<br>' + ('type' in v ? v.type : '') + '<br>[' + v.coord[0] + ', ' + v.coord[1] + ']'; break;
        }
    }

    function onMapClick(e) {
        var s = '[' + Math.round( 100 * leaflet_map.project(e.latlng, leaflet_map.getMaxZoom()).x )/100 + ', ' + Math.round( 100 * leaflet_map.project(e.latlng, leaflet_map.getMaxZoom()).y )/100 + ']';
        $('#coordsbox').val(s);
        console.log('You clicked the map at ', s);
    }

    function onMapZoom() {
        $('#map').removeClass('zoom0 zoom1 zoom2 zoom3 zoom4 zoom5 zoom6 zoom7 zoom8');
        var z = leaflet_map.getZoom() + (8 - leaflet_map.getMaxZoom() );
        $('#map').addClass('zoom' + z);
    }
}

// MD5 function
function md5cycle(x, k) { var a = x[0], b = x[1], c = x[2], d = x[3]; a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17,  606105819); b = ff(b, c, d, a, k[3], 22, -1044525330); a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12,  1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983); a = ff(a, b, c, d, k[8], 7,  1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162); a = ff(a, b, c, d, k[12], 7,  1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22,  1236535329); a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14,  643717713); b = gg(b, c, d, a, k[0], 20, -373897302); a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9,  38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848); a = gg(a, b, c, d, k[9], 5,  568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20,  1163531501); a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14,  1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734); a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16,  1839030562); b = hh(b, c, d, a, k[14], 23, -35309556); a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11,  1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640); a = hh(a, b, c, d, k[13], 4,  681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23,  76029189); a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16,  530742520); b = hh(b, c, d, a, k[2], 23, -995338651); a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10,  1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055); a = ii(a, b, c, d, k[12], 6,  1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799); a = ii(a, b, c, d, k[8], 6,  1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21,  1309151649); a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15,  718787259); b = ii(b, c, d, a, k[9], 21, -343485551); x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]); }
function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
function md51(s) { var txt = ''; var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i; for (i=64; i<=s.length; i+=64) { md5cycle(state, md5blk(s.substring(i-64, i))); } s = s.substring(i-64); var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]; for (i=0; i<s.length; i++) tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3); tail[i>>2] |= 0x80 << ((i%4) << 3); if (i > 55) { md5cycle(state, tail); for (i=0; i<16; i++) tail[i] = 0; } tail[14] = n*8; md5cycle(state, tail); return state; }
function md5blk(s) { var md5blks = [], i; for (i=0; i<64; i+=4) { md5blks[i>>2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24); } return md5blks; }
var hex_chr = '0123456789abcdef'.split('');
function rhex(n) { var s='', j=0; for(; j<4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]; return s; }
function hex(x) { for (var i=0; i<x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
function md5(s) { return hex(md51(s)); }
function add32(a, b) { return (a + b) & 0xFFFFFFFF; } if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') { function add32(x, y) { var lsw = (x & 0xFFFF) + (y & 0xFFFF), msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); } }
