import { LitElement, html, css, unsafeCSS } from 'lit';
import leafletCss from 'leaflet/dist/leaflet.css?raw';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './styles/shared-styles.js';
import { StoreController } from './state/store-controller.js';
import { store } from './state/store.js';
import { api } from './services/api-client.js';
import type { ScoredRoute, ScanResponse } from '@frcs/shared';

// Import all components
import './components/scanner/route-input.js';
import './components/scanner/scan-results.js';
import './components/map/route-map.js';
import './components/risk/risk-dashboard.js';
import './components/alternatives/safe-alternatives.js';
import './components/advisory/advisory-sidebar.js';
import './components/anomaly/anomaly-list.js';
import './components/airline/airline-profile.js';
import './components/common/loading-spinner.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  private ctrl = new StoreController(this);
  @state() private selectedRouteIndex = 0;
  private eventSource: EventSource | null = null;

  /* Leaflet in index.html does not apply inside shadow DOM; bundle its CSS here */
  static styles = [sharedStyles, unsafeCSS(leafletCss), css`
    :host {
      display: block;
      min-height: 100vh;
    }
    header {
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .logo-sub {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
      font-weight: 400;
    }
    nav {
      display: flex;
      gap: var(--space-1, 0.25rem);
    }
    nav button {
      padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
      border: none;
      background: none;
      font-size: var(--text-sm, 0.875rem);
      cursor: pointer;
      color: var(--color-text-secondary, #666);
      border-bottom: 2px solid transparent;
      font-family: inherit;
    }
    nav button.active {
      color: var(--color-text, #111);
      border-bottom-color: var(--color-text, #111);
    }
    nav button:hover { color: var(--color-text, #111); }

    .layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: var(--space-6, 1.5rem);
      padding: var(--space-6, 1.5rem);
      max-width: 1400px;
      margin: 0 auto;
    }
    .main { min-width: 0; }
    .sidebar {
      border-left: 1px solid var(--color-border, #e0e0e0);
      padding-left: var(--space-6, 1.5rem);
    }
    .section {
      margin-bottom: var(--space-6, 1.5rem);
    }
    .error {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-risk-high, #ef4444);
      border-radius: var(--radius, 4px);
      color: var(--color-risk-high, #ef4444);
      font-size: var(--text-sm, 0.875rem);
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        border-left: none;
        border-top: 1px solid var(--color-border, #e0e0e0);
        padding-left: 0;
        padding-top: var(--space-6, 1.5rem);
      }
    }
  `];

  connectedCallback() {
    super.connectedCallback();
    this.loadAdvisories();
    this.eventSource = api.subscribeAdvisories((advisories) => {
      store.update({ advisories });
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.eventSource?.close();
  }

  private async loadAdvisories() {
    store.update({ advisoriesLoading: true });
    try {
      const advisories = await api.getAdvisories();
      store.update({ advisories, advisoriesLoading: false });
    } catch {
      store.update({ advisoriesLoading: false });
    }
  }

  private async handleScan(e: CustomEvent<{ origin: string; destination: string }>) {
    const { origin, destination } = e.detail;
    store.update({ scanLoading: true, scanError: null, scanResult: null });
    this.selectedRouteIndex = 0;

    try {
      const result = await api.scanRoute(origin, destination);
      store.update({ scanLoading: false, scanResult: result });

      // Also load anomalies and airline profiles
      const route = `${origin}-${destination}`;
      api.getAnomalies(route).then(anomalies => store.update({ anomalies })).catch(() => {});
      api.getAirlineProfiles(route).then(airlineProfiles => store.update({ airlineProfiles })).catch(() => {});
    } catch (err) {
      store.update({ scanLoading: false, scanError: (err as Error).message });
    }
  }

  private handleRouteSelect(e: CustomEvent<ScoredRoute>) {
    const result = this.ctrl.state.scanResult;
    if (!result) return;
    const idx = result.routes.findIndex(r => r.id === e.detail.id);
    if (idx >= 0) this.selectedRouteIndex = idx;
  }

  private setView(view: 'scanner' | 'airlines' | 'anomalies') {
    store.update({ activeView: view });
  }

  render() {
    const s = this.ctrl.state;
    const result = s.scanResult;

    return html`
      <header>
        <div>
          <div class="logo">FRCS</div>
          <div class="logo-sub">Flight Route Conflict Scanner</div>
        </div>
        <nav>
          <button class=${s.activeView === 'scanner' ? 'active' : ''} @click=${() => this.setView('scanner')}>Scanner</button>
          <button class=${s.activeView === 'airlines' ? 'active' : ''} @click=${() => this.setView('airlines')}>Airlines</button>
          <button class=${s.activeView === 'anomalies' ? 'active' : ''} @click=${() => this.setView('anomalies')}>Anomalies</button>
        </nav>
      </header>

      <div class="layout">
        <div class="main">
          <div class="section">
            <route-input @scan=${this.handleScan}></route-input>
          </div>

          ${s.scanLoading ? html`<loading-spinner>Analyzing route...</loading-spinner>` : ''}
          ${s.scanError ? html`<div class="error">${s.scanError}</div>` : ''}

          ${result ? html`
            <div class="section">
              <route-map
                .routes=${result.routes}
                .origin=${{ lat: result.origin.lat, lon: result.origin.lon, code: result.origin.code }}
                .destination=${{ lat: result.destination.lat, lon: result.destination.lon, code: result.destination.code }}
                .selectedRouteIndex=${this.selectedRouteIndex}
              ></route-map>
            </div>
          ` : ''}

          ${s.activeView === 'scanner' && result ? html`
            <div class="section">
              <scan-results .routes=${result.routes} @route-select=${this.handleRouteSelect}></scan-results>
            </div>
            <div class="section">
              <risk-dashboard .risk=${result.riskScore}></risk-dashboard>
            </div>
            <div class="section">
              <safe-alternatives .alternatives=${result.alternatives}></safe-alternatives>
            </div>
          ` : ''}

          ${s.activeView === 'airlines' ? html`
            <div class="section">
              <airline-profiles .profiles=${s.airlineProfiles}></airline-profiles>
            </div>
          ` : ''}

          ${s.activeView === 'anomalies' ? html`
            <div class="section">
              <anomaly-list .anomalies=${s.anomalies}></anomaly-list>
            </div>
          ` : ''}
        </div>

        <div class="sidebar">
          <advisory-sidebar
            .advisories=${s.advisories}
            .loading=${s.advisoriesLoading}
          ></advisory-sidebar>
        </div>
      </div>
    `;
  }
}
