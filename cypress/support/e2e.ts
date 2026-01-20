/// <reference types="cypress" />

// Import commands
import './commands';

// Global before each hook
beforeEach(() => {
  // Clear any existing auth state
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore ResizeObserver errors (common in React apps)
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  // Ignore network errors during tests
  if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
    return false;
  }
  return true;
});

// Log console errors for debugging
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callsFake((msg) => {
    cy.log(`Console Error: ${msg}`);
  });
});
