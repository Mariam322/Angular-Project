import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  mapLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  map: L.Map | undefined;
  maxZoom: number = 22;
  minZoom: number = 6;
  geojsonObject: any = { type: 'FeatureCollection', features: [] };

  constructor() {}

  ngOnInit(): void {
    this.initializeOSM();
    this.addInitialMarker(); // 👉 On ajoute le marqueur dès le démarrage
  }

  // Initialisation de la carte OpenStreetMap
  initializeOSM(): void {
    if (!this.map) {
      this.map = L.map('map', {
        center: [34.751020, 10.716912], // Coordonnées initiales (ex. Sfax)
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      const tiles = L.tileLayer(this.mapLayerUrl, {
        maxZoom: this.maxZoom,
        minZoom: this.minZoom
      });

      tiles.addTo(this.map);
    }
  }

  // 👉 Ajouter un marqueur rouge dès l'ouverture de la carte
  addInitialMarker(): void {
    if (this.map) {
      const marker = L.marker([34.751020, 10.716912], {
        icon: L.icon({
          iconUrl: 'https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png',
          iconSize: [12, 12]
        })
      });

      marker.addTo(this.map).bindPopup('<b>Sfax, Tunisie</b>').openPopup();
    }
  }

  // Fonction de recherche par pays
  searchByCountry(countryName: string): void {
    const apiUrl = `https://nominatim.openstreetmap.org/search.php?q=${countryName}&polygon_geojson=1&format=jsonv2`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          this.geojsonObject.features = [{
            type: 'Feature',
            properties: {
              id: data[0].osm_id,
              name: data[0].display_name,
              color: '#03A379'
            },
            geometry: data[0].geojson
          }];

          // Ajouter un marqueur au centre du pays trouvé
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const marker = L.marker([lat, lon], {
            icon: L.icon({
              iconUrl: 'https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png',
              iconSize: [12, 12]
            })
          });

          marker.addTo(this.map!).bindPopup(`<b>${data[0].display_name}</b>`).openPopup();

          this.addGeoJSONLayer();
        } else {
          alert('Pays non trouvé');
        }
      })
      .catch(err => {
        console.error('Erreur dans la recherche:', err);
      });
  }

  // Ajouter la couche GeoJSON
  addGeoJSONLayer(): void {
    if (this.geojsonObject.features.length > 0 && this.map) {
      const layer = L.geoJSON(this.geojsonObject, {
        style: (feature: any) => ({
          fill: true,
          color: '#03A379',
          weight: 3,
          fillColor: 'red'
        }),
        onEachFeature: (feature: any, layer: any) => {
          layer.bindTooltip(feature.properties.name, {
            permanent: true,
            direction: 'center',
            className: 'my-label'
          }).openTooltip();
        }
      });

      layer.addTo(this.map);
      this.map.fitBounds(layer.getBounds());
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchByCountry(input.value);
  }
}
