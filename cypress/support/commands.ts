/// <reference types="cypress" />

// Custom commands for Harmony Hub E2E tests

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with test credentials
       */
      login(email?: string, password?: string): Chainable<void>;
      
      /**
       * Wait for page to fully load (no pending requests)
       */
      waitForPageLoad(): Chainable<void>;
      
      /**
       * Navigate using bottom nav
       */
      navigateTo(page: 'feed' | 'search' | 'compare' | 'profile'): Chainable<void>;
      
      /**
       * Search for a track
       */
      searchTrack(query: string): Chainable<void>;
      
      /**
       * Click play on a track card
       */
      playTrack(trackTitle: string): Chainable<void>;
      
      /**
       * Check if embedded player is visible
       */
      playerShouldBeVisible(): Chainable<void>;
      
      /**
       * Close the embedded player
       */
      closePlayer(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'testpassword123') => {
  cy.visit('/auth');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/auth');
});

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  // Wait for any loading spinners to disappear
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

// Navigate using bottom nav
Cypress.Commands.add('navigateTo', (page) => {
  const routes: Record<string, string> = {
    feed: '/',
    search: '/search',
    compare: '/compare',
    profile: '/profile',
  };
  
  cy.get('nav').find(`a[href="${routes[page]}"]`).click();
  cy.url().should('include', routes[page] === '/' ? '' : routes[page]);
});

// Search for a track
Cypress.Commands.add('searchTrack', (query) => {
  cy.visit('/search');
  cy.get('input[type="search"], input[placeholder*="Search"]').first().clear().type(query);
  cy.get('input[type="search"], input[placeholder*="Search"]').first().type('{enter}');
  // Wait for results
  cy.get('[data-testid="search-results"], [class*="track"], [class*="card"]', { timeout: 10000 }).should('exist');
});

// Play a track
Cypress.Commands.add('playTrack', (trackTitle) => {
  cy.contains(trackTitle).parents('[class*="card"], [data-testid="track-card"]').first()
    .find('button[aria-label*="play"], button[class*="play"], [data-testid="play-button"]')
    .click();
});

// Check player is visible
Cypress.Commands.add('playerShouldBeVisible', () => {
  cy.get('[class*="player"], [data-testid="embedded-player"]', { timeout: 5000 }).should('be.visible');
});

// Close player
Cypress.Commands.add('closePlayer', () => {
  cy.get('[aria-label="Close player"], [data-testid="close-player"]').click();
});

export {};
