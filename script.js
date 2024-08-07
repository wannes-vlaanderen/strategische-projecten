'use strict';

// eslint-disable-next-line no-unused-vars
const config = {
  style: 'mapbox://styles/gop-vlaanderen/clkqz05n100e401phciza5ejc',
  accessToken: 'pk.eyJ1IjoiZ29wLXZsYWFuZGVyZW4iLCJhIjoiY2xrbWUxd3JxMDUzMTNmcXM5b3BmZzlpbiJ9.aBM2HJPp13PlB0uCFexfYg',
  CSV: 'https://docs.google.com/spreadsheets/d/1xnmhFr06KQbsbaKeSnYWRqXK9qQ0u6ijO1nIw86f168/gviz/tq?tqx=out:csv&sheet=Sheet1',
  center: [4.255829,51.052618],
  zoom: 7.25,
  title: 'Strategische projecten Vlaanderen',
  description:
    'Overzicht van de strategische projecten.',
  sideBarInfo: ['HuidigeTitel',''],
  popupInfo: ['HuidigeTitel'],
  popupInfo2: ['Link'],
  popupInfo3: ['Description'],
  filters: [
    {
      type: 'checkbox', 
      title: 'Status:',
      columnHeader: '_Status',
      listItems: [
        'Afgerond',
        'Lopend',
        'Voortijdig stopgezet'
      ],
    },
    {
      type: 'dropdown',
      title: 'Provincie',
      columnHeader: 'Provincie', // Case sensitive - must match spreadsheet entry
      listItems: [
        'West-Vlaanderen',
        'Oost-Vlaanderen',
        'Antwerpen',
        'Limburg',
        'Vlaams-Brabant'
      ], // Case sensitive - must match spreadsheet entry; This will take up to six inputs but is best used with a maximum of three;
    },
  ],
};

const lopend = ['periode13-15','periode10-12-lopend']
const afgerond = ['periode1-3','periode4-6','periode7-9','periode10-12-afgelopen']
const voortijdigStopgezet = ['periode10-12-voortijdig-stopg']
const allLayers = [].concat(lopend).concat(afgerond).concat(voortijdigStopgezet)
const hoverLayers = []
allLayers.forEach(id => {
  hoverLayers.push(id + "-hover")
})
const featuredLayers = []


/* global config csv2geojson turf Assembly $ */
'use strict';

mapboxgl.accessToken = config.accessToken;
const columnHeaders = config.sideBarInfo;

let geojsonData = {};
const filteredGeojson = {
  type: 'FeatureCollection',
  features: [],
};

const map = new mapboxgl.Map({
  container: 'map',
  style: config.style,
  center: config.center,
  zoom: config.zoom,
  transformRequest: transformRequest,
  attributionControl: false
});

function flyToLocation(currentFeature, zoom) {
  map.flyTo({
    center: currentFeature,
    zoom: zoom,
  });
  while (featuredLayers.length != 0) {
    var layer = featuredLayers.pop()
    map.getSource(layer).setData({
      type: 'FeatureCollection', features: []
    })
  }
}

function createPopup(currentFeature) {
  const popups = document.getElementsByClassName('mapboxgl-popup');
  /** Check if there is already a popup on the map and if so, remove it */
  if (popups[0]) popups[0].remove();
  new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(
  '<h3><strong>' +
    currentFeature.properties[config.popupInfo] +
    '</h3></strong>' + '<br>' + '<h3>' +
    currentFeature.properties[config.popupInfo3] +
    '</h3>' + '<br>' + '<h3>' +
    '<p><a href="' +
    currentFeature.properties[config.popupInfo2] +
    '" target="_blank">Meer info</a></p>' + '</h3>'
  ).addTo(map);
}

function buildLocationList(locationData) {
  /* Add a new listing section to the sidebar. */
  const listings = document.getElementById('listings');
  listings.innerHTML = '';
  locationData.features.forEach((location, i) => {
    const prop = location.properties;

    const listing = listings.appendChild(document.createElement('div'));
    /* Assign a unique `id` to the listing. */
    listing.id = 'listing-' + prop.id;

    /* Assign the `item` class to each listing for styling. */
    listing.className = 'item';

    /* Add the link to the individual listing created above. */
    const link = listing.appendChild(document.createElement('button'));
    link.className = 'title';
    link.id = 'link-' + prop.id;
    link.innerHTML =
      '<p style="line-height: 1.25">' + prop[columnHeaders[0]] + '</p>';

    /* Add details to the individual listing. */
    const details = listing.appendChild(document.createElement('div'));
    details.className = 'content';

    for (let i = 1; i < columnHeaders.length; i++) {
      const div = document.createElement('div');
      div.innerText += prop[columnHeaders[i]];
      div.className;
      details.appendChild(div);
    }

    link.addEventListener('click', function () {
      const clickedListing = location.geometry.coordinates;
      const zoom = location.properties.Zoom;
      flyToLocation(clickedListing, zoom);
      createPopup(location);

      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.classList.add('active');

      const divList = document.querySelectorAll('.content');
      const divCount = divList.length;
      for (i = 0; i < divCount; i++) {
        divList[i].style.maxHeight = null;
      }

      for (let i = 0; i < geojsonData.features.length; i++) {
        this.parentNode.classList.remove('active');
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });
}

// Build dropdown list function
// title - the name or 'category' of the selection e.g. 'Languages: '
// defaultValue - the default option for the dropdown list
// listItems - the array of filter items

function buildDropDownList(title, listItems) {
  const filtersDiv = document.getElementById('filters');
  const mainDiv = document.createElement('div');
  const filterTitle = document.createElement('h3');
  filterTitle.innerText = title;
  filterTitle.classList.add('py12', 'txt-bold');
  mainDiv.appendChild(filterTitle);

  const selectContainer = document.createElement('div');
  selectContainer.classList.add('select-container', 'center');

  const dropDown = document.createElement('select');
  dropDown.classList.add('select', 'filter-option');

  const selectArrow = document.createElement('div');
  selectArrow.classList.add('select-arrow');

  const firstOption = document.createElement('option');

  dropDown.appendChild(firstOption);
  selectContainer.appendChild(dropDown);
  selectContainer.appendChild(selectArrow);
  mainDiv.appendChild(selectContainer);

  for (let i = 0; i < listItems.length; i++) {
    const opt = listItems[i];
    const el1 = document.createElement('option');
    el1.textContent = opt;
    el1.value = opt;
    dropDown.appendChild(el1);
  }
  filtersDiv.appendChild(mainDiv);
}

// Build checkbox function
// title - the name or 'category' of the selection e.g. 'Languages: '
// listItems - the array of filter items
// To DO: Clean up code - for every third checkbox, create a div and append new checkboxes to it

function buildCheckbox(title, listItems) {
  const filtersDiv = document.getElementById('filters');
  const mainDiv = document.createElement('div');
  const filterTitle = document.createElement('div');
  const formatcontainer = document.createElement('div');
  filterTitle.classList.add('center', 'flex-parent', 'py12', 'txt-bold');
  formatcontainer.classList.add(
    'center',
    'flex-parent',
    'flex-parent--column',
    'px3',
    'flex-parent--space-between-main',
  );
  const secondLine = document.createElement('div');
  secondLine.classList.add(
    'center',
    'flex-parent',
    'py12',
    'px3',
    'flex-parent--space-between-main',
  );
  filterTitle.innerText = title;
  mainDiv.appendChild(filterTitle);
  mainDiv.appendChild(formatcontainer);

  for (let i = 0; i < listItems.length; i++) {
    const container = document.createElement('label');

    container.classList.add('checkbox-container');

    const input = document.createElement('input');
    input.classList.add('px12', 'filter-option');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', listItems[i]);
    input.setAttribute('value', listItems[i]);

    const checkboxDiv = document.createElement('div');
    const inputValue = document.createElement('p');
    inputValue.innerText = listItems[i];
    checkboxDiv.classList.add('checkbox', 'mr6');
    checkboxDiv.appendChild(Assembly.createIcon('check'));

    container.appendChild(input);
    container.appendChild(checkboxDiv);
    container.appendChild(inputValue);

    formatcontainer.appendChild(container);
  }
  filtersDiv.appendChild(mainDiv);
}

const selectFilters = [];
const checkboxFilters = [];

function createFilterObject(filterSettings) {
  filterSettings.forEach((filter) => {
    if (filter.type === 'checkbox') {
      const keyValues = {};
      Object.assign(keyValues, {
        header: filter.columnHeader,
        value: filter.listItems,
      });
      checkboxFilters.push(keyValues);
    }
    if (filter.type === 'dropdown') {
      const keyValues = {};
      Object.assign(keyValues, {
        header: filter.columnHeader,
        value: filter.listItems,
      });
      selectFilters.push(keyValues);
    }
  });
}
function onFilterChange(filterForm) {
  const filterOptionHTML = filterForm.getElementsByClassName('filter-option');
  const filterOption = [].slice.call(filterOptionHTML);

  const geojSelectFilters = [];
  const geojCheckboxFilters = [];

  filteredGeojson.features = [];
  // const filteredFeatures = [];
  // filteredGeojson.features = [];
  var statusFilters = []
  filterOption.forEach((filter) => {
    if (filter.type === 'checkbox' && filter.checked) {
      checkboxFilters.forEach((objs) => {
        Object.entries(objs).forEach(([, value]) => {
          if (value.includes(filter.value)) {
            const geojFilter = [objs.header, filter.value];
            geojCheckboxFilters.push(geojFilter);
          }
          if (value == '_Status') {
            statusFilters.push(filter.value)
          }
        });
      });
    }
    if (statusFilters.includes("Lopend")) {
      lopend.forEach((id, i) => {
        map.setLayoutProperty(id, 'visibility', 'visible')
      })
    } else {
      lopend.forEach((id, i) => {
        map.setLayoutProperty(id, 'visibility', 'none')
      })
    }
    if (statusFilters.includes("Afgerond")) {
      afgerond.forEach((id, i) => {
        map.setLayoutProperty(id, 'visibility', 'visible')
      })
    } else {
      afgerond.forEach((id) => {
        map.setLayoutProperty(id, 'visibility', 'none')
      })
    }
    if (statusFilters.includes("Voortijdig Stopgezet")) {
      voortijdigStopgezet.forEach((id) => {
        map.setLayoutProperty(id, 'visibility', 'visible')
      })
    } else {
      voortijdigStopgezet.forEach((id) => {
        map.setLayoutProperty(id, 'visibility', 'none')
      })
    }
    if (filter.type === 'select-one' && filter.value) {
      selectFilters.forEach((objs) => {
        Object.entries(objs).forEach(([, value]) => {
          if (value.includes(filter.value)) {
            const geojFilter = [objs.header, filter.value];
            geojSelectFilters.push(geojFilter);
          }
        });
      });
    }
  });
  if (geojCheckboxFilters.length === 0) {
    allLayers.forEach((id, i) => {
      map.setLayoutProperty(id, 'visibility', 'visible')
    })
  }

  if (geojCheckboxFilters.length === 0 && geojSelectFilters.length === 0) {
    geojsonData.features.forEach((feature) => {
      filteredGeojson.features.push(feature);
    });
  } else if (geojCheckboxFilters.length > 0) {
    geojCheckboxFilters.forEach((filter) => {
      geojsonData.features.forEach((feature) => {
        if (feature.properties[filter[0]].includes(filter[1])) {
          if (
            filteredGeojson.features.filter(
              (f) => f.properties.id === feature.properties.id,
            ).length === 0
          ) {
            filteredGeojson.features.push(feature);
          }
        }
      });
    });
    if (geojSelectFilters.length > 0) {
      const removeIds = [];
      filteredGeojson.features.forEach((feature) => {
        let selected = true;
        geojSelectFilters.forEach((filter) => {
          if (
            feature.properties[filter[0]].indexOf(filter[1]) < 0 &&
            selected === true
          ) {
            selected = false;
            removeIds.push(feature.properties.id);
          } else if (selected === false) {
            removeIds.push(feature.properties.id);
          }
        });
      });
      let uniqueRemoveIds = [...new Set(removeIds)];
      uniqueRemoveIds.forEach(function (id) {
        const idx = filteredGeojson.features.findIndex(
          (f) => f.properties.id === id,
        );
        filteredGeojson.features.splice(idx, 1);
      });
    }
  } else {
    geojsonData.features.forEach((feature) => {
      let selected = true;
      geojSelectFilters.forEach((filter) => {
        if (
          !feature.properties[filter[0]].includes(filter[1]) &&
          selected === true
        ) {
          selected = false;
        }
      });
      if (
        selected === true &&
        filteredGeojson.features.filter(
          (f) => f.properties.id === feature.properties.id,
        ).length === 0
      ) {
        filteredGeojson.features.push(feature);
      }
    });
  }

  map.getSource('locationData').setData(filteredGeojson);
  buildLocationList(filteredGeojson);
};

function applyFilters() {
  const filterForm = document.getElementById('filters');

  
  filterForm.addEventListener('change', () => {
    onFilterChange(filterForm)
  });
}

function filters(filterSettings) {
  filterSettings.forEach((filter) => {
    if (filter.type === 'checkbox') {
      buildCheckbox(filter.title, filter.listItems);
    } else if (filter.type === 'dropdown') {
      buildDropDownList(filter.title, filter.listItems);
    }
  });
}

function removeFilters() {
  const input = document.getElementsByTagName('input');
  const select = document.getElementsByTagName('select');
  const selectOption = [].slice.call(select);
  const checkboxOption = [].slice.call(input);
  filteredGeojson.features = [];
  checkboxOption.forEach((checkbox) => {
    if (checkbox.type === 'checkbox') {
      checkbox.checked = checkbox.defaultChecked;
    }
  });

  selectOption.forEach((option) => {
    option.selectedIndex = 0;
  });
  
  const filterForm = document.getElementById('filters')

  map.getSource('locationData').setData(geojsonData);
  buildLocationList(geojsonData);
  onFilterChange(filterForm)
}

function removeFiltersButton() {
  const removeFilter = document.getElementById('removeFilters');
  removeFilter.addEventListener('click', () => {
    removeFilters();
  });
}

createFilterObject(config.filters);
applyFilters();
filters(config.filters);
removeFiltersButton();

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: true, // Use the geocoder's default marker style
  zoom: 11,
});

function sortByDistance(selectedPoint) {
  const options = { units: 'miles' };
  let data;
  if (filteredGeojson.features.length > 0) {
    data = filteredGeojson;
  } else {
    data = geojsonData;
  }
  data.features.forEach((data) => {
    Object.defineProperty(data.properties, 'distance', {
      value: turf.distance(selectedPoint, data.geometry, options),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  });

  data.features.sort((a, b) => {
    if (a.properties.distance > b.properties.distance) {
      return 1;
    }
    if (a.properties.distance < b.properties.distance) {
      return -1;
    }
    return 0; // a must be equal to b
  });
  const listings = document.getElementById('listings');
  while (listings.firstChild) {
    listings.removeChild(listings.firstChild);
  }
  buildLocationList(data);
}

geocoder.on('result', (ev) => {
  const searchResult = ev.result.geometry;
  sortByDistance(searchResult);
});

map.on('load', () => {
  map.addControl(geocoder, 'top-right');
  map.removeControl(geocoder);
  const filterForm = document.getElementById("filters")
  const filterOptionHTML = filterForm.getElementsByClassName('filter-option');
  filterOptionHTML[1].defaultChecked = true;
  allLayers.forEach((id) => {
    map.addSource(id, {
      type: 'geojson', data: {
        type: 'FeatureCollection', features: []
      }
    })
    map.addLayer({
      id: id + '-hover',
      type: 'fill',
      source: id,
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': 1
      }
    })
  })
  
  
  afgerond.forEach( (id, i) => {
    map.setLayoutProperty(id, 'visibility', 'none')
  })

  // csv2geojson - following the Sheet Mapper tutorial https://www.mapbox.com/impact-tools/sheet-mapper
  console.log('loaded');
  $(document).ready(() => {
    console.log('ready');
    $.ajax({
      type: 'GET',
      url: config.CSV,
      dataType: 'text',
      success: function (csvData) {
        makeGeoJSON(csvData);
        const filterForm = document.getElementById("filters");
        onFilterChange(filterForm)
      },
      error: function (request, status, error) {
        console.log(request);
        console.log(status);
        console.log(error);
      },
    });
  });

  function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(
      csvData,
      {
        latfield: 'Latitude',
        lonfield: 'Longitude',
        delimiter: ',',
      },
      (err, data) => {
        data.features.forEach((data, i) => {
          data.properties.id = i;
        });

        geojsonData = data;
        // Add the the layer to the map
        map.addLayer({
          id: 'locationData',
          type: 'circle',
          source: {
            type: 'geojson',
            data: geojsonData,
          },
          paint: {
            'circle-radius': 5, // size of circles
            'circle-color': '#90884c', // color of circles
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 0.7,
          },
        });
      },
    );

    map.on('click', 'locationData', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['locationData'],
      });
      const clickedPoint = features[0].geometry.coordinates;
      const zoom = features[0].properties.Zoom
      flyToLocation(clickedPoint, zoom);
      sortByDistance(clickedPoint);
      createPopup(features[0]);
    });

    map.on('mouseenter', 'locationData', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'locationData', () => {
      map.getCanvas().style.cursor = '';
    });
    buildLocationList(geojsonData);
    
    map.on('mousemove', (mouse) => {
      const popups = document.getElementsByClassName('mapboxgl-popup');
      if (popups[0]) {return}
      var candidates = []
      var features = map.queryRenderedFeatures(mouse.point);
      while (featuredLayers.length != 0) {
        var layer = featuredLayers.pop()
        map.getSource(layer).setData({
          type: 'FeatureCollection', features: []
        })
      }
      features.forEach((feature) => {
        if (allLayers.includes(feature.layer.id)) {
          candidates.push(feature)
        }
      })
      if (candidates.length > 0) {
        var shape_areas = candidates.map(feature => feature.properties._shape_area)
        const min = Math.min(...shape_areas)
        const index = shape_areas.indexOf(min)
        const featured_shape = candidates[index]
        map.getSource(featured_shape.layer.id).setData({
          type: 'FeatureCollection', features: [ featured_shape ]
        })
        featuredLayers.push(featured_shape.layer.id)
      }
    })
  }
});

  
  
// Modal - popup for filtering results
const filterResults = document.getElementById('filterResults');
const exitButton = document.getElementById('exitButton');
const modal = document.getElementById('modal');

filterResults.addEventListener('click', () => {
  modal.classList.remove('hide-visually');
  modal.classList.add('z5');
});

exitButton.addEventListener('click', () => {
  modal.classList.add('hide-visually');
});

const title = document.getElementById('title');
title.innerText = config.title;
const description = document.getElementById('description');
description.innerText = config.description;

function transformRequest(url) {
  const isMapboxRequest =
    url.slice(8, 22) === 'api.mapbox.com' ||
    url.slice(10, 26) === 'tiles.mapbox.com';
  return {
    url: isMapboxRequest ? url.replace('?', '?pluginName=finder&') : url,
  };
}

// Define bounds that conform to the `LngLatBoundsLike` object.
const bounds = [
[1.5,48.5], // [west, south]
[7,53.75]  // [east, north]
];
// Set the map's max bounds.
map.setMaxBounds(bounds);
map.addControl(new mapboxgl.AttributionControl({
  customAttribution: '<a href="https://vlaanderen.be">Vlaamse Overheid</a>'
}));

class LogoVlaanderen {
onAdd(map) {
    this._map = map;
    this._container = document.createElement('img');
    this._container.className = 'mapboxgl-ctrl';
    this._container.src = 'https://assets.vlaanderen.be/image/upload/widgets/vlaanderen-is-omgeving-logo.svg';
    this._container.width = 120
    this._container.href = "https://omgeving.vlaanderen.be"
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
map.addControl(new LogoVlaanderen(), "top-left")



