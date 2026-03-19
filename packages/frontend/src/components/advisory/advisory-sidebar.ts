import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { Advisory } from '@frcs/shared';

@customElement('advisory-sidebar')
export class AdvisorySidebar extends LitElement {
  @property({ type: Array }) advisories: Advisory[] = [];
  @property({ type: Boolean }) loading = false;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .title {
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--color-risk-high, #ef4444);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .advisory {
      padding: var(--space-3, 0.75rem);
      border-left: 3px solid;
      margin-bottom: var(--space-2, 0.5rem);
      background: var(--color-surface, #f8f8f8);
      font-size: var(--text-sm, 0.875rem);
    }
    .advisory.notam { border-color: var(--color-notam, #3b82f6); }
    .advisory.conflict { border-color: var(--color-conflict, #ef4444); }
    .advisory.anomaly { border-color: var(--color-anomaly, #f59e0b); }
    .advisory.closure { border-color: var(--color-closure, #8b5cf6); }
    .advisory-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .advisory-desc {
      color: var(--color-text-secondary, #666);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .advisory-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 0.25rem;
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
    }
    .empty {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #999);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  render() {
    return html`
      <div class="header">
        <span class="title">Live Advisories</span>
        <div class="live-dot"></div>
      </div>
      ${this.loading ? html`<loading-spinner>Fetching advisories...</loading-spinner>` : nothing}
      ${!this.loading && this.advisories.length === 0
        ? html`<div class="empty">No active advisories</div>`
        : nothing}
      ${this.advisories.map(a => html`
        <div class="advisory ${a.type}">
          <div class="advisory-title">${a.title}</div>
          <div class="advisory-desc">${a.description}</div>
          <div class="advisory-meta">
            <span>${a.source}</span>
            <span>${this.formatDate(a.issuedAt)}</span>
          </div>
        </div>
      `)}
    `;
  }

  private formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return iso; }
  }
}
