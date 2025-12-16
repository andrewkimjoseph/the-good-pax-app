/**
 * Analytics Service for Meta Pixel, TikTok Pixel, Vercel Analytics, and PostHog
 * 
 * Usage:
 *   import { analytics } from '@/services/analytics';
 *   analytics.trackEngagement({ transactionHash: '0x...' });
 */

import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

// Extend Window interface for fbq and ttq
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      parameters?: Record<string, unknown>
    ) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void;
      page: () => void;
    };
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
  private isFacebookAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    // Check if fbq exists and is a function
    if (typeof window.fbq !== 'function') return false;
    // Check if the pixel is actually loaded (not just the stub)
    // The _fbq object has a 'loaded' property that indicates the pixel is ready
    const fbq = window.fbq as any;
    return fbq.loaded === true || (window as any)._fbq?.loaded === true;
  }

  private isTikTokAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof window.ttq !== 'undefined' && typeof window.ttq?.track === 'function';
  }

  private isPostHogAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof posthog !== 'undefined' && typeof posthog.capture === 'function';
  }

  /**
   * Track a PostHog event
   */
  private trackPostHog(eventName: string, properties?: Record<string, unknown>): void {
    if (this.isPostHogAvailable()) {
      try {
        posthog.capture(eventName, properties);
      } catch (error) {
        // Silently fail if PostHog is not ready
        console.debug('PostHog capture failed:', error);
      }
    }
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

  /**
   * Track TikTok ViewContent event
   */
  private trackTikTokViewContent(params?: {
    contentId?: string;
    contentType?: string;
    contentName?: string;
    value?: number;
    currency?: string;
    eventId?: string;
  }): void {
    if (!this.isTikTokAvailable()) return;

    const contents = params?.contentId ? [{
      content_id: params.contentId,
      content_type: params.contentType || 'product',
      content_name: params.contentName || '',
    }] : [];

    const trackParams: Record<string, unknown> = {};
    if (contents.length > 0) {
      trackParams.contents = contents;
    }
    if (params?.value !== undefined) {
      trackParams.value = params.value;
    }
    if (params?.currency) {
      trackParams.currency = params.currency;
    }

    const options: Record<string, unknown> = {};
    if (params?.eventId) {
      options.event_id = params.eventId;
    }

    window.ttq!.track('ViewContent', trackParams, Object.keys(options).length > 0 ? options : undefined);
  }

  /**
   * Track TikTok Lead event
   */
  private trackTikTokLead(params?: {
    contentId?: string;
    contentType?: string;
    contentName?: string;
    value?: number;
    currency?: string;
    eventId?: string;
  }): void {
    if (!this.isTikTokAvailable()) return;

    const contents = params?.contentId ? [{
      content_id: params.contentId,
      content_type: params.contentType || 'product',
      content_name: params.contentName || '',
    }] : [];

    const trackParams: Record<string, unknown> = {};
    if (contents.length > 0) {
      trackParams.contents = contents;
    }
    if (params?.value !== undefined) {
      trackParams.value = params.value;
    }
    if (params?.currency) {
      trackParams.currency = params.currency;
    }

    const options: Record<string, unknown> = {};
    if (params?.eventId) {
      options.event_id = params.eventId;
    }

    window.ttq!.track('Lead', trackParams, Object.keys(options).length > 0 ? options : undefined);
  }

  /**
   * Track TikTok Contact event
   */
  private trackTikTokContact(params?: {
    contentId?: string;
    contentType?: string;
    contentName?: string;
    value?: number;
    currency?: string;
    eventId?: string;
  }): void {
    if (!this.isTikTokAvailable()) return;

    const contents = params?.contentId ? [{
      content_id: params.contentId,
      content_type: params.contentType || 'product',
      content_name: params.contentName || '',
    }] : [];

    const trackParams: Record<string, unknown> = {};
    if (contents.length > 0) {
      trackParams.contents = contents;
    }
    if (params?.value !== undefined) {
      trackParams.value = params.value;
    }
    if (params?.currency) {
      trackParams.currency = params.currency;
    }

    const options: Record<string, unknown> = {};
    if (params?.eventId) {
      options.event_id = params.eventId;
    }

    window.ttq!.track('Contact', trackParams, Object.keys(options).length > 0 ? options : undefined);
  }

  /**
   * Track TikTok ClickButton event
   */
  private trackTikTokClickButton(params?: {
    contentId?: string;
    contentType?: string;
    contentName?: string;
    value?: number;
    currency?: string;
    eventId?: string;
  }): void {
    if (!this.isTikTokAvailable()) return;

    const contents = params?.contentId ? [{
      content_id: params.contentId,
      content_type: params.contentType || 'product',
      content_name: params.contentName || '',
    }] : [];

    const trackParams: Record<string, unknown> = {};
    if (contents.length > 0) {
      trackParams.contents = contents;
    }
    if (params?.value !== undefined) {
      trackParams.value = params.value;
    }
    if (params?.currency) {
      trackParams.currency = params.currency;
    }

    const options: Record<string, unknown> = {};
    if (params?.eventId) {
      options.event_id = params.eventId;
    }

    window.ttq!.track('ClickButton', trackParams, Object.keys(options).length > 0 ? options : undefined);
  }

  // ============================================
  // Predefined Events - Add your events here
  // ============================================

  /**
   * Track home page view
   */
  trackHomePageViewed(): void {
    this.trackCustom('HomePageViewed');
    // TikTok: Track as ViewContent
    this.trackTikTokViewContent({
      contentId: 'home',
      contentType: 'product',
      contentName: 'Home Page',
    });
    // Vercel: Track home page view
    track('HomePageViewed', {});
    // PostHog: Track home page view
    this.trackPostHog('HomePageViewed', {});
  }

  /**
   * Track engagement page view
   */
  trackEngagementPageViewed(): void {
    this.trackCustom('EngagementPageViewed');
    // TikTok: Track as ViewContent
    this.trackTikTokViewContent({
      contentId: 'engage',
      contentType: 'product',
      contentName: 'Engagement Page',
    });
    // Vercel: Track engagement page view
    track('EngagementPageViewed', {});
    // PostHog: Track engagement page view
    this.trackPostHog('EngagementPageViewed', {});
  }

  /**
   * Track claim page view
   */
  trackClaimPageViewed(): void {
    this.trackCustom('ClaimPageViewed');
    // TikTok: Track as ViewContent
    this.trackTikTokViewContent({
      contentId: 'claim',
      contentType: 'product',
      contentName: 'Claim Page',
    });
    // Vercel: Track claim page view
    track('ClaimPageViewed', {});
    // PostHog: Track claim page view
    this.trackPostHog('ClaimPageViewed', {});
  }

  /**
   * Track onboarding page view
   */
  trackOnboardingPageViewed(): void {
    this.trackCustom('OnboardingPageViewed');
    // TikTok: Track as ViewContent
    this.trackTikTokViewContent({
      contentId: 'onboarding',
      contentType: 'product',
      contentName: 'Onboarding Page',
    });
    // Vercel: Track onboarding page view
    track('OnboardingPageViewed', {});
    // PostHog: Track onboarding page view
    this.trackPostHog('OnboardingPageViewed', {});
  }

  /**
   * Track swap page view
   */
  trackSwapViewed(): void {
    this.trackCustom('SwapViewed');
    // TikTok: Track as ViewContent
    this.trackTikTokViewContent({
      contentId: 'swap',
      contentType: 'product',
      contentName: 'Swap Page',
    });
    // Vercel: Track swap page view
    track('SwapViewed', {});
    // PostHog: Track swap page view
    this.trackPostHog('SwapViewed', {});
  }

  /**
   * Track successful engagement reward claim
   */
  trackEngagement(params?: EngagementEventParams): void {
    const eventId = params?.transactionHash || `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    this.trackCustom('EngagementRewardClaimed', {
      value: 3000,
      currency: 'G$',
      ...params,
    });
    
    // TikTok: Track as Lead (conversion event)
    this.trackTikTokLead({
      contentId: 'engagement_reward',
      contentType: 'product',
      contentName: 'Engagement Reward Claim',
      value: 0.3,
      currency: 'USD',
      eventId: eventId,
    });
    
    // Vercel: Track engagement reward claim
    track('EngagementRewardClaimed', {});
    
    // PostHog: Track engagement reward claim
    this.trackPostHog('EngagementRewardClaimed', {
      transactionHash: params?.transactionHash,
      amount: params?.amount || '3000',
      success: params?.success ?? true,
      currency: 'G$',
      value: 3000,
    });
  }

  /**
   * Track successful engagement reward claim from Facebook ad
   */
  trackEngagementFromAd(params?: EngagementEventParams): void {
    const eventId = params?.transactionHash || `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    this.trackCustom('EngagementRewardClaimedFromAd', {
      value: 3000,
      currency: 'G$',
      ...params,
    });
    
    // TikTok: Track as Lead (conversion event from ad)
    this.trackTikTokLead({
      contentId: 'engagement_reward_ad',
      contentType: 'product',
      contentName: 'Engagement Reward Claim From Ad',
      value: 0.3,
      currency: 'USD',
      eventId: eventId,
    });
    
    // Vercel: Track engagement reward claim from ad
    track('EngagementRewardClaimedFromAd', {});
    
    // PostHog: Track engagement reward claim from ad
    this.trackPostHog('EngagementRewardClaimedFromAd', {
      transactionHash: params?.transactionHash,
      amount: params?.amount || '3000',
      success: params?.success ?? true,
      currency: 'G$',
      value: 3000,
      fbclid: params?.fbclid,
      source: 'facebook_ad',
    });
  }

  /**
   * Track successful UBI claim
   */
  trackUBIClaim(params?: ClaimEventParams): void {
    const eventId = params?.transactionHash || `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const amount = params?.amount ? parseFloat(params.amount) : undefined;
    
    this.trackCustom('UBIClaimed', {
      currency: 'G$',
      ...params,
    });
    
    // TikTok: Track as Lead (conversion event)
    this.trackTikTokLead({
      contentId: 'ubi_claim',
      contentType: 'product',
      contentName: 'UBI Claim',
      value: amount ? amount * 0.0001 : undefined,
      currency: 'USD',
      eventId: eventId,
    });
    
    // Vercel: Track UBI claim
    track('UBIClaimed', {});
    
    // PostHog: Track UBI claim
    this.trackPostHog('UBIClaimed', {
      transactionHash: params?.transactionHash,
      amount: params?.amount,
      tokenSymbol: params?.tokenSymbol || 'G$',
      currency: 'G$',
      value: amount,
    });
  }

  /**
   * Track wallet verification completion
   */
  trackVerification(params?: VerificationEventParams): void {
    const eventId = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    this.trackCustom('WalletVerified', {
      ...params,
    });
    
    // TikTok: Track as Contact (user completed verification/contact form equivalent)
    this.trackTikTokContact({
      contentId: 'wallet_verification',
      contentType: 'product',
      contentName: 'Wallet Verification',
      eventId: eventId,
    });
    
    // Vercel: Track wallet verification
    track('WalletVerified', {});
    
    // PostHog: Track wallet verification
    this.trackPostHog('WalletVerified', {
      walletAddress: params?.walletAddress,
      isVerified: params?.isVerified ?? true,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export class for testing or custom instances
export { AnalyticsService };
