import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AirlineProfile } from '@frcs/shared';
import '../common/risk-badge.js';

@customElement('airline-profiles')
export class AirlineProfiles extends LitElement {
  @property({ type: Array }) profiles: AirlineProfile[] = [];

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
    .profile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .airline {
      font-weight: 600;
      font-family: var(--font-mono, monospace);
    }
    .stats {
      display: flex;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
    }
    .stat-label {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
    }
    .stat-value {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
    }
    .empty {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #999);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  render() {
    if (this.profiles.length === 0) {
      return html`
        <div class="header">Airline Routing Profiles</div>
        <div class="empty">Run a route scan to see airline routing profiles.</div>
      `;
    }
    return html`
      <div class="header">Airline Routing Profiles</div>
      ${this.profiles.map(p => html`
        <div class="profile">
          <div>
            <div class="airline">${p.icao}</div>
            <div style="font-size:var(--text-sm);color:var(--color-text-secondary)">${p.flightCount} flights tracked</div>
          </div>
          <div class="stats">
            <div>
              <div class="stat-label">Min distance to conflict</div>
              <div class="stat-value">${p.minConflictDistance} km</div>
            </div>
            <div>
              <div class="stat-label">Avg distance</div>
              <div class="stat-value">${p.avgConflictDistance} km</div>
            </div>
            <risk-badge .level=${p.riskLevel}></risk-badge>
          </div>
        </div>
      `)}
    `;
  }
}
