// src/services/helpService.ts
// Contextual Help and Troubleshooting Service

import { logger } from '../utils/logger';

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'authentication' | 'mfa' | 'devices' | 'troubleshooting' | 'general';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  steps?: Array<{
    title: string;
    description: string;
    action?: string;
    image?: string;
  }>;
  relatedArticles: string[];
  lastUpdated: Date;
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  causes: Array<{
    description: string;
    likelihood: 'high' | 'medium' | 'low';
    solutions: Array<{
      title: string;
      description: string;
      steps: string[];
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedTime: number;
    }>;
  }>;
  preventionTips: string[];
  whenToContactSupport: string[];
}

export interface ContextualHelp {
  stepId: string;
  helpItems: Array<{
    type: 'tip' | 'warning' | 'info' | 'troubleshooting';
    title: string;
    content: string;
    action?: {
      label: string;
      handler: () => void;
    };
  }>;
  quickActions: Array<{
    label: string;
    description: string;
    handler: () => void;
    icon?: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
    helpful?: boolean;
  }>;
}

export interface HelpMetrics {
  totalViews: number;
  popularArticles: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  searchQueries: Array<{
    query: string;
    count: number;
    results: number;
  }>;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    averageRating: number;
  };
  supportTickets: number;
}

class HelpService {
  private static helpContent = new Map<string, HelpContent>();
  private static troubleshootingGuides = new Map<string, TroubleshootingGuide>();
  private static contextualHelp = new Map<string, ContextualHelp>();
  private static helpMetrics: HelpMetrics = {
    totalViews: 0,
    popularArticles: [],
    searchQueries: [],
    userFeedback: { helpful: 0, notHelpful: 0, averageRating: 0 },
    supportTickets: 0
  };
  private static userFeedback = new Map<string, { helpful: boolean; rating?: number }>();

  /**
   * Initialize help service with default content
   */
  static initialize(): void {
    this.loadDefaultHelpContent();
    this.loadDefaultTroubleshootingGuides();
    this.loadDefaultContextualHelp();
    
    logger.info('HelpService', 'Help service initialized', {
      helpArticles: this.helpContent.size,
      troubleshootingGuides: this.troubleshootingGuides.size,
      contextualHelp: this.contextualHelp.size
    });
  }

  /**
   * Get help content by ID
   */
  static getHelpContent(id: string): HelpContent | null {
    const content = this.helpContent.get(id);
    if (content) {
      this.helpMetrics.totalViews++;
      this.updatePopularArticles(id, content.title);
    }
    return content || null;
  }

  /**
   * Search help content
   */
  static searchHelpContent(query: string, filters?: {
    category?: HelpContent['category'];
    difficulty?: HelpContent['difficulty'];
    tags?: string[];
  }): HelpContent[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery) {
      this.trackSearchQuery(normalizedQuery);
    }
    
    let results = Array.from(this.helpContent.values());
    
    // Apply text search
    if (normalizedQuery) {
      results = results.filter(content => 
        content.title.toLowerCase().includes(normalizedQuery) ||
        content.description.toLowerCase().includes(normalizedQuery) ||
        content.content.toLowerCase().includes(normalizedQuery) ||
        content.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.category) {
        results = results.filter(content => content.category === filters.category);
      }
      if (filters.difficulty) {
        results = results.filter(content => content.difficulty === filters.difficulty);
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(content => 
          filters.tags!.some(tag => content.tags.includes(tag))
        );
      }
    }
    
    // Sort by relevance (simple scoring)
    if (normalizedQuery) {
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, normalizedQuery);
        const scoreB = this.calculateRelevanceScore(b, normalizedQuery);
        return scoreB - scoreA;
      });
    }
    
    return results;
  }

  /**
   * Get troubleshooting guide
   */
  static getTroubleshootingGuide(id: string): TroubleshootingGuide | null {
    return this.troubleshootingGuides.get(id) || null;
  }

  /**
   * Find troubleshooting guides by symptoms
   */
  static findTroubleshootingBySymptoms(symptoms: string[]): TroubleshootingGuide[] {
    const normalizedSymptoms = symptoms.map(s => s.toLowerCase());
    
    return Array.from(this.troubleshootingGuides.values())
      .filter(guide => 
        guide.symptoms.some(symptom => 
          normalizedSymptoms.some(userSymptom => 
            symptom.toLowerCase().includes(userSymptom) ||
            userSymptom.includes(symptom.toLowerCase())
          )
        )
      )
      .sort((a, b) => {
        // Sort by number of matching symptoms
        const matchesA = a.symptoms.filter(symptom => 
          normalizedSymptoms.some(userSymptom => 
            symptom.toLowerCase().includes(userSymptom)
          )
        ).length;
        const matchesB = b.symptoms.filter(symptom => 
          normalizedSymptoms.some(userSymptom => 
            symptom.toLowerCase().includes(userSymptom)
          )
        ).length;
        return matchesB - matchesA;
      });
  }

  /**
   * Get contextual help for current step
   */
  static getContextualHelp(stepId: string): ContextualHelp | null {
    return this.contextualHelp.get(stepId) || null;
  }

  /**
   * Get help suggestions based on current context
   */
  static getHelpSuggestions(context: {
    step?: string;
    error?: string;
    deviceType?: string;
    userAgent?: string;
  }): HelpContent[] {
    const suggestions: HelpContent[] = [];
    
    // Get contextual help first
    if (context.step) {
      const contextualHelp = this.getContextualHelp(context.step);
      if (contextualHelp) {
        // Convert contextual help to help content format
        contextualHelp.helpItems.forEach((item, index) => {
          suggestions.push({
            id: `contextual_${context.step}_${index}`,
            title: item.title,
            description: item.content.substring(0, 100) + '...',
            content: item.content,
            category: 'general',
            tags: [context.step || 'general'],
            difficulty: 'beginner',
            estimatedTime: 2,
            relatedArticles: [],
            lastUpdated: new Date()
          });
        });
      }
    }
    
    // Add error-specific help
    if (context.error) {
      const errorHelp = this.searchHelpContent(context.error, { category: 'troubleshooting' });
      suggestions.push(...errorHelp.slice(0, 3));
    }
    
    // Add device-specific help
    if (context.deviceType) {
      const deviceHelp = this.searchHelpContent(context.deviceType, { category: 'devices' });
      suggestions.push(...deviceHelp.slice(0, 2));
    }
    
    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    return uniqueSuggestions.slice(0, 5);
  }

  /**
   * Submit user feedback on help content
   */
  static submitFeedback(contentId: string, feedback: {
    helpful: boolean;
    rating?: number;
    comment?: string;
  }): void {
    this.userFeedback.set(contentId, {
      helpful: feedback.helpful,
      rating: feedback.rating
    });
    
    // Update metrics
    if (feedback.helpful) {
      this.helpMetrics.userFeedback.helpful++;
    } else {
      this.helpMetrics.userFeedback.notHelpful++;
    }
    
    if (feedback.rating) {
      const totalRatings = this.helpMetrics.userFeedback.helpful + this.helpMetrics.userFeedback.notHelpful;
      const currentTotal = this.helpMetrics.userFeedback.averageRating * (totalRatings - 1);
      this.helpMetrics.userFeedback.averageRating = (currentTotal + feedback.rating) / totalRatings;
    }
    
    logger.info('HelpService', 'User feedback submitted', {
      contentId,
      helpful: feedback.helpful,
      rating: feedback.rating
    });
  }

  /**
   * Get help metrics and analytics
   */
  static getHelpMetrics(): HelpMetrics {
    return { ...this.helpMetrics };
  }

  /**
   * Create support ticket
   */
  static createSupportTicket(ticket: {
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    userInfo?: {
      userId?: string;
      email?: string;
      deviceInfo?: string;
    };
  }): string {
    const ticketId = `HELP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.helpMetrics.supportTickets++;
    
    // In a real implementation, this would submit to a ticketing system
    logger.info('HelpService', 'Support ticket created', {
      ticketId,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority
    });
    
    return ticketId;
  }

  /**
   * Get FAQ for specific topic
   */
  static getFAQ(topic?: string): Array<{ question: string; answer: string; category: string }> {
    const allFAQ = [
      {
        question: 'What is multi-factor authentication (MFA)?',
        answer: 'MFA is a security method that requires two or more verification factors to gain access to your account, making it much more secure than just using a password.',
        category: 'general'
      },
      {
        question: 'Why do I need to set up MFA?',
        answer: 'MFA significantly increases your account security by requiring additional verification beyond just your password. This protects against unauthorized access even if your password is compromised.',
        category: 'general'
      },
      {
        question: 'What MFA methods are available?',
        answer: 'You can use SMS text messages, email codes, authenticator apps (TOTP), security keys (FIDO2), or mobile push notifications depending on what your organization has enabled.',
        category: 'devices'
      },
      {
        question: 'I\'m not receiving SMS codes. What should I do?',
        answer: 'Check that your phone has signal, verify the phone number is correct, and ensure SMS is not blocked. You can also try using an alternative method like email or authenticator app.',
        category: 'troubleshooting'
      },
      {
        question: 'How do I set up an authenticator app?',
        answer: 'Download an authenticator app like Google Authenticator or Microsoft Authenticator, then scan the QR code shown during setup. The app will generate time-based codes for authentication.',
        category: 'devices'
      },
      {
        question: 'What if I lose my phone or security key?',
        answer: 'Contact your administrator immediately. They can help you regain access and set up new authentication methods. This is why it\'s recommended to have multiple backup methods configured.',
        category: 'troubleshooting'
      },
      {
        question: 'Can I use multiple authentication methods?',
        answer: 'Yes, it\'s recommended to set up multiple methods as backups. This ensures you can still access your account if one method becomes unavailable.',
        category: 'devices'
      },
      {
        question: 'How secure are authenticator apps compared to SMS?',
        answer: 'Authenticator apps are generally more secure than SMS because they generate codes locally on your device and are not susceptible to SIM swapping or network interception.',
        category: 'general'
      }
    ];
    
    if (topic) {
      return allFAQ.filter(faq => faq.category === topic);
    }
    
    return allFAQ;
  }

  // Private helper methods

  private static loadDefaultHelpContent(): void {
    const defaultContent: HelpContent[] = [
      {
        id: 'mfa_overview',
        title: 'Understanding Multi-Factor Authentication',
        description: 'Learn what MFA is and why it\'s important for your security',
        content: `Multi-Factor Authentication (MFA) adds an extra layer of security to your account by requiring two or more verification factors. This significantly reduces the risk of unauthorized access, even if your password is compromised.

The three main types of authentication factors are:
1. Something you know (password, PIN)
2. Something you have (phone, security key)
3. Something you are (fingerprint, face recognition)

MFA typically combines at least two of these factors to verify your identity.`,
        category: 'general',
        tags: ['mfa', 'security', 'authentication', 'overview'],
        difficulty: 'beginner',
        estimatedTime: 3,
        steps: [
          {
            title: 'Understanding the Basics',
            description: 'MFA requires multiple forms of verification'
          },
          {
            title: 'Types of Factors',
            description: 'Knowledge, possession, and inherence factors'
          },
          {
            title: 'Benefits',
            description: 'Significantly improved account security'
          }
        ],
        relatedArticles: ['setup_authenticator', 'sms_setup'],
        lastUpdated: new Date()
      },
      {
        id: 'setup_authenticator',
        title: 'Setting Up an Authenticator App',
        description: 'Step-by-step guide to configure TOTP authenticator apps',
        content: `Authenticator apps provide time-based one-time passwords (TOTP) for secure authentication. Here's how to set one up:

1. Download a compatible authenticator app
2. Scan the QR code or enter the setup key manually
3. Verify the setup with a generated code
4. Save backup codes in a secure location

Popular authenticator apps include Google Authenticator, Microsoft Authenticator, and Authy.`,
        category: 'devices',
        tags: ['totp', 'authenticator', 'setup', 'qr-code'],
        difficulty: 'beginner',
        estimatedTime: 5,
        steps: [
          {
            title: 'Download App',
            description: 'Install an authenticator app from your app store'
          },
          {
            title: 'Scan QR Code',
            description: 'Use the app to scan the displayed QR code'
          },
          {
            title: 'Verify Setup',
            description: 'Enter the generated code to confirm setup'
          },
          {
            title: 'Save Backup Codes',
            description: 'Store backup codes in a secure location'
          }
        ],
        relatedArticles: ['mfa_overview', 'backup_codes'],
        lastUpdated: new Date()
      },
      {
        id: 'sms_troubleshooting',
        title: 'SMS Code Issues and Solutions',
        description: 'Common problems with SMS authentication and how to fix them',
        content: `If you're having trouble receiving SMS codes, try these solutions:

1. Check your phone signal and ensure SMS is enabled
2. Verify the phone number is correct in your account
3. Check if SMS messages are being blocked or filtered
4. Try requesting a new code after a few minutes
5. Contact your mobile carrier if issues persist

Alternative solutions include using email codes or authenticator apps.`,
        category: 'troubleshooting',
        tags: ['sms', 'troubleshooting', 'phone', 'codes'],
        difficulty: 'beginner',
        estimatedTime: 4,
        relatedArticles: ['setup_authenticator', 'email_setup'],
        lastUpdated: new Date()
      }
    ];

    defaultContent.forEach(content => {
      this.helpContent.set(content.id, content);
    });
  }

  private static loadDefaultTroubleshootingGuides(): void {
    const defaultGuides: TroubleshootingGuide[] = [
      {
        id: 'sms_not_received',
        title: 'SMS Verification Code Not Received',
        description: 'Troubleshoot issues with SMS code delivery',
        symptoms: [
          'SMS code not arriving',
          'Delayed SMS messages',
          'No text message received',
          'SMS verification failing'
        ],
        causes: [
          {
            description: 'Poor cellular signal or network issues',
            likelihood: 'high',
            solutions: [
              {
                title: 'Check Signal Strength',
                description: 'Ensure you have adequate cellular signal',
                steps: [
                  'Check signal bars on your phone',
                  'Move to an area with better reception',
                  'Try switching between WiFi and cellular data'
                ],
                difficulty: 'easy',
                estimatedTime: 2
              }
            ]
          },
          {
            description: 'Incorrect phone number in account',
            likelihood: 'medium',
            solutions: [
              {
                title: 'Verify Phone Number',
                description: 'Check that your phone number is correct',
                steps: [
                  'Review the phone number shown on screen',
                  'Contact administrator to update if incorrect',
                  'Ensure country code is included if required'
                ],
                difficulty: 'easy',
                estimatedTime: 3
              }
            ]
          }
        ],
        preventionTips: [
          'Keep your phone number updated in your account',
          'Set up multiple authentication methods as backups',
          'Test SMS delivery periodically'
        ],
        whenToContactSupport: [
          'SMS codes consistently not received after 10 minutes',
          'Phone number cannot be updated',
          'All alternative methods are unavailable'
        ]
      }
    ];

    defaultGuides.forEach(guide => {
      this.troubleshootingGuides.set(guide.id, guide);
    });
  }

  private static loadDefaultContextualHelp(): void {
    const defaultContextualHelp: Array<[string, ContextualHelp]> = [
      ['authentication', {
        stepId: 'authentication',
        helpItems: [
          {
            type: 'info',
            title: 'Secure Sign-In',
            content: 'Enter your username and password to begin the authentication process. Your credentials are encrypted and transmitted securely.'
          },
          {
            type: 'tip',
            title: 'Password Security',
            content: 'Use a strong, unique password for your account. Consider using a password manager to generate and store secure passwords.'
          }
        ],
        quickActions: [
          {
            label: 'Forgot Password',
            description: 'Reset your password if you can\'t remember it',
            handler: () => console.log('Password reset')
          },
          {
            label: 'Need Help?',
            description: 'Get assistance with sign-in issues',
            handler: () => console.log('Help requested')
          }
        ],
        faq: [
          {
            question: 'What if I forgot my password?',
            answer: 'Click the "Forgot Password" link to reset your password via email.'
          },
          {
            question: 'Why is my account locked?',
            answer: 'Accounts are temporarily locked after multiple failed login attempts for security. Wait 15 minutes or contact support.'
          }
        ]
      }],
      ['device_selection', {
        stepId: 'device_selection',
        helpItems: [
          {
            type: 'info',
            title: 'Choose Authentication Method',
            content: 'Select from your registered authentication devices. Each method provides secure verification of your identity.'
          },
          {
            type: 'tip',
            title: 'Backup Methods',
            content: 'It\'s recommended to have multiple authentication methods set up in case one becomes unavailable.'
          }
        ],
        quickActions: [
          {
            label: 'Add New Device',
            description: 'Register an additional authentication method',
            handler: () => console.log('Add device')
          },
          {
            label: 'Device Issues',
            description: 'Get help with device problems',
            handler: () => console.log('Device help')
          }
        ],
        faq: [
          {
            question: 'Which method is most secure?',
            answer: 'Security keys (FIDO2) and authenticator apps are generally more secure than SMS or email.'
          },
          {
            question: 'Can I use multiple devices?',
            answer: 'Yes, you can register multiple devices and choose which one to use each time you sign in.'
          }
        ]
      }],
      ['mfa_challenge', {
        stepId: 'mfa_challenge',
        helpItems: [
          {
            type: 'info',
            title: 'Verification in Progress',
            content: 'Complete the verification process using your selected authentication method. Follow the prompts specific to your chosen device.'
          },
          {
            type: 'warning',
            title: 'Time Sensitive',
            content: 'Verification codes are time-sensitive and expire quickly. Enter the code as soon as you receive it.'
          }
        ],
        quickActions: [
          {
            label: 'Resend Code',
            description: 'Request a new verification code',
            handler: () => console.log('Resend code')
          },
          {
            label: 'Try Different Method',
            description: 'Use an alternative authentication device',
            handler: () => console.log('Switch method')
          }
        ],
        faq: [
          {
            question: 'How long is the code valid?',
            answer: 'Verification codes typically expire within 5-10 minutes for security reasons.'
          },
          {
            question: 'What if the code doesn\'t work?',
            answer: 'Ensure you\'re entering the most recent code. If issues persist, try requesting a new code or use an alternative method.'
          }
        ]
      }]
    ];

    defaultContextualHelp.forEach(([stepId, help]) => {
      this.contextualHelp.set(stepId, help);
    });
  }

  private static calculateRelevanceScore(content: HelpContent, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title match (highest weight)
    if (content.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Description match
    if (content.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    
    // Content match
    if (content.content.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    // Tag match
    content.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 2;
      }
    });
    
    return score;
  }

  private static updatePopularArticles(id: string, title: string): void {
    const existing = this.helpMetrics.popularArticles.find(article => article.id === id);
    
    if (existing) {
      existing.views++;
    } else {
      this.helpMetrics.popularArticles.push({ id, title, views: 1 });
    }
    
    // Keep only top 10 and sort by views
    this.helpMetrics.popularArticles.sort((a, b) => b.views - a.views);
    this.helpMetrics.popularArticles = this.helpMetrics.popularArticles.slice(0, 10);
  }

  private static trackSearchQuery(query: string): void {
    const existing = this.helpMetrics.searchQueries.find(sq => sq.query === query);
    
    if (existing) {
      existing.count++;
    } else {
      const results = this.searchHelpContent(query).length;
      this.helpMetrics.searchQueries.push({ query, count: 1, results });
    }
    
    // Keep only top 20 queries
    this.helpMetrics.searchQueries.sort((a, b) => b.count - a.count);
    this.helpMetrics.searchQueries = this.helpMetrics.searchQueries.slice(0, 20);
  }
}

export default HelpService;