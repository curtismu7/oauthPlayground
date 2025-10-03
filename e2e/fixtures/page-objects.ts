import { Page, Locator } from '@playwright/test';

/**
 * Base page object with common functionality
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string = '/') {
    await this.page.goto(url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector);
  }

  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }
}

/**
 * Dashboard page object
 */
export class DashboardPage extends BasePage {
  async isLoaded() {
    await this.waitForSelector('[data-testid="dashboard"]');
  }

  async getWelcomeMessage() {
    return this.getLocator('h1, .welcome-message').textContent();
  }

  async navigateToFlow(flowName: string) {
    await this.getLocator(`[data-testid="flow-${flowName}"]`).click();
  }
}

/**
 * Configuration page object
 */
export class ConfigurationPage extends BasePage {
  async isLoaded() {
    await this.waitForSelector('[data-testid="configuration-form"]');
  }

  async setEnvironmentId(value: string) {
    await this.page.fill('[name*="environment"], [placeholder*="Environment"]', value);
  }

  async setClientId(value: string) {
    await this.page.fill('[name*="client"], [placeholder*="Client ID"]', value);
  }

  async setClientSecret(value: string) {
    await this.page.fill('[name*="secret"], [placeholder*="Secret"]', value);
  }

  async setRedirectUri(value: string) {
    await this.page.fill('[name*="redirect"], [placeholder*="Redirect"]', value);
  }

  async saveConfiguration() {
    await this.page.click('button:has-text("Save"), [data-testid="save-config"]');
  }

  async getSuccessMessage() {
    return this.page.locator('.success-message, [role="alert"]').textContent();
  }
}

/**
 * OAuth Flow base page object
 */
export class OAuthFlowPage extends BasePage {
  async isLoaded() {
    await this.waitForSelector('[data-testid="oauth-flow"]');
  }

  async startFlow() {
    await this.page.click('button:has-text("Start"), [data-testid="start-flow"]');
  }

  async getAccessToken() {
    return this.page.locator('[data-testid="access-token"], .access-token').textContent();
  }

  async getIdToken() {
    return this.page.locator('[data-testid="id-token"], .id-token').textContent();
  }

  async getRefreshToken() {
    return this.page.locator('[data-testid="refresh-token"], .refresh-token').textContent();
  }

  async getTokenExpiry() {
    return this.page.locator('[data-testid="token-expiry"], .token-expiry').textContent();
  }

  async refreshToken() {
    await this.page.click('button:has-text("Refresh"), [data-testid="refresh-token"]');
  }

  async revokeToken() {
    await this.page.click('button:has-text("Revoke"), [data-testid="revoke-token"]');
  }
}

/**
 * Authorization Code Flow page object
 */
export class AuthorizationCodeFlowPage extends OAuthFlowPage {
  async setScope(scope: string) {
    await this.page.fill('[name*="scope"], [placeholder*="scope"]', scope);
  }

  async setState(state: string) {
    await this.page.fill('[name*="state"], [placeholder*="state"]', state);
  }

  async enablePKCE(enabled: boolean = true) {
    const checkbox = this.page.locator('[name*="pkce"], [data-testid="pkce-toggle"]');
    const isChecked = await checkbox.isChecked();
    if (enabled !== isChecked) {
      await checkbox.click();
    }
  }

  async getAuthorizationUrl() {
    return this.page.locator('[data-testid="auth-url"], .auth-url').textContent();
  }
}

/**
 * Implicit Flow page object
 */
export class ImplicitFlowPage extends OAuthFlowPage {
  async setResponseType(type: string) {
    await this.page.selectOption('[name*="response_type"]', type);
  }

  async setScope(scope: string) {
    await this.page.fill('[name*="scope"], [placeholder*="scope"]', scope);
  }
}

/**
 * Client Credentials Flow page object
 */
export class ClientCredentialsFlowPage extends OAuthFlowPage {
  async setScope(scope: string) {
    await this.page.fill('[name*="scope"], [placeholder*="scope"]', scope);
  }

  async setGrantType(type: string) {
    await this.page.selectOption('[name*="grant_type"]', type);
  }
}

/**
 * Device Authorization Flow page object
 */
export class DeviceAuthorizationFlowPage extends OAuthFlowPage {
  async getDeviceCode() {
    return this.page.locator('[data-testid="device-code"], .device-code').textContent();
  }

  async getUserCode() {
    return this.page.locator('[data-testid="user-code"], .user-code').textContent();
  }

  async getVerificationUri() {
    return this.page.locator('[data-testid="verification-uri"], .verification-uri').textContent();
  }

  async pollForToken() {
    await this.page.click('button:has-text("Poll"), [data-testid="poll-token"]');
  }
}

/**
 * Sidebar navigation page object
 */
export class SidebarPage extends BasePage {
  async toggleMenuSection(sectionName: string) {
    await this.page.click(`[data-testid="menu-${sectionName}"] button`);
  }

  async navigateToFlow(flowPath: string) {
    await this.page.click(`[href*="${flowPath}"]`);
  }

  async isMenuSectionOpen(sectionName: string) {
    const section = this.page.locator(`[data-testid="menu-${sectionName}"]`);
    const expanded = await section.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  async getMenuSections() {
    return this.page.locator('[data-testid^="menu-"]').allTextContents();
  }
}