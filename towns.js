document.addEventListener("DOMContentLoaded", function() {
  // 1. Assign attributes to lists and sliders
  const lists = document.querySelectorAll('.img-list');
  const sliders = document.querySelectorAll('.slider');

  lists.forEach((list, index) => {
    list.setAttribute('fs-cmsslider-element', 'list-' + (index + 1));
  });

  sliders.forEach((slider, index) => {
    slider.setAttribute('fs-cmsslider-element', 'slider-' + (index + 1));
  });

  // 2. Reusable function to hide elements if empty
  function hideIfEmpty(selector) {
    const element = document.querySelector(selector);
    if (element && element.innerText.includes('No items found.')) {
      element.classList.add('hidden');
    }
  }

  // 3. Hide sections if empty
  hideIfEmpty('#towns');
  hideIfEmpty('#more-hotels');

  // 4. Hide neighbourhoods if no mini-cards
  const neighbourhoodsDiv = document.getElementById('neighbourhoods');
  const miniCards = neighbourhoodsDiv.querySelectorAll('.sl-mini-cards_neighbourhoods-title');
  if (miniCards.length === 0) {
    neighbourhoodsDiv.classList.add('hidden');
  }

  // 5. Hide further reading if empty
  const furtherReading = document.getElementById('further-reading');
  const hasContent = furtherReading.querySelector('.sl-further-reading-list_item:not(:empty)');
  if (!hasContent) {
    furtherReading.classList.add('hidden');
  }

  // 6. Adjust heading size if needed
  const heading = document.querySelector('h1 .heading-huge');
  if (heading && heading.innerText.trim().split(/\s+/).some(word => word.length > 10)) {
    heading.classList.add('smaller');
  }

  // 7. Adjust mini-cards title size if needed
  document.querySelectorAll('.sl-mini-cards_neighbourhoods-title').forEach(element => {
    if (element.textContent.trim().split(/\s+/).some(word => word.length > 10)) {
      element.classList.add('smaller');
    }
  });

  // 8. Move elements if source div has content
  const sourceDiv = document.getElementById('sl-extract-list');
  const hasTextContent = sourceDiv.textContent.trim().length > 0;
  const subSectionElements = document.querySelectorAll('.sl-header-nav_subsections');

  if (!hasTextContent) {
    subSectionElements.forEach(subElement => subElement.classList.add('hide'));
  } else {
    const destinationDiv = document.getElementById('sl-extract-here');
    sourceDiv.querySelectorAll('.sl-header-nav_item').forEach(element => {
      destinationDiv.appendChild(element);
    });
  }

 // 9. Initialize Mapbox map with geocoding and hotel markers
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // Make sure the token is set

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
                    'text-size': 12,
                    'text-anchor': 'center'
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

         // Add native markers
window.hotelFeatures.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    const name = feature.properties.name;
    const imageUrl = feature.properties.imageUrl; // Access the image URL

    // Create the marker
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
