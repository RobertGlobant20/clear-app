import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { ScoredRoute } from '@frcs/shared';
import '../common/risk-badge.js';

@customElement('scan-results')
export class ScanResults extends LitElement {
  @property({ type: Array }) routes: ScoredRoute[] = [];

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .route {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      margin-bottom: var(--space-2, 0.5rem);
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .route:hover { border-color: var(--color-text, #111); }
    .route-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 0.5rem);
    }
    .route-name {
      font-weight: 600;
    }
    .route-meta {
      display: flex;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
    }
    .score {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: var(--text-lg, 1.125rem);
    }
    .reasoning {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      line-height: 1.5;
      margin-top: var(--space-2, 0.5rem);
    }
    .zones {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
      margin-top: var(--space-2, 0.5rem);
    }
  `];

  private handleSelect(route: ScoredRoute) {
    this.dispatchEvent(new CustomEvent('route-select', {
      detail: route,
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (this.routes.length === 0) return nothing;
    return html`
      <div class="header">Route options ranked by safety</div>
      ${this.routes.map((route, i) => html`
        <div class="route" @click=${() => this.handleSelect(route)}>
          <div class="route-header">
            <span class="route-name">${i + 1}. ${route.name}</span>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span class="score risk-${route.riskLevel}">${route.score}</span>
              <risk-badge .level=${route.riskLevel}></risk-badge>
            </div>
          </div>
          <div class="route-meta">
            <span>${route.distanceKm.toLocaleString()} km</span>
            <span>${route.nearbyZones.length} conflict zone${route.nearbyZones.length !== 1 ? 's' : ''} nearby</span>
          </div>
          <div class="reasoning">${route.reasoning}</div>
          ${route.nearbyZones.length > 0 ? html`
            <div class="zones">
              ${route.nearbyZones.map(z => html`
                <span>${z.zone.regionName} (${z.distanceKm}km ${z.bearing})</span>
              `)}
            </div>
          ` : nothing}
        </div>
      `)}
    `;
  }
}
