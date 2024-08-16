document.addEventListener("DOMContentLoaded", function() {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // Ensure the token is set

    if (window.hotelFeatures && window.hotelFeatures.length > 0) {
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [window.hotelFeatures[0].geometry.coordinates[0], window.hotelFeatures[0].geometry.coordinates[1]],
            zoom: 10
        });

        // Add zoom and rotation controls to the map
        map.addControl(new mapboxgl.NavigationControl());

        map.on('load', function () {
            map.addSource('hotels', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: window.hotelFeatures
                },
                cluster: true,
                clusterMaxZoom: 15,
                clusterRadius: 50
            });

            // Add cluster layers
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'hotels',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#000000',
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        100,
                        25,
                        750,
                        30
                    ]
                }
            });

            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'hotels',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            // Add unclustered points using Mapbox's native markers
            window.hotelFeatures.forEach(feature => {
                const coordinates = feature.geometry.coordinates;
                const name = feature.properties.name;
                const imageUrl = feature.properties.imageUrl;

                // Create a native marker and add it to the map
                new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 45, maxWidth: '320px' }).setHTML(`
                        <div style="width: 320px; text-align:left; margin: 0; padding: 0; box-sizing: border-box;">
                            <div style="position: relative; width: 100%; padding-top: 66.67%; overflow: hidden; box-sizing: border-box;">
                                <img src="${imageUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block; margin: 0; padding: 0; border: 0;"/>
                            </div>
                            <h3 class="heading-tiny" style="margin: 15px;">${name}</h3>
                        </div>
                    `)) // Add popup with image and name
                    .addTo(map);
            });

            // Zoom into clusters when clicked
            map.on('click', 'clusters', function (e) {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                map.getSource('hotels').getClusterExpansionZoom(clusterId, function (err, zoom) {
                    if (err) return;

                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                });
            });

            // Change the cursor to a pointer when hovering over clusters
            map.on('mouseenter', 'clusters', function () {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'clusters', function () {
                map.getCanvas().style.cursor = '';
            });
        });
    } else {
        console.error('No hotel features found.');
    }
});
