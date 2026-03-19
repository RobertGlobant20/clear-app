import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import { api } from '../../services/api-client.js';
import type { AirportSearchResult } from '@frcs/shared';

@customElement('route-input')
export class RouteInput extends LitElement {
  @state() private origin = '';
  @state() private destination = '';
  @state() private originSuggestions: AirportSearchResult[] = [];
  @state() private destSuggestions: AirportSearchResult[] = [];
  @state() private activeField: 'origin' | 'dest' | null = null;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .form {
      display: flex;
      gap: var(--space-3, 0.75rem);
      align-items: flex-end;
    }
    .field {
      flex: 1;
      position: relative;
    }
    label {
      display: block;
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
      margin-bottom: var(--space-1, 0.25rem);
    }
    input {
      width: 100%;
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      font-size: var(--text-base, 1rem);
      font-family: var(--font-mono, monospace);
      letter-spacing: 0.05em;
      outline: none;
    }
    input:focus { border-color: var(--color-text, #111); }
    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--color-bg, #fff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      box-shadow: var(--shadow-lg);
      z-index: 10;
      max-height: 200px;
      overflow-y: auto;
    }
    .suggestion {
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-sm, 0.875rem);
    }
    .suggestion:hover { background: var(--color-surface, #f8f8f8); }
    .suggestion .code {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
    }
    .suggestion .name {
      color: var(--color-text-secondary, #666);
    }
    .arrow {
      font-size: var(--text-lg, 1.125rem);
      color: var(--color-text-muted, #999);
      align-self: center;
      padding-bottom: 0.25rem;
    }
  `];

  private debounceTimer: number | null = null;

  private async handleInput(field: 'origin' | 'dest', value: string) {
    if (field === 'origin') this.origin = value;
    else this.destination = value;

    this.activeField = field;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (value.length < 2) {
      if (field === 'origin') this.originSuggestions = [];
      else this.destSuggestions = [];
      return;
    }

    this.debounceTimer = window.setTimeout(async () => {
      const results = await api.searchAirports(value);
      if (field === 'origin') this.originSuggestions = results;
      else this.destSuggestions = results;
    }, 200);
  }

  private selectAirport(field: 'origin' | 'dest', airport: AirportSearchResult) {
    if (field === 'origin') {
      this.origin = airport.iataCode;
      this.originSuggestions = [];
    } else {
      this.destination = airport.iataCode;
      this.destSuggestions = [];
    }
    this.activeField = null;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.origin || !this.destination) return;
    this.originSuggestions = [];
    this.destSuggestions = [];
    this.dispatchEvent(new CustomEvent('scan', {
      detail: { origin: this.origin.toUpperCase(), destination: this.destination.toUpperCase() },
      bubbles: true,
      composed: true,
    }));
  }

  private renderSuggestions(field: 'origin' | 'dest') {
    const suggestions = field === 'origin' ? this.originSuggestions : this.destSuggestions;
    if (this.activeField !== field || suggestions.length === 0) return null;
    return html`
      <div class="suggestions">
        ${suggestions.map(s => html`
          <div class="suggestion" @click=${() => this.selectAirport(field, s)}>
            <span class="code">${s.iataCode}</span>
            <span class="name">${s.name}, ${s.country}</span>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    return html`
      <form class="form" @submit=${this.handleSubmit}>
        <div class="field">
          <label>Origin</label>
          <input
            type="text"
            placeholder="JFK"
            .value=${this.origin}
            @input=${(e: Event) => this.handleInput('origin', (e.target as HTMLInputElement).value)}
            @focus=${() => this.activeField = 'origin'}
          />
          ${this.renderSuggestions('origin')}
        </div>
        <span class="arrow">&rarr;</span>
        <div class="field">
          <label>Destination</label>
          <input
            type="text"
            placeholder="TLV"
            .value=${this.destination}
            @input=${(e: Event) => this.handleInput('dest', (e.target as HTMLInputElement).value)}
            @focus=${() => this.activeField = 'dest'}
          />
          ${this.renderSuggestions('dest')}
        </div>
        <button type="submit" class="btn btn-primary">Scan Route</button>
      </form>
    `;
  }
}
