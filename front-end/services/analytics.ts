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
  fbclid?: string; // Facebook Click ID for ad attribution
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
    if (typeof window === 'undefined') return false;
    // Check if fbq exists and is a function
    if (typeof window.fbq !== 'function') return false;
    // Check if the pixel is actually loaded (not just the stub)
    // The _fbq object has a 'loaded' property that indicates the pixel is ready
    const fbq = window.fbq as any;
    return fbq.loaded === true || (window as any)._fbq?.loaded === true;
  }

  /**
   * Track a standard Meta Pixel event
   * Will queue the event if pixel isn't ready yet
   */
  trackStandard(event: StandardEvent, params?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      // Meta Pixel's queue system will handle events even if not fully loaded
      window.fbq!('track', event, params);
    }
  }

  /**
   * Track a custom Meta Pixel event
   * Will queue the event if pixel isn't ready yet
   */
  trackCustom(eventName: string, params?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      // Meta Pixel's queue system will handle events even if not fully loaded
      window.fbq!('trackCustom', eventName, params);
    }
  }

  // ============================================
  // Predefined Events - Add your events here
  // ============================================

  /**
   * Track home page view
   */
  trackHomePageViewed(): void {
    this.trackCustom('HomePageViewed');
  }

  /**
   * Track engagement page view
   */
  trackEngagementPageViewed(): void {
    this.trackCustom('EngagementPageViewed');
  }

  /**
   * Track claim page view
   */
  trackClaimPageViewed(): void {
    this.trackCustom('ClaimPageViewed');
  }

  /**
   * Track onboarding page view
   */
  trackOnboardingPageViewed(): void {
    this.trackCustom('OnboardingPageViewed');
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
