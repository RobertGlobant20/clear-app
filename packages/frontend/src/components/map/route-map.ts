import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ScoredRoute, ConflictZone } from '@frcs/shared';
import L from 'leaflet';

@customElement('route-map')
export class RouteMap extends LitElement {
  @property({ type: Array }) routes: ScoredRoute[] = [];
  @property({ type: Object }) origin: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Object }) destination: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Number }) selectedRouteIndex = 0;

  @state() private map: L.Map | null = null;
  private routeLayers: L.LayerGroup = L.layerGroup();
  private markerLayer: L.LayerGroup = L.layerGroup();
  private zoneLayer: L.LayerGroup = L.layerGroup();

  // Opt out of Shadow DOM for Leaflet CSS compatibility
  createRenderRoot() { return this; }

  static styles = css`
    route-map {
      display: block;
      height: 400px;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-lg, 8px);
      overflow: hidden;
    }
    .map-container { width: 100%; height: 100%; }
  `;

  firstUpdated() {
    const container = this.querySelector('.map-container') as HTMLElement;
    if (!container) return;

    this.map = L.map(container, { zoomControl: true }).setView([30, 30], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.routeLayers.addTo(this.map);
    this.markerLayer.addTo(this.map);
    this.zoneLayer.addTo(this.map);

    this.updateMap();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('routes') || changed.has('origin') || changed.has('destination') || changed.has('selectedRouteIndex')) {
      this.updateMap();
    }
  }

  private updateMap() {
    if (!this.map) return;

    this.routeLayers.clearLayers();
    this.markerLayer.clearLayers();
    this.zoneLayer.clearLayers();

    if (!this.origin || !this.destination) return;

    // Add origin/destination markers
    const originIcon = L.divIcon({ className: '', html: `<div style="background:#111;color:#fff;padding:2px 6px;border-radius:2px;font-size:12px;font-weight:700;font-family:monospace;white-space:nowrap">${this.origin.code}</div>` });
    const destIcon = L.divIcon({ className: '', html: `<div style="background:#111;color:#fff;padding:2px 6px;border-radius:2px;font-size:12px;font-weight:700;font-family:monospace;white-space:nowrap">${this.destination.code}</div>` });

    L.marker([this.origin.lat, this.origin.lon], { icon: originIcon }).addTo(this.markerLayer);
    L.marker([this.destination.lat, this.destination.lon], { icon: destIcon }).addTo(this.markerLayer);

    // Draw routes
    const riskColors: Record<string, string> = {
      low: '#22c55e',
      moderate: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    };

    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      const coords = route.path.coordinates.map(c => [c[1], c[0]] as [number, number]);
      const isSelected = i === this.selectedRouteIndex;
      const color = riskColors[route.riskLevel] || '#999';

      L.polyline(coords, {
        color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.4,
        dashArray: isSelected ? undefined : '4 4',
      }).addTo(this.routeLayers);

      // Draw conflict zones for selected route
      if (isSelected) {
        for (const nz of route.nearbyZones) {
          L.circle([nz.zone.centroidLat, nz.zone.centroidLon], {
            radius: nz.zone.radiusKm * 1000,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            weight: 1,
          }).addTo(this.zoneLayer);
        }
      }
    }

    // Fit bounds
    const allCoords: [number, number][] = [
      [this.origin.lat, this.origin.lon],
      [this.destination.lat, this.destination.lon],
    ];
    this.map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
  }

  render() {
    return html`<div class="map-container"></div>`;
  }
}
