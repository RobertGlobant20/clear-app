import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AnomalyResult } from '@frcs/shared';

@customElement('anomaly-list')
export class AnomalyList extends LitElement {
  @property({ type: Array }) anomalies: AnomalyResult[] = [];

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
    .anomaly {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-anomaly, #f59e0b);
      border-radius: var(--radius, 4px);
      margin-bottom: var(--space-2, 0.5rem);
      background: #fffbeb;
    }
    .anomaly-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 0.5rem);
    }
    .callsign {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
    }
    .deviation {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      color: var(--color-risk-high, #ef4444);
    }
    .meta {
      display: flex;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .reasoning {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      line-height: 1.5;
    }
    .correlated {
      font-size: var(--text-xs, 0.75rem);
      margin-top: var(--space-2, 0.5rem);
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      background: #fee2e2;
      border-radius: 2px;
      display: inline-block;
    }
    .empty {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #999);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  render() {
    if (this.anomalies.length === 0) {
      return html`
        <div class="header">Rerouting Anomalies (last 7 days)</div>
        <div class="empty">No rerouting anomalies detected. Airlines are flying their standard routes.</div>
      `;
    }
    return html`
      <div class="header">Rerouting Anomalies (last 7 days)</div>
      ${this.anomalies.map(a => html`
        <div class="anomaly">
          <div class="anomaly-header">
            <span class="callsign">${a.callsign}</span>
            <span class="deviation">${a.maxDeviationKm}km deviation</span>
          </div>
          <div class="meta">
            <span>Score: ${a.deviationScore}%</span>
            <span>Direction: ${a.deviationDirection}</span>
            <span>${this.formatDate(a.detectedAt)}</span>
          </div>
          <div class="reasoning">${a.reasoning}</div>
          ${a.correlatedConflictZone ? html`
            <div class="correlated">Correlated with: ${a.correlatedConflictZone}</div>
          ` : nothing}
        </div>
      `)}
    `;
  }

  private formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }
}
