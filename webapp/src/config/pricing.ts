// Centralized Pricing & Subscription Configuration for MedTechFixaters
// Single source of truth for plans, pricing numbers, and feature allowances.
// Note: All amounts are server-validated; clients cannot modify amounts payable.

export interface PricingPlan {
  id: 'doctor_intro_500' | 'doctor_monthly_5000' | 'doctor_yearly_50000' | 'hospital_custom';
  name: string;
  tagline: string;
  targetAudience: string;
  price: number | null; // null for custom pricing
  originalPrice?: number;
  discountBadge?: string;
  currency: string;
  billingFrequency: string;
  secondaryBillingNote?: string;
  termsDisclosure: string;
  ctaText: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
  badge?: string;
  features: string[];
  omittedFeatures?: string[];
  highlights?: string[];
}

export interface FeatureMatrixCategory {
  category: string;
  items: {
    name: string;
    description: string;
    introDoctor: boolean | string;
    monthlyDoctor: boolean | string;
    hospital: boolean | string;
  }[];
}

export interface PricingFAQ {
  question: string;
  answer: string;
  category: 'pricing' | 'billing' | 'features' | 'security';
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'doctor_intro_500',
    name: 'First Month Special Offer',
    tagline: 'Save 90% on your first month',
    targetAudience: 'Individual doctors and single-counter outpatient clinics',
    price: 500,
    originalPrice: 5000,
    discountBadge: '90% OFF',
    currency: '₹',
    billingFrequency: 'for your first month',
    secondaryBillingNote: 'From month two, ₹5,000 per month.',
    termsDisclosure:
      'Introductory pricing applies to your first month only. From month two, regular ₹5,000 per month applies. No automatic deduction without prior renewal confirmation.',
    ctaText: 'Get Started for ₹500',
    isPopular: true,
    badge: 'Special Introductory Offer',
    features: [
      'Digital receptionist for healthcare facilities',
      'Hospital-specific QR code access for OPD check-in',
      'Doctor discovery and appointment booking',
      'AI-assisted patient triage and chatbot',
      'Live patient queue management with real-time tokens',
      'Online payment integration (UPI, QR & cards)',
      'Separate doctor workspace dashboard with data isolation',
      'Administrative management tools for timings & daily collections',
    ],
    omittedFeatures: [
      'Voice receptionist functionality (Hospital plan only)',
      'Multi-department reception load balancing',
    ],
    highlights: [
      '₹500 for your first month (Regular price ₹5,000)',
      'Save 90% on your first month',
      'From month two, ₹5,000 per month',
      'Full clinical platform unlocked on day one',
    ],
  },
  {
    id: 'doctor_monthly_5000',
    name: 'Doctor and Clinic Plan',
    tagline: 'Consistent, monthly digital healthcare management',
    targetAudience: 'Individual doctors and clinics seeking regular access to MedTechFixaters',
    price: 5000,
    currency: '₹',
    billingFrequency: 'per month',
    secondaryBillingNote: 'Standard monthly subscription. Cancel or renew anytime.',
    termsDisclosure:
      'A monthly subscription for eligible individual doctors and clinics. Billed at ₹5,000 per month. You can review all terms before final checkout.',
    ctaText: 'Subscribe Now',
    isPopular: false,
    badge: 'Monthly Subscription',
    features: [
      'Digital receptionist for healthcare facilities',
      'Hospital-specific QR code access for OPD check-in',
      'Doctor discovery and appointment booking',
      'AI-assisted patient triage and chatbot',
      'Live patient queue management with real-time tokens',
      'Online payment integration (UPI, QR & cards)',
      'Separate doctor workspace dashboard with data isolation',
      'Administrative management tools for timings & daily collections',
    ],
    omittedFeatures: [
      'Voice receptionist functionality (Hospital plan only)',
      'Multi-department reception load balancing',
    ],
    highlights: [
      '₹5,000 per month',
      'Ongoing monthly access with uninterrupted patient queues',
      'All doctor tools & AI triage included',
      'Direct priority WhatsApp & phone assistance',
    ],
  },
  {
    id: 'doctor_yearly_50000',
    name: 'Yearly Doctor & Clinic Pro',
    tagline: 'Annual subscription with 2 months free + custom clinic website',
    targetAudience: 'Doctors & clinics wanting full web presence and annual savings',
    price: 50000,
    originalPrice: 60000,
    discountBadge: '2 MONTHS FREE',
    currency: '₹',
    billingFrequency: 'per year (Save ₹10,000)',
    secondaryBillingNote: 'Includes 2 months free + free custom clinic website design & hosting.',
    termsDisclosure:
      'Full 12-month license billed annually at ₹50,000. Includes complimentary custom clinic website build, Google SEO setup, ABDM readiness, and dedicated priority support.',
    ctaText: 'Get Yearly Plan',
    isPopular: false,
    badge: 'Best Value (Annual)',
    features: [
      'Everything in Doctor and Clinic Plan',
      '2 months completely free (₹10,000 savings)',
      'Free custom clinic website & domain setup',
      'Google Business Profile & Local SEO Optimization',
      'ABDM M1 & M2 integration ready',
      'Dedicated account manager & 24/7 SLA',
      'Separate doctor workspace dashboard with data isolation',
      'Administrative management tools for timings & daily collections',
    ],
    omittedFeatures: [
      'Voice receptionist functionality (Hospital plan only)',
      'Multi-department reception load balancing',
    ],
    highlights: [
      '₹50,000 per year (Save ₹10,000)',
      'Free Custom Clinic Website Designed & Hosted',
      'Zero downtime priority server allocation',
      'Full annual receipt for business expense claim',
    ],
  },
  {
    id: 'hospital_custom',
    name: 'Hospital Solutions',
    tagline: 'Tailored pricing based on your hospital’s operational and technical requirements',
    targetAudience: 'Hospitals, multi-doctor facilities, and larger healthcare organizations',
    price: null, // Custom Pricing
    currency: '',
    billingFrequency: 'Custom Pricing',
    secondaryBillingNote: 'Enterprise SLA & dedicated engineering team included.',
    termsDisclosure:
      'Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. Contact our enterprise team for a custom quote.',
    ctaText: 'Contact MedTechFixaters',
    isEnterprise: true,
    badge: 'Enterprise Healthcare',
    features: [
      'Digital receptionist for healthcare facilities with multi-counter routing',
      'Hospital-specific QR code access for all departments and entrances',
      'Doctor discovery and appointment booking across departments',
      'AI-assisted patient triage and chatbot with department load-balancing',
      'Live patient queue management with TV display board streaming',
      'Online payment integration with department-wise revenue ledger',
      'Voice receptionist functionality with automated audio token callouts',
      'Separate hospital and doctor dashboards with strict PostgreSQL data isolation',
      'Administrative management tools with role-based access & audit logs',
    ],
    highlights: [
      'Custom Pricing tailored to your scale',
      'Voice receptionist functionality included',
      'Multi-doctor & multi-department architecture',
      'Dedicated hospital onboarding & staff training',
    ],
  },
];

export const FEATURE_COMPARISON_MATRIX: FeatureMatrixCategory[] = [
  {
    category: 'Patient Check-in & Discovery',
    items: [
      {
        name: 'Digital Receptionist for Healthcare Facilities',
        description: 'Self-service OPD check-in portal requiring no app downloads for patients.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Multi-counter Support',
      },
      {
        name: 'Hospital-specific QR Code Access',
        description: 'Unique branded QR standee and links for instant appointment queue check-in.',
        introDoctor: 'Single Doctor QR',
        monthlyDoctor: 'Single Doctor QR',
        hospital: 'Unlimited Department QRs',
      },
      {
        name: 'Doctor Discovery and Appointment Booking',
        description: 'Direct online patient scheduling with doctor specialty listings and slots.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Cross-Department Booking',
      },
      {
        name: 'Voice Receptionist Functionality',
        description: 'Automated voice TTS patient callouts and smart voice receptionist assistance.',
        introDoctor: false,
        monthlyDoctor: false,
        hospital: true,
      },
    ],
  },
  {
    category: 'Clinical Intelligence & Queue Control',
    items: [
      {
        name: 'AI-assisted Patient Triage and Chatbot',
        description: 'Intelligent symptom collection and pre-consultation medical summary generation.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Triage + Dept Routing',
      },
      {
        name: 'Live Patient Queue Management',
        description: 'Real-time token estimation, live queue telemetry, and walk-in balancing.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Central TV Display Board',
      },
      {
        name: 'Online Payment Integration',
        description: 'Integrated consultation fee collection with UPI, QR, debit/credit cards, and netbanking.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Department Ledger Split',
      },
    ],
  },
  {
    category: 'Dashboards, Administration & Security',
    items: [
      {
        name: 'Separate Hospital and Doctor Dashboards',
        description: 'Clean workspace separation between institutional oversight and private clinical practice.',
        introDoctor: 'Doctor Workspace',
        monthlyDoctor: 'Doctor Workspace',
        hospital: 'Hospital & Doctor Workspaces',
      },
      {
        name: 'PostgreSQL Row-Level Data Isolation',
        description: 'Cryptographic tenant isolation ensuring patient records and consultation notes remain private.',
        introDoctor: true,
        monthlyDoctor: true,
        hospital: 'Enterprise Row-Level Security',
      },
      {
        name: 'Administrative Management Tools',
        description: 'OPD schedule controls, doctor leave calendars, patient follow-up CRM, and revenue audits.',
        introDoctor: 'Single Practice Tools',
        monthlyDoctor: 'Single Practice Tools',
        hospital: 'Full Admin & Role Controls',
      },
    ],
  },
];

export const PRICING_FAQS: PricingFAQ[] = [
  {
    category: 'pricing',
    question: 'How does the ₹500 First Month Special Offer work?',
    answer:
      'The First Month Special Offer gives individual doctors and single-counter clinics complete access to MedTechFixaters for just ₹500 for the first 30 days (a 90% discount off the standard ₹5,000 monthly rate). You experience all core platform capabilities without long-term commitments.',
  },
  {
    category: 'billing',
    question: 'How much will I be charged after the first month?',
    answer:
      'From month two, the regular rate is ₹5,000 per month. MedTechFixaters does not charge hidden surprise fees or force unannounced auto-debits. Before your introductory period ends, you will receive clear notification to renew your subscription for ₹5,000 to maintain uninterrupted service.',
  },
  {
    category: 'billing',
    question: 'Can I redeem the ₹500 introductory offer more than once?',
    answer:
      'No. The ₹500 introductory rate is an exclusive one-time trial incentive for new individual doctor and clinic practices. Our server-side subscription system verifies account and clinic eligibility to ensure fairness.',
  },
  {
    category: 'pricing',
    question: 'What is included in the Doctor and Clinic Plan at ₹5,000/month?',
    answer:
      'The Doctor and Clinic Plan includes the complete digital receptionist, hospital-specific QR code, doctor discovery and appointment booking, AI-assisted patient triage chatbot, live patient queue management, online payment integration, isolated doctor workspace dashboard, and administrative management tools.',
  },
  {
    category: 'features',
    question: 'How does Hospital Solutions custom pricing work?',
    answer:
      'Hospital Solutions is designed for multi-doctor clinics, polyclinics, nursing homes, and multi-bed hospitals. Pricing is customized based on your specific requirements: number of doctors, departments, specialized facilities, voice receptionist setup, display board streaming, and deployment model. Contact MedTechFixaters for an assessment and tailored quotation.',
  },
  {
    category: 'security',
    question: 'How is patient and hospital data protected?',
    answer:
      'MedTechFixaters enforces strict PostgreSQL Row Level Security (RLS) on all database tables. Doctor consultation notes, patient histories, and administrative records are isolated so that each clinic and doctor can only access authorized records. All web traffic and transactions are encrypted via 256-bit SSL.',
  },
  {
    category: 'billing',
    question: 'What payment methods are supported for subscriptions?',
    answer:
      'We accept all major Indian payment methods through our secure Razorpay integration: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards (Visa, MasterCard, RuPay), and Net Banking across 50+ banks.',
  },
  {
    category: 'billing',
    question: 'What is the refund and cancellation policy?',
    answer:
      'You can cancel your subscription at any time. For detailed terms regarding prorated cancellations, consultation refunds, or service guarantees, please refer to our official Refund and Cancellation Policy page.',
  },
];
