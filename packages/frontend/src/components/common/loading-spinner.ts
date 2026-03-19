import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 0.5rem; }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--color-border, #e0e0e0);
      border-top-color: var(--color-text, #111);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .text {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #666);
    }
  `;

  render() {
    return html`
      <div class="spinner"></div>
      <span class="text"><slot>Loading...</slot></span>
    `;
  }
}
