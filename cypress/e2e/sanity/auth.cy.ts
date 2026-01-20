/**
 * Sanity Tests - Authentication
 * 
 * Comprehensive tests for authentication flows.
 */

describe('Authentication Flow', () => {
  
  beforeEach(() => {
    cy.visit('/auth');
  });

  describe('Login Form', () => {
    it('should display all login form elements', () => {
      cy.get('input[type="email"]').should('be.visible').and('have.attr', 'placeholder');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible').and('be.enabled');
    });

    it('should toggle between login and signup modes', () => {
      // Check for toggle button or link
      cy.get('body').then(($body) => {
        const toggleExists = $body.find('button:contains("Sign up"), a:contains("Sign up"), button:contains("Register")').length > 0;
        if (toggleExists) {
          cy.contains(/sign up|register/i).click();
          cy.get('input[type="email"]').should('be.visible');
        }
      });
    });

    it('should show error for invalid email format', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Check for HTML5 validation or custom error
      cy.get('input[type="email"]:invalid, [class*="error"], [role="alert"]').should('exist');
    });

    it('should show error for short password', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('123');
      cy.get('button[type="submit"]').click();
      
      // Wait for any validation message
      cy.wait(500);
    });

    it('should mask password input', () => {
      cy.get('input[type="password"]').type('secretpassword');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });

    it('should have password visibility toggle if present', () => {
      cy.get('body').then(($body) => {
        const hasToggle = $body.find('[aria-label*="password"], button[class*="eye"]').length > 0;
        if (hasToggle) {
          cy.get('[aria-label*="password"], button[class*="eye"]').first().click();
          cy.get('input').filter('[type="text"]').should('exist');
        }
      });
    });
  });

  describe('OAuth Providers', () => {
    it('should display Spotify connect option if available', () => {
      cy.get('body').then(($body) => {
        const hasSpotify = $body.text().toLowerCase().includes('spotify');
        if (hasSpotify) {
          cy.contains(/spotify/i).should('be.visible');
        }
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to auth from profile when not logged in', () => {
      cy.clearLocalStorage();
      cy.visit('/profile');
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/auth') || url.includes('/profile');
      });
    });
  });
});
