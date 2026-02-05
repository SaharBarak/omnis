/**
 * Google Analytics 4 Event Tracking Utility
 *
 * Comprehensive event tracking for Omnis app
 * Tracks user interactions, conversions, engagement, and errors
 */

// Type definitions for GA4 events
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string | Record<string, any>,
      config?: Record<string, any>
    ) => void;
  }
}

// Event Categories
export const EventCategory = {
  // Navigation & Page Views
  NAVIGATION: 'navigation',
  PAGE_VIEW: 'page_view',

  // User Interactions
  USER_ACTION: 'user_action',
  CLICK: 'click',
  FORM: 'form',

  // Content Engagement
  CONTENT: 'content',
  ENGAGEMENT: 'engagement',

  // Features Usage
  FEATURE: 'feature_usage',
  CALCULATION: 'calculation',

  // Conversions
  CONVERSION: 'conversion',
  SIGNUP: 'signup',

  // Errors & Performance
  ERROR: 'error',
  PERFORMANCE: 'performance',
} as const;

// Helper function to send GA4 events
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Navigation Events
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    timestamp: new Date().toISOString(),
  });
};

export const trackNavigation = (
  destination: string,
  source: string,
  method: 'click' | 'search' | 'direct' = 'click'
) => {
  trackEvent('navigation', {
    category: EventCategory.NAVIGATION,
    destination,
    source,
    method,
  });
};

// User Interaction Events
export const trackButtonClick = (
  buttonName: string,
  location: string,
  context?: string
) => {
  trackEvent('button_click', {
    category: EventCategory.CLICK,
    button_name: buttonName,
    location,
    context,
  });
};

export const trackLinkClick = (
  linkUrl: string,
  linkText: string,
  isExternal: boolean = false
) => {
  trackEvent('link_click', {
    category: EventCategory.CLICK,
    link_url: linkUrl,
    link_text: linkText,
    is_external: isExternal,
  });
};

// Form Events
export const trackFormStart = (formName: string, formId?: string) => {
  trackEvent('form_start', {
    category: EventCategory.FORM,
    form_name: formName,
    form_id: formId,
  });
};

export const trackFormSubmit = (
  formName: string,
  formId?: string,
  success: boolean = true
) => {
  trackEvent('form_submit', {
    category: EventCategory.FORM,
    form_name: formName,
    form_id: formId,
    success,
  });
};

export const trackFormError = (
  formName: string,
  errorField: string,
  errorMessage: string
) => {
  trackEvent('form_error', {
    category: EventCategory.FORM,
    form_name: formName,
    error_field: errorField,
    error_message: errorMessage,
  });
};

// Content Engagement Events
export const trackScroll = (
  scrollDepth: number,
  pagePath: string
) => {
  trackEvent('scroll', {
    category: EventCategory.ENGAGEMENT,
    scroll_depth: scrollDepth,
    page_path: pagePath,
  });
};

export const trackTimeOnPage = (
  pagePath: string,
  timeSpentSeconds: number
) => {
  trackEvent('time_on_page', {
    category: EventCategory.ENGAGEMENT,
    page_path: pagePath,
    time_spent: timeSpentSeconds,
  });
};

export const trackContentView = (
  contentType: string,
  contentId: string,
  contentTitle?: string
) => {
  trackEvent('content_view', {
    category: EventCategory.CONTENT,
    content_type: contentType,
    content_id: contentId,
    content_title: contentTitle,
  });
};

export const trackMediaPlay = (
  mediaType: 'video' | 'audio',
  mediaTitle: string,
  mediaUrl?: string
) => {
  trackEvent('media_play', {
    category: EventCategory.CONTENT,
    media_type: mediaType,
    media_title: mediaTitle,
    media_url: mediaUrl,
  });
};

// Feature Usage Events
export const trackCalculation = (
  calculationType: 'dreamspell' | 'human_design' | 'astrology' | 'gematria',
  input: Record<string, any>,
  success: boolean = true
) => {
  trackEvent('calculation', {
    category: EventCategory.CALCULATION,
    calculation_type: calculationType,
    input_data: JSON.stringify(input),
    success,
  });
};

export const trackFeatureUse = (
  featureName: string,
  featureAction: string,
  additionalData?: Record<string, any>
) => {
  trackEvent('feature_use', {
    category: EventCategory.FEATURE,
    feature_name: featureName,
    feature_action: featureAction,
    ...additionalData,
  });
};

export const trackChartGeneration = (
  chartType: string,
  chartId?: string,
  generationTimeMs?: number
) => {
  trackEvent('chart_generation', {
    category: EventCategory.FEATURE,
    chart_type: chartType,
    chart_id: chartId,
    generation_time_ms: generationTimeMs,
  });
};

export const trackPDFDownload = (
  documentType: string,
  documentId: string
) => {
  trackEvent('pdf_download', {
    category: EventCategory.FEATURE,
    document_type: documentType,
    document_id: documentId,
  });
};

export const trackShare = (
  shareType: 'social' | 'email' | 'link',
  platform?: string,
  contentType?: string
) => {
  trackEvent('share', {
    category: EventCategory.FEATURE,
    share_type: shareType,
    platform,
    content_type: contentType,
  });
};

// Conversion Events
export const trackSignup = (
  method: 'email' | 'google' | 'facebook' | 'other',
  success: boolean = true
) => {
  trackEvent('sign_up', {
    category: EventCategory.SIGNUP,
    method,
    success,
  });
};

export const trackLogin = (
  method: 'email' | 'google' | 'facebook' | 'other',
  success: boolean = true
) => {
  trackEvent('login', {
    category: EventCategory.CONVERSION,
    method,
    success,
  });
};

export const trackConversion = (
  conversionType: string,
  conversionValue?: number,
  currency: string = 'USD'
) => {
  trackEvent('conversion', {
    category: EventCategory.CONVERSION,
    conversion_type: conversionType,
    value: conversionValue,
    currency,
  });
};

// Error Tracking Events
export const trackError = (
  errorType: 'client' | 'server' | 'network',
  errorMessage: string,
  errorStack?: string,
  errorLocation?: string
) => {
  trackEvent('error', {
    category: EventCategory.ERROR,
    error_type: errorType,
    error_message: errorMessage,
    error_stack: errorStack,
    error_location: errorLocation,
    timestamp: new Date().toISOString(),
  });
};

export const track404 = (pagePath: string, referrer?: string) => {
  trackEvent('page_not_found', {
    category: EventCategory.ERROR,
    page_path: pagePath,
    referrer,
  });
};

// Performance Tracking Events
export const trackPerformance = (
  metricName: string,
  metricValue: number,
  unit: 'ms' | 's' | 'bytes' = 'ms'
) => {
  trackEvent('performance_metric', {
    category: EventCategory.PERFORMANCE,
    metric_name: metricName,
    metric_value: metricValue,
    unit,
  });
};

export const trackAPICall = (
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number,
  success: boolean
) => {
  trackEvent('api_call', {
    category: EventCategory.PERFORMANCE,
    endpoint,
    method,
    duration_ms: durationMs,
    status_code: statusCode,
    success,
  });
};

// Search Events
export const trackSearch = (
  searchTerm: string,
  searchLocation: string,
  resultsCount?: number
) => {
  trackEvent('search', {
    search_term: searchTerm,
    search_location: searchLocation,
    results_count: resultsCount,
  });
};

// Custom Event for any other tracking needs
export const trackCustom = (
  eventName: string,
  eventData: Record<string, any>
) => {
  trackEvent(eventName, eventData);
};

// Utility function to track page session time
export const createPageTimeTracker = (pagePath: string) => {
  const startTime = Date.now();

  return () => {
    const endTime = Date.now();
    const timeSpentSeconds = Math.round((endTime - startTime) / 1000);
    trackTimeOnPage(pagePath, timeSpentSeconds);
  };
};

// Export all tracking functions
export const analytics = {
  // Navigation
  trackPageView,
  trackNavigation,

  // Interactions
  trackButtonClick,
  trackLinkClick,

  // Forms
  trackFormStart,
  trackFormSubmit,
  trackFormError,

  // Engagement
  trackScroll,
  trackTimeOnPage,
  trackContentView,
  trackMediaPlay,

  // Features
  trackCalculation,
  trackFeatureUse,
  trackChartGeneration,
  trackPDFDownload,
  trackShare,

  // Conversions
  trackSignup,
  trackLogin,
  trackConversion,

  // Errors
  trackError,
  track404,

  // Performance
  trackPerformance,
  trackAPICall,

  // Search
  trackSearch,

  // Custom
  trackCustom,
  trackEvent,

  // Utilities
  createPageTimeTracker,
};
