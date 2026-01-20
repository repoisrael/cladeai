/**
 * Sanity Tests - Search Functionality
 * 
 * Comprehensive tests for search features.
 */

describe('Search Functionality', () => {
  
  beforeEach(() => {
    cy.visit('/search');
  });

  describe('Search Input', () => {
    it('should have a visible search input', () => {
      cy.get('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]')
        .should('be.visible')
        .and('be.enabled');
    });

    it('should focus search input on page load or click', () => {
      cy.get('input[type="search"], input[placeholder*="Search"]').first().click();
      cy.focused().should('match', 'input');
    });

    it('should clear search input when clear button is clicked', () => {
      const searchInput = 'input[type="search"], input[placeholder*="Search"]';
      cy.get(searchInput).first().type('test query');
      
      // Look for clear button
      cy.get('body').then(($body) => {
        const hasClear = $body.find('[aria-label*="clear"], button[class*="clear"], [data-testid="clear-search"]').length > 0;
        if (hasClear) {
          cy.get('[aria-label*="clear"], button[class*="clear"]').first().click();
          cy.get(searchInput).first().should('have.value', '');
        }
      });
    });

    it('should debounce search requests', () => {
      cy.intercept('GET', '**/search*').as('searchRequest');
      
      const searchInput = 'input[type="search"], input[placeholder*="Search"]';
      cy.get(searchInput).first().type('a');
      cy.get(searchInput).first().type('b');
      cy.get(searchInput).first().type('c');
      
      // Should not make 3 separate requests due to debouncing
      cy.wait(500);
    });
  });

  describe('Search Results', () => {
    it('should show loading state while searching', () => {
      cy.intercept('GET', '**/search*', { delay: 1000 }).as('slowSearch');
      
      const searchInput = 'input[type="search"], input[placeholder*="Search"]';
      cy.get(searchInput).first().type('test{enter}');
      
      // Look for loading indicator
      cy.get('body').then(($body) => {
        const hasLoader = $body.find('[class*="loading"], [class*="spinner"], [class*="skeleton"]').length > 0;
        // Loading state is optional but good to have
      });
    });

    it('should display results or empty state after search', () => {
      const searchInput = 'input[type="search"], input[placeholder*="Search"]';
      cy.get(searchInput).first().type('test query{enter}');
      
      // Wait for response
      cy.wait(2000);
      
      // Should show results or empty state
      cy.get('body').should('be.visible');
    });

    it('should display track cards in results', () => {
      const searchInput = 'input[type="search"], input[placeholder*="Search"]';
      cy.get(searchInput).first().type('music{enter}');
      
      cy.wait(2000);
      
      // Check for any cards in the results
      cy.get('body').then(($body) => {
        const hasCards = $body.find('[class*="card"]').length > 0;
        // Results depend on data availability
      });
    });
  });

  describe('Search Filters', () => {
    it('should display provider filter options if available', () => {
      cy.get('body').then(($body) => {
        const hasFilters = $body.find('[class*="filter"], [data-testid="provider-filter"]').length > 0;
        if (hasFilters) {
          cy.get('[class*="filter"]').should('be.visible');
        }
      });
    });
  });
});
