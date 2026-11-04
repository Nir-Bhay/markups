import { initializeTelemetry } from './utils/telemetryBootstrap.js';

// Only static public content pages import this entry. The existing hostname,
// fragment and query safeguards apply before any tracker is loaded.
initializeTelemetry({ pageTitle: document.title });
