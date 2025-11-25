/**
 * Analytics Service for Meta Pixel and other tracking providers
 * 
 * Usage:
 *   import { analytics } from '@/services/analytics';
 *   analytics.trackEngagement({ transactionHash: '0x...' });
 */

// Extend Window interface for fbq
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      parameters?: Record<string, unknown>
    ) => void;
  }
}

// Standard Meta Pixel events
type StandardEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'ViewContent';

// Custom event parameters
interface EngagementEventParams {
  transactionHash?: string;
  amount?: string;
  success?: boolean;
}

interface ClaimEventParams {
  transactionHash?: string;
  amount?: string;
  tokenSymbol?: string;
}

interface VerificationEventParams {
  walletAddress?: string;
  isVerified?: boolean;
}

class AnalyticsService {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  /**
   * Track a standard Meta Pixel event
   */
  trackStandard(event: StandardEvent, params?: Record<string, unknown>): void {
    if (this.isAvailable()) {
      window.fbq!('track', event, params);
    }
  }

  /**
   * Track a custom Meta Pixel event
   */
  trackCustom(eventName: string, params?: Record<string, unknown>): void {
    if (this.isAvailable()) {
      window.fbq!('trackCustom', eventName, params);
    }
  }

  // ============================================
  // Predefined Events - Add your events here
  // ============================================

  /**
   * Track page view - call when a route is opened
   */
  trackPageView(pageName: string): void {
    this.trackStandard('PageView', { page: pageName });
  }

  /**
   * Track successful engagement reward claim
   */
  trackEngagement(params?: EngagementEventParams): void {
    this.trackCustom('EngagementRewardClaimed', {
      value: 3000,
      currency: 'G$',
      ...params,
    });
  }

  /**
   * Track successful engagement reward claim from Facebook ad
   */
  trackEngagementFromAd(params?: EngagementEventParams): void {
    this.trackCustom('EngagementRewardClaimedFromAd', {
      value: 3000,
      currency: 'G$',
      ...params,
    });
  }

  /**
   * Track successful UBI claim
   */
  trackUBIClaim(params?: ClaimEventParams): void {
    this.trackCustom('UBIClaimed', {
      currency: 'G$',
      ...params,
    });
  }

  /**
   * Track wallet verification completion
   */
  trackVerification(params?: VerificationEventParams): void {
    this.trackCustom('WalletVerified', {
      ...params,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export class for testing or custom instances
export { AnalyticsService };
