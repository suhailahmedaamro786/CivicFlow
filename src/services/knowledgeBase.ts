import { KnowledgeDocument } from '../types';

export const INITIAL_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'kb-sb-001',
    title: 'Uniform Business Organizations Code — LLC Formation & Articles of Organization',
    codeReference: 'State Corp. Code § 17702.01',
    authority: 'Secretary of State, Division of Corporations',
    jurisdiction: 'State Regulatory Authority',
    category: 'business_licensing',
    lastUpdated: '2026-01-15',
    verifiedByLegalOfficer: true,
    content: `State Corporation Code § 17702.01 mandates that in order to form a Limited Liability Company (LLC), one or more persons must deliver signed Articles of Organization (Form LLC-1) to the Secretary of State for filing.

Mandatory Filing Information:
1. Exact registered entity name, which must include 'Limited Liability Company', 'LLC', or 'L.L.C.'.
2. Registered Agent for Service of Process with a physical street address within the state.
3. Management structure disclosure: whether managed by one manager, more than one manager, or all LLC member(s).
4. Initial filing statutory fee: $70.00 standard processing fee, plus mandatory $20 Statement of Information (Form LLC-12) due within 90 calendar days of formation.
5. Franchise Tax: LLCs are subject to an annual minimum franchise tax fee ($800) due by the 15th day of the 4th month of the taxable year, subject to statutory exemptions for first-year new entities.`,
    chunksCount: 3,
    chunks: [
      {
        id: 'chk-001-a',
        docId: 'kb-sb-001',
        title: 'LLC Formation & Articles of Organization Filing Rules',
        section: '§ 17702.01(a)-(c)',
        content: "Form LLC-1 must be filed with the Secretary of State along with the mandatory $70 filing fee. Must designate an in-state registered agent with physical address.",
        tokens: 38,
        embeddingVectorPreview: [0.042, -0.198, 0.321, 0.089, -0.512]
      },
      {
        id: 'chk-001-b',
        docId: 'kb-sb-001',
        title: 'Statement of Information & Franchise Tax Timelines',
        section: '§ 17702.04 & Tax Code § 17941',
        content: "Form LLC-12 Statement of Information is required within 90 days ($20 fee). Minimum annual state franchise tax applies thereafter.",
        tokens: 32,
        embeddingVectorPreview: [0.015, -0.210, 0.405, 0.124, -0.490]
      }
    ]
  },
  {
    id: 'kb-sb-002',
    title: 'Municipal General Business Tax & Local Licensing Ordinance',
    codeReference: 'Mun. Code Title 5, Chapter 5.04.010',
    authority: 'City Office of Finance & Revenue',
    jurisdiction: 'Municipal City Center',
    category: 'business_licensing',
    lastUpdated: '2026-02-01',
    verifiedByLegalOfficer: true,
    content: `Municipal Code Chapter 5.04.010 states: No person shall engage in, conduct, manage, or carry on any trade, calling, profession, or business within the corporate limits of the City without first having obtained a valid Business Tax Registration Certificate (BTRC).

Key Compliance Elements:
1. Application Deadline: Registration must occur prior to commencing commercial operations or within 30 days of opening physical/home office premises.
2. Registration Base Fee: $50.00 base administrative fee plus gross receipts tax bracket calculation.
3. Home-Based Businesses: Must file a Home Occupation Permit affidavit certifying that business activities will not generate excessive vehicular traffic, commercial signage, or hazardous chemical storage.
4. Renewal: Annually by February 28th. Delinquent renewals accrue a 10% monthly compounding penalty.`,
    chunksCount: 2,
    chunks: [
      {
        id: 'chk-002-a',
        docId: 'kb-sb-002',
        title: 'Mandatory Business Tax Registration Certificate (BTRC)',
        section: 'Mun. Code § 5.04.010',
        content: "Every business operating within city limits must secure a Business Tax Registration Certificate within 30 days of commencing operations. $50 initial filing fee.",
        tokens: 36,
        embeddingVectorPreview: [0.088, -0.144, 0.298, 0.341, -0.388]
      },
      {
        id: 'chk-002-b',
        docId: 'kb-sb-002',
        title: 'Home Occupation Affidavit Standards',
        section: 'Mun. Code § 5.04.120',
        content: "Home-based operations must certify compliance with residential quiet enjoyment, zero exterior commercial signage, and no hazardous substances on residential parcel.",
        tokens: 33,
        embeddingVectorPreview: [0.102, -0.115, 0.210, 0.280, -0.340]
      }
    ]
  },
  {
    id: 'kb-sb-003',
    title: 'Fictitious Business Name (DBA) Statements & Publication Mandate',
    codeReference: 'Bus. & Prof. Code § 17900 - 17930',
    authority: 'County Clerk-Recorder',
    jurisdiction: 'County Administrative Division',
    category: 'business_licensing',
    lastUpdated: '2025-11-20',
    verifiedByLegalOfficer: true,
    content: `Business and Professions Code Section 17900 dictates that any person or business entity regularly transacting business for profit under a fictitious business name (any name that does not include the legal surname of the individual or the exact registered entity name) must file a Fictitious Business Name (FBN) Statement with the County Clerk.

Procedure:
1. Filing: Deliver Form FBN-100 to the County Clerk within 40 calendar days of transacting business. County fee is $26.00 for the first name and owner, plus $5.00 for each additional name.
2. Legal Publication Requirement: Within 30 days of filing the FBN statement, the registrant must publish the statement in a certified newspaper of general circulation once per week for four (4) consecutive weeks.
3. Proof of Publication: The newspaper publisher provides an Affidavit of Publication, which must be filed with the County Clerk within 30 days of the final publication date.`,
    chunksCount: 2,
    chunks: [
      {
        id: 'chk-003-a',
        docId: 'kb-sb-003',
        title: 'DBA / Fictitious Business Name County Filing',
        section: 'Bus. & Prof. Code § 17910',
        content: "File Fictitious Business Name statement with County Clerk within 40 days of starting business. $26 base fee for first business name.",
        tokens: 34,
        embeddingVectorPreview: [0.120, -0.090, 0.260, 0.170, -0.410]
      },
      {
        id: 'chk-003-b',
        docId: 'kb-sb-003',
        title: 'Four-Week Mandatory Legal Publication',
        section: 'Bus. & Prof. Code § 17917',
        content: "Must publish the FBN statement in an adjudicated general circulation newspaper for 4 consecutive weeks and return proof of publication affidavit.",
        tokens: 35,
        embeddingVectorPreview: [0.095, -0.080, 0.240, 0.190, -0.395]
      }
    ]
  },
  {
    id: 'kb-sb-004',
    title: 'State Board of Equalization / Tax Dept — Seller\'s Permit & Resale Certificate',
    codeReference: 'Rev. & Tax Code § 6066',
    authority: 'Department of Tax and Fee Administration',
    jurisdiction: 'State Tax Administration',
    category: 'business_licensing',
    lastUpdated: '2026-01-10',
    verifiedByLegalOfficer: true,
    content: `Revenue and Taxation Code § 6066 provides that every person desiring to engage in or conduct business as a seller of tangible personal property within the state must apply for a Seller's Permit for each place of business.

Requirements:
1. Application Fee: There is NO state fee to apply for a Seller's Permit (free of charge). A security deposit may be required only if prior tax delinquencies exist.
2. Timing: Must be acquired prior to any sale, lease, or retail transaction of physical goods.
3. Resale Certificate: Allows wholesale purchases of inventory without payment of sales tax at the time of purchase.
4. Federal Employer Identification Number (EIN) or SSN required for electronic issuance via online tax portal.`,
    chunksCount: 1,
    chunks: [
      {
        id: 'chk-004-a',
        docId: 'kb-sb-004',
        title: 'Seller\'s Permit Registration & Resale Exemption',
        section: 'Rev. & Tax Code § 6066',
        content: "Required for retail sales of tangible goods. Free of charge through state online tax portal. Must be obtained prior to first retail sale.",
        tokens: 30,
        embeddingVectorPreview: [0.035, -0.180, 0.310, 0.090, -0.480]
      }
    ]
  },
  {
    id: 'kb-sb-005',
    title: 'Federal Employer Identification Number (FEIN / EIN) Issuance Protocol',
    codeReference: 'Internal Revenue Code 26 U.S.C. § 6109',
    authority: 'Internal Revenue Service (IRS)',
    jurisdiction: 'Federal Government',
    category: 'business_licensing',
    lastUpdated: '2025-10-01',
    verifiedByLegalOfficer: true,
    content: `Under 26 U.S.C. § 6109 and Treasury Regulations § 301.6109-1, any employer, partnership, or limited liability company must obtain an Employer Identification Number (EIN) for federal tax administration, commercial banking, and employee withholding.

Key Rules:
1. Online Application: Available directly through the IRS online portal (Form SS-4).
2. Cost: $0 (Free official government service). Beware of commercial third-party scam services charging fees for EIN assignment.
3. Availability: Issued immediately upon electronic completion for entities whose principal officer possesses a valid SSN or ITIN.
4. Bank Account Requirement: Commercial financial institutions universally require an official IRS EIN Confirmation Letter (CP 575) alongside filed Articles of Organization to open a commercial business checking account.`,
    chunksCount: 1,
    chunks: [
      {
        id: 'chk-005-a',
        docId: 'kb-sb-005',
        title: 'Federal EIN Online Procurement and Banking Prerequisite',
        section: '26 U.S.C. § 6109',
        content: "Free online issuance via IRS Form SS-4. Essential prerequisite for corporate bank account and employee payroll tax filing.",
        tokens: 31,
        embeddingVectorPreview: [0.010, -0.220, 0.390, 0.080, -0.520]
      }
    ]
  },
  {
    id: 'kb-hp-001',
    title: 'Municipal Residential Habitability & Landlord Repair Timelines',
    codeReference: 'Civ. Code § 1941.1 & Mun. Housing Ord. § 12-40',
    authority: 'Housing and Community Development Department',
    jurisdiction: 'Municipal & State Civil Jurisdiction',
    category: 'housing_permits',
    lastUpdated: '2026-02-14',
    verifiedByLegalOfficer: true,
    content: `Civil Code Section 1941.1 establishes that a dwelling is untenantable if it lacks effective waterproofing, functional plumbing, hot and cold running water, adequate heating facilities, or is infested with rodents or vermin.

Notice and Remedy Timelines:
1. Emergency Conditions (no heat, severe water leaks, sewage backup, gas leak): Landlord must initiate remedial action within 24 to 72 hours of written notification.
2. Standard Structural/Appliance Repairs: 30 days is presumed reasonable under law unless notice is accompanied by code enforcement citation.
3. Retaliatory Eviction Shield: Landlord is prohibited from raising rent, decreasing services, or evicting within 180 days of tenant exercising statutory habitability rights (Civ. Code § 1942.5).`,
    chunksCount: 2,
    chunks: [
      {
        id: 'chk-hp-001-a',
        docId: 'kb-hp-001',
        title: 'Statutory Habitability Minimums & Emergency Response Times',
        section: 'Civ. Code § 1941.1',
        content: "Severe plumbing or heating emergencies require 24-72 hour response. Non-emergency standard repairs must be completed within 30 days.",
        tokens: 33,
        embeddingVectorPreview: [-0.020, 0.180, -0.320, 0.150, 0.220]
      }
    ]
  },
  {
    id: 'kb-zp-001',
    title: 'Expedited Residential Solar Photovoltaic & Energy Storage Permitting',
    codeReference: 'Gov. Code § 65850.5 & Municipal Solar Fast-Track Act',
    authority: 'Department of Building and Safety',
    jurisdiction: 'Municipal Building Authority',
    category: 'zoning_planning',
    lastUpdated: '2026-01-20',
    verifiedByLegalOfficer: true,
    content: `State Government Code § 65850.5 requires all local jurisdictions to adopt an administrative, nondiscretionary expedited permitting review process for residential rooftop solar energy systems under 38.4 kW direct current.

Streamlined Permitting Requirements:
1. Automated Plan Review: Jurisdictions must offer standard electronic checklist submittals (SolarAPP+ compatible).
2. Review Window: Must be approved or rejected with specific deficiencies within 3 business days of submission.
3. Consolidated Inspection: Single combined building, electrical, and structural inspection scheduled within 5 days of applicant request.
4. Maximum Permit Fee: Capped by state statute at $450 for residential rooftop installations.`,
    chunksCount: 1,
    chunks: [
      {
        id: 'chk-zp-001-a',
        docId: 'kb-zp-001',
        title: 'Solar Fast-Track Review and Fee Ceiling Mandate',
        section: 'Gov. Code § 65850.5',
        content: "Expedited 3-day administrative review for residential solar under 38.4kW. Statutory fee ceiling capped at $450.",
        tokens: 32,
        embeddingVectorPreview: [0.150, 0.080, 0.120, -0.310, 0.180]
      }
    ]
  }
];
