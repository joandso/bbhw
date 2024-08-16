document.addEventListener("DOMContentLoaded", function() {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // Ensure this is set correctly

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
    // Check if the hotelFeatures array has data
    if (window.hotelFeatures.length > 0) {
        console.log('Hotel features:', window.hotelFeatures);

        map.addSource('hotels', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: window.hotelFeatures
            },
            cluster: true,
            clusterMaxZoom: 15, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
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

        // Add unclustered points
        map.addLayer({
            id: 'unclustered-point',
            type: 'symbol',
            source: 'hotels',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': 'custom-marker', // Ensure you have an image or icon here
                'icon-size': 1,
                'text-field': ['get', 'name'],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            }
        });

        // Add popup to unclustered points
        map.on('click', 'unclustered-point', function (e) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const name = e.features[0].properties.name;
            const imageUrl = e.features[0].properties.imageUrl;

            new mapboxgl.Popup({ offset: 45, maxWidth: '320px' })
                .setLngLat(coordinates)
                .setHTML(`
                    <div style="width: 320px; text-align:left; margin: 0; padding: 0; box-sizing: border-box;">
                        <div style="position: relative; width: 100%; padding-top: 66.67%; overflow: hidden; box-sizing: border-box;">
                            <img src="${imageUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block; margin: 0; padding: 0; border: 0;"/>
                        </div>
                        <h3 class="heading-xsmall" style="margin: 15px;">${name}</h3>
                    </div>
                `)
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
    } else {
        console.error('No hotel features found.');
    }
});

