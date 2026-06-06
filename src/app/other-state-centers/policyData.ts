// policyData.ts
// Single source of truth for the Other State Centers policy comparison tab.
// Last verified: May 2026. Sources: state legislature bill trackers, state
// revisors of statutes, DOL EBSA, NCEO publications, state agency sites, NYSED
// Office of the Professions, Colorado OEDIT, Missouri Department of Revenue,
// Nebraska Department of Revenue, Maine Revenue Services.
//
// Schema notes:
//   lever: one of the seven policy categories
//   status: "active" | "pending" | "suspended" | "none"
//   isMA: true if this is a Massachusetts entry. Used only for sort ordering
//         (MA entries sort first within each lever). No distinctive styling.

export type LeverId =
  | 'conversion-tax-credit'
  | 'capital-gains'
  | 'direct-assistance'
  | 'state-loans'
  | 'professional-licensure'
  | 'cooperative-statute'
  | 'non-fiscal'

export type PolicyStatus = 'active' | 'pending' | 'suspended' | 'none'

export interface Lever {
  id: LeverId
  title: string
  description: string
}

export interface PolicyEntry {
  lever: LeverId
  state: string
  isMA?: boolean
  mechanism: string
  parameters: string
  citation: string
  effective: string
  status: PolicyStatus
  notes: string
}

export interface BillToWatch {
  state: string
  isMA?: boolean
  billNumber: string
  sponsor: string
  summary: string
  status: string
  relevanceToMA: string
  lever: LeverId
}

export const LEVERS: Lever[] = [
  {
    id: 'conversion-tax-credit',
    title: 'Conversion cost tax credits',
    description:
      'State income tax credits that pay back part of what it costs a business to convert to employee ownership — feasibility studies, legal fees, valuations, and financing costs.',
  },
  {
    id: 'capital-gains',
    title: 'Capital gains incentives for sellers and employee-owners',
    description:
      'State tax breaks that lower or eliminate capital gains tax on two kinds of sales: an owner selling a business to its employees (through an ESOP, worker cooperative, or employee ownership trust), or an employee selling stock they earned through employment.',
  },
  {
    id: 'direct-assistance',
    title: 'State-funded grants & stipends',
    description:
      "Direct state spending — grants, stipends, or vendor contracts to deliver feasibility studies — to help a business convert to employee ownership. Also includes state funding for nonprofits that provide outreach and technical assistance. The dollars are spent and not expected to be repaid. Different from tax credits (Lever 1), which simply reduce a tax bill, and different from loan programs (Lever 4), where the principal flows back over time. New Jersey's $2.7M Employee Stock Ownership Plan (ESOP) Assistance Program and Michigan's $500K Pilot are the clearest recent peer examples.",
  },
  {
    id: 'state-loans',
    title: 'State-funded loan programs',
    description:
      "State financing in the form of direct loans (which the borrower repays), revolving loan funds, linked-deposit arrangements with private banks, or loan guarantees backed by federal State Small Business Credit Initiative (SSBCI) funds. Different from grants and stipends (Lever 3) because the dollars flow back to the state or banking system over time. Massachusetts has a statutorily-established Employee-Ownership Revolving Loan Fund (M.G.L. c. 23D § 16). Among peer states, Minnesota's Community Wealth-Building Loan Program and Vermont's Employee Ownership Loan Fund are the only currently-operational direct lending programs at the state level; Colorado uses SSBCI funds to back private bank loans; Indiana operated a linked-deposit ESOP program from the early 2000s through 2010 that is currently dormant.",
  },
  {
    id: 'professional-licensure',
    title: 'Professional licensure & industry-specific carve-outs',
    description:
      "Changes to laws and licensing rules that let an ESOP or worker cooperative own a business in a regulated industry — architecture, engineering, accounting, law, design, cannabis, and similar fields where ownership is typically restricted to licensed individuals. Massachusetts's Professional Corporations Act (M.G.L. c. 156A) is one of the most restrictive in the country and currently blocks employee ownership of any regulated firm. Virginia (2006), New York (2022), Nebraska (2019), Arizona, Minnesota, and Maryland (cannabis, 2025) have all created workable templates.",
  },
  {
    id: 'cooperative-statute',
    title: 'Cooperative entity & securities reforms',
    description:
      "Updates to the state laws that govern how worker cooperatives are organized, who can be a member, and how they can raise money. Examples: adopting a Limited Cooperative Association statute that lets cooperatives take in outside investor capital while protecting member control; letting nonprofits be cooperative members; and creating securities-law exemptions that lower the legal cost of selling cooperative memberships. Massachusetts's worker cooperative statute (M.G.L. c. 157A) dates to 1982 and has been barely updated since.",
  },
  {
    id: 'non-fiscal',
    title: 'Procurement preferences & contracting access',
    description:
      'State contracting rules that give employee-owned businesses an advantage when bidding on state contracts — without spending new money. Examples: a general bid preference on all state contracts (Oregon), a sector-specific preference on renewable-energy procurement (Maine), and access to existing minority-business set-aside programs (North Carolina). Professional-licensure reforms have their own lever.',
  },
]

export const ENTRIES: PolicyEntry[] = [
  // LEVER 1: Conversion cost tax credits
  {
    lever: 'conversion-tax-credit',
    state: 'Massachusetts',
    isMA: true,
    mechanism: 'No state conversion-cost tax credit. No pending bill to create one.',
    parameters: '—',
    citation: '—',
    effective: '—',
    status: 'none',
    notes: '',
  },
  {
    lever: 'conversion-tax-credit',
    state: 'Colorado',
    mechanism:
      "Refundable state income tax credit covering 75% of the costs a business spends to convert to employee ownership — feasibility studies, legal fees, valuations, and financing costs. Administered by the Colorado Employee Ownership Office (housed at the state's Office of Economic Development and International Trade). Eligible structures include ESOPs, worker cooperatives, employee ownership trusts (EOTs), and a wide range of alternative-equity arrangements (LLC member conversions, phantom stock, profit interests, stock options).",
    parameters:
      'Per-business caps: $150K (ESOP), $40K (worker cooperative or EOT), $25K (alternative equity). Separate refundable credit of up to $167K for the nonprofits, law firms, and advisors that help businesses through a conversion (called "qualified support entities"). $3M annual cap across the whole program. Available through tax year 2031. The 2025 bill also wrote the first state-law definition of an EOT into the books: a trust that holds at least 20% of a business\'s ownership.',
    citation:
      '[HB 25-1021](https://leg.colorado.gov/bills/hb25-1021) (amending C.R.S. § 39-22-542); 2025 Session Laws Ch. 311. Lineage: [HB 21-1311](https://leg.colorado.gov/bills/hb21-1311) (2021, 50% rate) → [HB 23-1081](https://leg.colorado.gov/bills/hb23-1081) (added EOT eligibility) → [HB 25-1021](https://leg.colorado.gov/bills/hb25-1021) (raised rate to 75%, codified EOT definition). Project Equity ranks Colorado as the strongest state EO leader, with 8 bills passed since 2017.',
    effective: 'Signed May 30, 2025; expanded terms effective Jan 1, 2026',
    status: 'active',
    notes: '',
  },
  {
    lever: 'conversion-tax-credit',
    state: 'Colorado',
    mechanism:
      'Refundable income-tax credit covering 50% of post-conversion operating costs for newly-employee-owned businesses (employee-owned for 7 or fewer years). Funds professional services — accounting, legal, advisory — that help young EO firms stay viable through the early years.',
    parameters:
      'Up to $50K per business per year. $1.5M aggregate annual cap. Available tax years 2025–2029. ESOPs, worker cooperatives, EOTs, and defined alternative-equity structures all eligible. Applications opened January 5, 2026 for TY 2025.',
    citation: '[HB 24-1157](https://leg.colorado.gov/bills/hb24-1157) (signed June 4, 2024); C.R.S. § 39-22-542.5',
    effective: 'Tax years 2025–2029; sunset Jan 1, 2035',
    status: 'active',
    notes: '',
  },
  {
    lever: 'conversion-tax-credit',
    state: 'Washington',
    mechanism:
      "Washington's Business and Occupation tax credit covered 50% of the costs of converting to employee ownership. Different per-business caps by structure: ESOPs could earn credit on the first $100,000 of costs (maximum $50,000 credit); worker cooperatives and EOTs only on the first $25,000 (maximum $12,500). The program has been wound down: businesses could not earn new credits after June 30, 2025, and the program statute is repealed effective July 1, 2026.",
    parameters:
      'Per-business cap: $50,000 for ESOPs, $12,500 for worker cooperatives and EOTs. $2 million aggregate annual cap. Program launched July 2024; 5 businesses applied in the inaugural year. SHB 2047 (signed by Gov. Ferguson May 19, 2025) repeals the credit and the underlying program statute.',
      citation:
        '[SB 5096](https://app.leg.wa.gov/billsummary?BillNumber=5096&Year=2023) (2023, codified at [RCW 43.330.590](https://app.leg.wa.gov/RCW/default.aspx?cite=43.330.590)) created the program. Repealed by [SHB 2047](https://app.leg.wa.gov/billsummary?BillNumber=2047&Year=2025) (Ch. 366, Laws of 2025).',
    effective: 'Program ran 2023–2025; statute repealed effective July 1, 2026',
    status: 'suspended',
    notes: '',
  },

  // LEVER 2: Capital gains incentives
  {
    lever: 'capital-gains',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      "Massachusetts has no enacted capital-gains incentive for employee-ownership sales. Sen. Cyr's S. 1950 — the only such bill still alive in the 194th General Court — would exempt all capital gains on the sale of a Massachusetts business with 500 or fewer employees to any employee-ownership structure. A narrower co-op-only companion pair (H. 503 / S. 305, Worrell / Garballey / Mark) capped at $1 million per sale was reported out as a study order in March 2026, which under MA legislative procedure effectively ends the bill for this session.",
    parameters:
      "S. 1950: no dollar cap; all employee-ownership structures eligible; reporting date currently extended to June 25, 2026. H. 503 / S. 305 ($1 million cap; worker cooperative pathway only): both accompanied by study orders (H.503 → H.5178 on March 5, 2026; S.305 → S.3023 on March 19, 2026). Massachusetts's long-term capital-gains rate is 5%, plus a 4% Fair Share Amendment surtax on income above $1 million (indexed), so a sale above $1 million currently faces a combined 9% state rate.",
    citation:
      '[S. 1950](https://malegislature.gov/Bills/194/S1950) (194th Massachusetts General Court, Sen. Cyr — pending). [H. 503](https://malegislature.gov/Bills/194/H503) / [S. 305](https://malegislature.gov/Bills/194/S305) (194th — accompanied a study order, March 2026). S. 1950 has been refiled each session since 2019.',
    effective: '—',
    status: 'pending',
    notes: '',
  },
  {
    lever: 'capital-gains',
    state: 'Colorado',
    mechanism:
      "Two state income tax breaks taking effect in 2027: (1) sellers can exclude the capital gain on a sale of at least 20% ownership to an ESOP, worker cooperative, or employee ownership trust; (2) worker cooperatives can subtract up to $1 million of federal taxable income from Colorado income (a first-of-its-kind cooperative-side deduction nationally).",
    parameters:
      "Capital-gains subtraction amount set annually by Colorado's Office of Economic Development and International Trade. The 20% threshold matches the statutory EOT definition introduced by the same bill. Applies to tax years 2027–2037. Colorado is the only state where EOT sellers receive the same capital-gains treatment as ESOP and cooperative sellers.",
    citation: '[HB 25-1021](https://leg.colorado.gov/bills/hb25-1021)',
    effective: 'Enacted 2025; effective Jan 1, 2027 — Jan 1, 2038',
    status: 'pending',
    notes: '',
  },
  {
    lever: 'capital-gains',
    state: 'Iowa',
    mechanism:
      "Iowa lets a former employee exclude the capital gain on a sale of company stock they earned through employment from state income tax — provided they held the stock at least 10 cumulative years. This is a benefit for employee-shareholders, not for owners selling to an ESOP. Iowa's earlier 50% deduction for sales to ESOPs was phased out effective Jan 1, 2023.",
    parameters:
      "100% exclusion starting tax year 2025 (phased in: 33% in 2023, 66% in 2024). The employee makes a one-time lifetime election that covers subsequent sales of that company's stock for up to 15 years. The company must have employed Iowa workers for at least 10 years, had at least 5 shareholders for 10 years, and have at least 2 unrelated shareholders. Iowa moved to a flat 3.8% individual income-tax rate in 2025.",
    citation: '[Iowa Code § 422.7(42)](https://www.legis.iowa.gov/docs/code/422.7.pdf); Iowa Admin. Code r. 701-302.41',
    effective: 'Effective tax year 2023; 100% rate from tax year 2025',
    status: 'active',
    notes: '',
  },
  {
    lever: 'capital-gains',
    state: 'Maine',
    mechanism:
      'Maine has only a narrow housing-cooperative capital-gains exemption on the books (gains on a sale of a housing-providing business to an affordable housing cooperative). A much broader bill (Sen. Reny\'s LD 756) would have exempted up to $750K per sale to any ESOP, worker cooperative, consumer cooperative, or agricultural producer cooperative — and added a separate interest-income deduction for lenders financing the transfer. LD 756 passed both Maine chambers in June 2025 (vote tallies not independently verified) but died on the Special Appropriations Table when the 132nd Legislature adjourned sine die on April 29, 2026.',
    parameters:
      'Active narrow provision: housing cooperatives only, no dollar cap stated. Proposed broader provision (LD 756, failed): $750K cap per sale; business must be Maine-based and non-publicly-traded.',
    citation: '[36 MRSA § 5122(2)(AAA)](https://legislature.maine.gov/legis/statutes/36/title36sec5122.html) (housing co-op, effective TY 2025); [LD 756](https://legislature.maine.gov/LawMakerWeb/summary.asp?paper=SP0314&snum=132) (Reny, 132nd Leg., 2025) — died on Special Appropriations Table when the 132nd Legislature adjourned sine die April 29, 2026.',
    effective: 'Housing co-op provision: TY 2025. Broader EO deduction: not enacted.',
    status: 'pending',
    notes: '',
  },
  {
    lever: 'capital-gains',
    state: 'Missouri',
    mechanism:
      "Two overlapping Missouri provisions: (1) a 50% state income tax deduction on the capital gain from selling stock to a Missouri ESOP that ends up owning at least 30% of the company; (2) a 100% capital-gains exclusion for all Missouri individuals (not employee-ownership-specific), effective tax year 2025. The new 100% general exclusion effectively supersedes the older 50% ESOP-specific deduction for most individual sellers — though the ESOP-specific rule still matters for pass-through entities and corporate sellers, who don't qualify for the individual-side exclusion.",
    parameters:
      "ESOP-specific deduction: 50% of net capital gain; permanent (no sunset). General deduction: 100% of capital gains for all Missouri individuals starting tax year 2025. A parallel 100% deduction for corporate sellers is triggered only when the Missouri top individual income-tax rate drops to 4.5% or below (currently 4.7%).",
    citation: '[RSMo § 143.114](https://revisor.mo.gov/main/OneSection.aspx?section=143.114) (ESOP-specific; sunset removed by SB 20, 2023); [HB 594](https://www.house.mo.gov/Bill.aspx?bill=HB594&year=2025&code=R) / [RSMo § 143.121](https://revisor.mo.gov/main/OneSection.aspx?section=143.121) (general 100% subtraction, signed 2025)',
    effective: 'ESOP-specific: effective tax year 2023 (RSMo § 143.114 effective Aug 28, 2023). General 100% exclusion: tax year 2025 onward.',
    status: 'active',
    notes: '',
  },
  {
    lever: 'capital-gains',
    state: 'Nebraska',
    mechanism:
      "Nebraska lets a former employee exclude from state income tax the dividends and capital gain on stock of a Nebraska corporation they acquired through employment. The benefit is claimed via a one-time lifetime election. ESOP participants count as individual shareholders for the company's shareholder-count test. Like Iowa's provision, this is a benefit for employee-shareholders — not for owners selling to an ESOP.",
    parameters:
      "One-time lifetime election per individual, for one corporation. The election covers all future dividends and sales of that company's stock. The company must have been doing business in Nebraska at least 3 years, have at least 5 shareholders, and have at least 2 unrelated shareholders each owning ≥10%.",
    citation:
      '[Neb. Rev. Stat. § 77-2715.08](https://nebraskalegislature.gov/laws/statutes.php?statute=77-2715.08) and [§ 77-2715.09](https://nebraskalegislature.gov/laws/statutes.php?statute=77-2715.09); Laws 1987 LB 775 (original); Laws 2013 LB 573 (ESOP-participant clarification). Stewart v. Neb. Dept. of Rev., 294 Neb. 1010 (2016), confirmed that planning a transaction in advance to meet the shareholder-count test is permissible.',
    effective: 'Original law 1987; ESOP-participant clarification 2013',
    status: 'active',
    notes: '',
  },

  // LEVER 3: State-funded grants & stipends
  {
    lever: 'direct-assistance',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      "MassCEO's Technical Assistance Stipend Program will partially subsidize the conversion costs for businesses exploring employee ownership models.",
    parameters:
      'Per-business caps: $25K for ESOPs (50% match on up to $50K in services), $12,500 for worker cooperatives (50% on up to $25K). EOTs not yet eligible. 50% business match required.',
    citation:
      '[RFR BD-26-1100-EED01-EED01-125080](https://www.commbuys.com/bso/external/bidDetail.sdo?docId=BD-26-1100-EED01-EED01-125080) (COMMBUYS) — seven vendors awarded.',
    effective: '—',
    status: 'pending',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'Colorado',
    mechanism:
      "The Rocky Mountain Employee Ownership Center subsidizes rural conversion costs on a case-by-case basis. Direct grants are a secondary mechanism in Colorado — the state's conversion tax credit is the primary tool. Colorado's SSBCI-backed loan program is tracked in the state-funded loan programs lever.",
    parameters: 'Subsidy process and per-business caps not publicly specified. Case-by-case basis.',
    citation: '[Rocky Mountain Employee Ownership Center](https://www.rmeoc.org/) program documentation',
    effective: 'Ongoing',
    status: 'active',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'Iowa',
    mechanism:
      "Iowa Economic Development Authority (IEDA) ESOP Feasibility Study Program reimburses 50% of the cost of an ESOP feasibility study. Closest structural parallel to MassCEO's planned Technical Assistance Stipend Program.",
    parameters:
      'Up to $25K per business. ESOP only. Two-stage disbursement: 50% on study completion, 50% on ESOP formation. Corporations only (LLCs, partnerships, and sole proprietors not eligible). Retail excluded. Informal ~$500K cash-flow minimum. Costs must be incurred after IEDA approval.',
    citation: '[Iowa Administrative Code 261](https://www.legis.iowa.gov/docs/iac/agency/02-22-2023.261.pdf) — IEDA program rules; [Iowa Economic Development Authority](https://www.iowaeda.com/)',
    effective: 'Ongoing (current post-approval rule effective March 2023)',
    status: 'active',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'Michigan',
    mechanism:
      "Michigan Employee Ownership Pilot Program — a $500,000 pilot administered by Michigan's Department of Labor and Economic Opportunity. About 80% ($400,000) reimburses Michigan businesses for feasibility studies, valuations, legal services, and pre-feasibility work. About 20% ($100,000) is a grant to the nonprofit Michigan Center for Employee Ownership for outreach, program administration, and EOT best-practices development. Per NCEO, Michigan is the fifth state to launch a state EO program in recent years (alongside Colorado, Massachusetts, New Jersey, and Washington).",
    parameters:
      'Total budget: $500,000 (FY25 pilot). ESOPs, worker cooperatives, and employee ownership trusts are all eligible — the first explicit state program to include EOTs. Per-business caps not publicly specified. Rolling applications.',
    citation: '[Michigan LEO](https://www.michigan.gov/leo) / [MICEO](https://www.mceomi.org/) Transition to Employee Ownership Pilot (announced July 8, 2025)',
    effective: 'Launched July 2025; rolling applications',
    status: 'active',
    notes: '',
  },
  {
    lever: 'state-loans',
    state: 'Minnesota',
    mechanism:
      "Community Wealth-Building Loan Program — low-interest loans to 'community businesses' using shared-ownership models. Administered by Minnesota's Department of Employment and Economic Development (DEED) through a pass-through to a nonprofit partner. Worker cooperatives and ESOPs are among the eligible structures, but borrowers must also meet demographic-ownership criteria, so this is not exclusively an employee-ownership program.",
    parameters:
      'Loan size: $10K–$500K. Demographic eligibility: at least 51% ownership by BIPOC individuals, immigrants, low-income individuals, women, veterans, or persons with disabilities. The nonprofit partner sets rate, collateral, and terms. The only currently-operational state loan fund that explicitly names both worker cooperatives and ESOPs as eligible structures.',
    citation: '2023 Minnesota Session Laws, Ch. 53; [Minnesota DEED](https://mn.gov/deed/) program rules',
    effective: 'Enacted 2023; operational 2024',
    status: 'active',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'New Jersey',
    mechanism:
      "$2.7 million ESOP Assistance Program approved by the New Jersey Economic Development Authority (NJEDA) Board on April 22, 2025. NJEDA contracts directly with two pre-approved firms — Onyx Partners Group and Lazear Capital Partners (both selected via a September 2024 RFP and approved by the Board in February 2025) — to deliver ESOP feasibility studies for qualifying New Jersey businesses, paying the vendor 90% of the study cost. Complemented by the Rutgers University-based NJ/NY Center for Employee Ownership, which receives a separate $2 million Rutgers School of Management and Labor Relations allocation for outreach and education. The closest peer parallel to MassCEO's planned multi-vendor procurement model.",
    parameters:
      'Up to $35,000 per business per study. 90% NJEDA / 10% business cost share. ESOPs only. Business must have at least 25 full-time employees and be New Jersey-based (NJEDA materials have cited a 20-FTE threshold in earlier program documentation; current NJEDA eligibility page should be consulted before relying on either number). Two confirmed components: $2.7 million for the ESOP Assistance Program and $2 million for the Rutgers NJ/NY Center.',
    citation:
      "[NJEDA ESOP Assistance Program](https://www.njeda.gov/esop-assistance-program/) (Board resolution April 22, 2025); contractor approvals February 2025 (Onyx Partners Group; Lazear Capital Partners). [Rutgers Institute for the Study of Employee Ownership and Profit Sharing](https://smlr.rutgers.edu/research-centers/institute-study-employee-ownership-and-profit-sharing) (NJ/NY Center, established 2017).",
    effective: 'NJEDA Board approval April 22, 2025; applications opened 2025',
    status: 'active',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'Ohio',
    mechanism:
      'Ohio Employee Ownership Center (OEOC) at Kent State University provides feasibility-study subsidies on a case-by-case basis and free preliminary technical assistance to any Ohio business. Funded by a mix of the Ohio Department of Development, foundations, the U.S. Department of Agriculture (USDA), and member dues. Subsidy levels reflect available funding rather than a fixed program.',
    parameters: 'Historical ESOP subsidy range: $5K–$10K; up to 100% of co-op feasibility study costs. No formal application required.',
    citation: '[Ohio Employee Ownership Center](https://www.oeockent.org/) at Kent State University (program established 1988)',
    effective: 'Ongoing',
    status: 'active',
    notes: '',
  },
  {
    lever: 'direct-assistance',
    state: 'Vermont',
    mechanism:
      'Vermont Employee Ownership Center (VEOC) administers a technical-assistance grant pool for businesses pursuing employee-ownership conversions. VEOC has received annual Vermont legislative appropriations since 2006. (VEOC also operates the Vermont Employee Ownership Loan Fund, tracked separately in the state-funded loan programs lever.)',
    parameters:
      "$50K of a $158K federal Congressionally Directed Spending allocation (FY22 omnibus) was specifically earmarked for feasibility-study and legal-cost grants. The remaining $108K of that allocation funded VEOC outreach/staffing expansion and a $25K Vermont-specific employee-buyout legal guide and template; replenishment status of the grant pool is not publicly confirmed.",
    citation: 'Sanders FY22 Congressionally Directed Spending award to [VEOC](https://www.veoc.org/) ($158K, with $50K specifically for TA grants and $25K for the legal guide, per Fifty by Fifty reporting). Annual Vermont legislative funding since 2006.',
    effective: 'Operational',
    status: 'active',
    notes: '',
  },

  // LEVER 4: State-funded loan programs
  {
    lever: 'state-loans',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      "The Massachusetts legislation establishing MassCEO also created the Employee-Ownership Revolving Loan Fund at M.G.L. c. 23D § 16. The fund provides 'low-interest long-term loans to individuals for the purchase of such individual's ownership interest in an employee-owned business' — financing for employees buying their stake in a worker-owned conversion, not for the converting business itself.",
    parameters: '—',
    citation:
      '[M.G.L. c. 23D § 16](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleII/Chapter23D/Section16) (Employee-Ownership Revolving Loan Fund), as amended by [Acts of 2025, Ch. 14 § 9](https://malegislature.gov/Laws/SessionLaws/Acts/2025/Chapter14) (effective August 5, 2025).',
    effective: 'Statutory fund established; operational status not publicly confirmed',
    status: 'pending',
    notes: '',
  },
  {
    lever: 'state-loans',
    state: 'Colorado',
    mechanism:
      "Colorado uses federal State Small Business Credit Initiative (SSBCI) funds, routed through state-designated lenders, to back private-bank loans for employee-ownership conversions. The state does not lend directly — it absorbs a portion of the bank's risk, which lowers the cost of the loan for the converting business. Colorado's primary tool remains its conversion tax credit; the loan-backing is a secondary mechanism.",
    parameters: 'Loan-backing terms and per-business caps not publicly specified. Case-by-case basis.',
    citation: '[Colorado SSBCI program](https://oedit.colorado.gov/state-small-business-credit-initiative-ssbci) (Office of Economic Development and International Trade); [U.S. Treasury SSBCI overview](https://home.treasury.gov/policy-issues/small-business-programs/state-small-business-credit-initiative-ssbci)',
    effective: 'Ongoing',
    status: 'active',
    notes: '',
  },
  {
    lever: 'state-loans',
    state: 'Vermont',
    mechanism:
      "Vermont Employee Ownership Loan Fund (VEOLF), administered by the Vermont Employee Ownership Center (VEOC). A small revolving loan fund that lends directly to businesses converting to employee ownership. Operates alongside VEOC's separate technical-assistance grant pool (tracked in the state-funded grants & stipends lever).",
    parameters:
      "Loans up to $50,000 per deal as of VEOC's 2024 program update (the older VEOC.org/loanfund page still publishes a $2,000–$58,000 range — the $50,000 figure is the more recent and is what should be cited for peer comparisons). Loans are generally priced at the prime rate; terms 60 days to 5 years. VEOC partners with the Cooperative Fund of New England on larger deals.",
    citation: '[VEOC blog January 2024 update](https://www.veoc.org/news) ($50K cap per deal); [VEOC.org/loanfund](https://www.veoc.org/loanfund) (older $2K–$58K range, current as of July 2021). Annual Vermont legislative funding since 2006.',
    effective: 'Operational',
    status: 'active',
    notes: '',
  },

  // LEVER 5: Procurement preferences & contracting access
  {
    lever: 'non-fiscal',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      'No Massachusetts procurement preference for employee-owned businesses exists or is pending. Closest peer templates: Oregon (general preference on all state contracts), Maine (sector-specific preference for renewable-energy procurement), and North Carolina (access to existing minority-business set-aside programs for ESOPs with majority-disadvantaged participants).',
    parameters:
      "Massachusetts has no employee-ownership procurement preference and no pending bill proposing one. H. 503 / S. 305 includes an employee right-of-first-refusal provision — that bill's capital-gains component is tracked in the capital gains lever.",
    citation: '—',
    effective: '—',
    status: 'none',
    notes: '',
  },
  {
    lever: 'non-fiscal',
    state: 'Maine',
    mechanism:
      "The Maine Public Utilities Commission may give added consideration to employee-owned bidders on renewable-energy procurements. Per NCEO, the first state law in the U.S. to create a preference for state contractors with ESOPs. Narrower than Oregon's general preference — sector-specific to PUC-administered renewable energy contracts.",
    parameters:
      'Sector-specific (renewable energy procurements only). Tied to labor-standards requirements for projects receiving ≥$50K in state funding. No explicit percentage preference — discretionary added consideration.',
    citation:
      '[L.D. 1969 / H.P. 1464](https://legislature.maine.gov/LawMakerWeb/summary.asp?paper=HP1464&snum=130) ("An Act Concerning Equity in Renewable Energy Projects and Workforce Development"), 130th Legislature',
    effective: 'Enacted 2022',
    status: 'active',
    notes: '',
  },
  {
    lever: 'non-fiscal',
    state: 'North Carolina',
    mechanism:
      "ESOPs whose participants are at least 51% members of statutorily-defined underrepresented groups can qualify as Historically Underutilized Businesses (HUBs) for North Carolina state procurement. Most ESOP transitions won't meet the demographic threshold, so the lift is narrower than Oregon's or Maine's models — but it's a useful hybrid approach: piggybacks on existing minority-business procurement infrastructure without standing up an EO-specific preference program.",
    parameters:
      "51% disadvantaged-participant threshold. HUB certification provides eligibility for North Carolina procurement programs, and the state has a 10% HUB utilization goal across its contracts.",
    citation: '[N.C. Gen. Stat. § 143-128.4](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_143/GS_143-128.4.html); Session Laws 2024-42 § 5(a) and 2024-44',
    effective: 'Effective 2024 session',
    status: 'active',
    notes: '',
  },
  {
    lever: 'non-fiscal',
    state: 'Oregon',
    mechanism:
      'State agencies may select an employee-owned bidder even if the EO bid is up to 5% higher than the low bid (10% higher for in-state production or services performed entirely in Oregon). Applies across general state procurement. Broadest state EO procurement preference in the U.S.',
    parameters:
      'Eligibility: ≥50% employee ownership, directly or via an ESOP. Preference: up to 5% (10% for in-state). No direct state expenditure.',
    citation:
      '[HB 3646 (2025)](https://olis.oregonlegislature.gov/liz/2025R1/Measures/Overview/HB3646), amending [ORS 279A.128](https://oregon.public.law/statutes/ors_279A.128). Signed June 11, 2025 by Gov. Kotek; sponsored by Rep. Thuy Tran (D-District 45, NE Portland).',
    effective: 'Effective ~September 26, 2025 (91 days after 2025 session adjournment)',
    status: 'active',
    notes: '',
  },

  // LEVER 6: Professional licensure & industry-specific carve-outs
  {
    lever: 'professional-licensure',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      "Massachusetts's Professional Corporations Act (c. 156A) limits ownership of regulated firms to individuals who hold the underlying professional license. ESOPs, worker cooperatives, and employee ownership trusts are not on the list of permissible owners. The result: architecture, engineering, surveying, landscape architecture, accounting, medical, dental, and law firms in Massachusetts cannot currently use employee-ownership succession structures. Massachusetts cannabis rules (c. 94G and 935 CMR 500) similarly restrict changes of control without an ESOP carve-out.",
    parameters: 'No employee-ownership authorization in any regulated profession. Closest peer templates: Virginia (comprehensive, 2006), New York (design professionals, 2022), Nebraska (CPAs, 2019), Arizona (professional corporations + a separate law-firm reform), and Maryland (cannabis, 2025).',
    citation:
      '[M.G.L. c. 156A](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter156A); [c. 112 § 87B½](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXVI/Chapter112/Section87B1~2F2) (CPA practice); [c. 94G](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXV/Chapter94G) + 935 CMR 500 (cannabis)',
    effective: '—',
    status: 'none',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Virginia',
    mechanism:
      "Virginia authorizes ESOPs to own professional corporations across multiple regulated professions — architects, engineers, land surveyors, landscape architects, interior designers, and CPAs. For accounting firms, at least 51% of owners and voting equity must be CPAs OR trustees of an eligible ESOP. For design-professional PCs, an ESOP may include non-licensed employees if they collectively hold ≤1/3 of beneficial interests. Cited by ESOP Services, Inc. as the model for subsequent NY, NE, and other state efforts.",
    parameters:
      '100% ESOP ownership permitted with specified trustee-licensure and IRC § 409(p) ratio conditions: majority licensed for accounting; two-thirds for design firms. Trustees must be licensed in the relevant profession.',
    citation: 'Va. HB 952 (2006); [Va. Code § 13.1-543](https://law.lis.virginia.gov/vacode/title13.1/chapter7/section13.1-543/), [§ 13.1-549](https://law.lis.virginia.gov/vacode/title13.1/chapter7/section13.1-549/), [§ 54.1-4412.1](https://law.lis.virginia.gov/vacode/title54.1/chapter44/section54.1-4412.1/)',
    effective: 'Enacted 2006',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'New York',
    mechanism:
      "New York amended Business Corporation Law § 1503 to allow ESOPs to own up to 100% of a Design Professional Corporation (architecture, engineering, landscape architecture, and land surveying firms). Before the amendment, ESOP ownership was effectively capped below 25% because licensed professionals had to hold the majority stake. Cleaner and more recent drafting than Virginia's 2006 law — useful template if Massachusetts wants to start with a single high-headcount sector (architecture and engineering) before pursuing comprehensive professional-corporation reform.",
    parameters:
      "More than 75% of the ESOP's voting trustees OR more than 75% of plan committee members must be licensed design professionals.",
    citation: '[NY S.5261B](https://www.nysenate.gov/legislation/bills/2021/s5261/amendment/b) / [A.1891D](https://www.nysenate.gov/legislation/bills/2021/a1891/amendment/d) (signed by Gov. Hochul July 21, 2022); amends [NY Business Corporation Law § 1503](https://www.nysenate.gov/legislation/laws/BSC/1503)',
    effective: 'Effective July 21, 2024',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Nebraska',
    mechanism:
      "Authorizes ESOPs as permissible owners of Nebraska CPA firms — up to 100% ESOP ownership permitted, subject to Nebraska's existing 49% cap on non-licensed employee ownership (which flows through the ESOP to non-CPA participants). Bland & Associates (Omaha) became the first 100% ESOP-owned CPA firm in Nebraska in January 2020 under this law.",
    parameters:
      'CPA firms only. ESOP-trustee licensure framework. 49% non-licensed-employee cap continues to apply via the ESOP to non-CPA participants.',
    citation: '[Neb. LB 49 (2019)](https://nebraskalegislature.gov/bills/view_bill.php?DocumentID=37113); [Neb. Rev. Stat. § 1-162.01](https://nebraskalegislature.gov/laws/statutes.php?statute=1-162.01)',
    effective: 'Enacted 2019',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Minnesota',
    mechanism:
      "Minnesota permits CPA firms and most design-professional firms (architects, engineers, surveyors, landscape architects, geoscientists, interior designers) to include non-licensed owners, including ESOPs, as long as licensed professionals retain majority voting power. The framework does not name ESOPs explicitly — eligibility flows from how the licensed-trustee structure interacts with the voting-power rule.",
    parameters:
      'CPA firms must designate a Minnesota licensee as the responsible registrant; non-licensed owners must be active participants. Counsel should confirm the exact ESOP-ownership ceiling against current Minnesota Board of Accountancy rulings before drafting any MA analog.',
    citation:
      '[Minn. Stat. § 326A.05](https://www.revisor.mn.gov/statutes/cite/326A.05) (CPA firm permit) and [§ 326A.10](https://www.revisor.mn.gov/statutes/cite/326A.10) (firm-form requirements); [Minn. Stat. ch. 319B](https://www.revisor.mn.gov/statutes/cite/319B) (Professional Firms Act).',
    effective: 'Long-standing framework',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Arizona (professional corporations)',
    mechanism:
      "Arizona's professional-corporation statute restricts voting shares to licensed individuals but expressly permits issuance to an ESOP — provided every one of the plan's voting trustees is Arizona-licensed in the corporation's profession. This is the strictest trustee-licensure rule of any state that allows ESOP ownership of professional corporations. New York requires more than 75% of trustees be licensed; Virginia requires a majority for accounting firms (two-thirds for design firms); Arizona requires 100%. Represents the conservative end of the design space.",
    parameters:
      'Up to 100% ESOP ownership permitted, but every voting trustee must be Arizona-licensed.',
    citation: '[Ariz. Rev. Stat. § 10-2220](https://www.azleg.gov/ars/10/02220.htm) (Issuance of shares)',
    effective: 'Long-standing',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Arizona (law firms)',
    mechanism:
      "Arizona eliminated the long-standing ban on nonlawyer ownership of law firms (formerly Rule 5.4) and created an Alternative Business Structure license. Nonlawyer owners — including ESOPs — are permitted, provided the firm has at least one Arizona-licensed Compliance Lawyer, holds an ABS license from the Arizona Supreme Court, and meets governance requirements that protect lawyer independence. A specific provision (in the Arizona Code of Judicial Administration § 7-209) excludes ERISA-qualified retirement plans from the definition of an \"economic interest,\" which is what makes ESOP-style ownership work.",
    parameters:
      'ABS license required; at least one Arizona-licensed Compliance Lawyer; governance protections for lawyer independence. KPMG Law US received an Arizona ABS license in late 2025 — the first major test of the framework.',
    citation: '[Ariz. Sup. Ct. Rules 31, 31.1(c), 33.1](https://govt.westlaw.com/azrules/Browse/Home/Arizona/ArizonaCourtRules/ArizonaStatutesCourtRules?guid=N4F31CBE0F2C611DAB04BC5DB58A1ED2F); [Ariz. Code of Judicial Administration § 7-209](https://www.azcourts.gov/Portals/26/Admin%20Code/Sec.%207-209.pdf)',
    effective: 'Effective 2021',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Utah',
    mechanism:
      "Utah Supreme Court Standing Order 15 created a pilot legal regulatory sandbox and Office of Legal Services Innovation. The sandbox authorizes entities — including those with nonlawyer or ESOP ownership and fee-sharing arrangements — to deliver legal services under court supervision. More cautious than Arizona's full ABS reform: a sandbox model preserves the ability to wind down if data show consumer harm. Extended to a seven-year pilot in 2021.",
    parameters:
      'Court-supervised pilot rather than a permanent rule change. Authorized entities submit regular reports; authorization is contingent on data showing no significant consumer harm.',
    citation: '[Utah Sup. Ct. Standing Order No. 15](https://www.utcourts.gov/utc/rules-approved/wp-content/uploads/sites/4/2020/08/FINAL-Standing-Order-15.pdf) (2020; amended June 3, 2021). Entity list at [utahinnovationoffice.org](https://utahinnovationoffice.org/).',
    effective: '2020 launch; seven-year pilot through 2027',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'Maryland (cannabis)',
    mechanism:
      "Carves out an exception to Maryland's five-year ban on transferring a cannabis license, specifically to allow transfers to an ESOP. Part of a broader 2025 cannabis reform package that also legalized on-site consumption lounges and cannabis events statewide. Targeted, high-benefit reform — Massachusetts cannabis operators face heavy federal tax pressures (the IRS section that bars cannabis businesses from deducting ordinary expenses) that ESOP conversions can mitigate, but the Massachusetts Cannabis Control Commission's current ownership-change rules block the structure.",
    parameters: 'Allows ESOPs to receive a cannabis-license transfer that would otherwise be blocked by the five-year transfer bar. No dollar cap.',
    citation: '[Md. SB 215 (2025)](https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/sb0215), Ch. 120, Laws of 2025; signed by Gov. Wes Moore April 22, 2025.',
    effective: 'Signed April 22, 2025; effective July 1, 2025',
    status: 'active',
    notes: '',
  },
  {
    lever: 'professional-licensure',
    state: 'North Carolina (cautionary)',
    mechanism:
      "Cautionary comparator. North Carolina requires two-thirds licensed ownership of architecture and engineering professional corporations, and does NOT permit look-through to ESOP trustees or plan participants. Business entities, including ESOP trusts, cannot be direct owners. The accounting firm BDO has documented this as a frequent blocker on ESOP transactions in regulated firms. Useful as a model of what Massachusetts should AVOID if it amends c. 156A.",
    parameters:
      'Two-thirds licensed-individual ownership required; entity ownership prohibited; no look-through to ESOP trustees or participants. Effectively bars ESOP ownership of North Carolina architecture and engineering professional corporations.',
    citation: '[N.C. Gen. Stat. ch. 55B](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_55B.html) (Professional Corporation Act)',
    effective: 'Long-standing',
    status: 'none',
    notes: '',
  },

  // LEVER 7: Cooperative-entity & securities reforms
  {
    lever: 'cooperative-statute',
    state: 'Massachusetts',
    isMA: true,
    mechanism:
      "M.G.L. c. 157A (enacted 1982) recognizes worker cooperative corporations as a distinct corporate form but has not been substantively updated in 40+ years. It is missing every modern feature peer states have added: no Limited Cooperative Association option (ULCAA), no community-investor / non-patron member class, no securities-registration carve-out for cooperative memberships under M.G.L. c. 110A (the Massachusetts Uniform Securities Act), and no explicit recognition of 501(c)(3) nonprofits as eligible cooperative members.",
    parameters: 'Five modernization opportunities to consider: ULCAA adoption, a community-investor share class, a c. 110A securities exemption for cooperative memberships, nonprofit-as-member eligibility, and a recurring statutory-review cadence.',
    citation: '[M.G.L. c. 157A](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter157A) (1982); [M.G.L. c. 110A](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXV/Chapter110A) (Massachusetts Uniform Securities Act)',
    effective: 'Enacted 1982; not substantively modernized since',
    status: 'none',
    notes: '',
  },
  {
    lever: 'cooperative-statute',
    state: 'California',
    mechanism:
      "California's AB 816 (2015) made three reforms to the state cooperative framework: (1) created a dedicated worker-cooperative corporate form; (2) created a \"community investor\" member class — non-worker investors with limited voting rights; and (3) raised the state securities-registration exemption from $300 to $1,000 per investor for cooperative memberships and made it self-executing (no filing required). No other state has gone further. If adopted in Massachusetts, would amend M.G.L. c. 110A and c. 157A in tandem.",
    parameters:
      '$1,000-per-investor self-executing securities exemption. One-member-one-vote preserved for worker-members. Community investors get approval rights only on major change-of-control or change-of-entity decisions.',
    citation: '[Cal. AB 816 (2015)](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160AB816), amending [Cal. Corp. Code §§ 12200 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=CORP&division=3.&title=1.&part=2.&chapter=&article=) and [§ 25100(r)](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=25100.). Signed by Gov. Brown; effective Jan 1, 2016.',
    effective: 'Effective Jan 1, 2016',
    status: 'active',
    notes: '',
  },
  {
    lever: 'cooperative-statute',
    state: 'Connecticut',
    mechanism:
      "Two-step modernization of Connecticut's cooperative-association statutes: P.A. 18-27 (2018) added explicit recognition of 501(c)(3) nonprofits as eligible members of a worker cooperative — a feature M.G.L. c. 157A lacks. P.A. 19-65 (SB 138, 2019) modernized the broader cooperative framework, passing unanimously in both chambers. Connecticut's 2019 modernization came roughly three decades after its original cooperative statute — a useful precedent for Massachusetts, whose c. 157A has gone substantially un-revised since 1982.",
    parameters:
      'The Connecticut Worker Cooperative Corporations Act includes internal capital accounts, one-member-one-vote, and an election framework similar to M.G.L. c. 157A — plus the nonprofit-member eligibility Massachusetts still lacks.',
    citation: '[Conn. P.A. 19-65 (SB 138, 2019)](https://www.cga.ct.gov/2019/ACT/pa/pdf/2019PA-00065-R00SB-00138-PA.pdf); [P.A. 18-27 (2018)](https://www.cga.ct.gov/2018/ACT/pa/pdf/2018PA-00027-R00SB-00040-PA.pdf); Conn. Gen. Stat. ch. 595 and ch. 599a',
    effective: 'P.A. 18-27 effective 2018; P.A. 19-65 effective Oct 1, 2019',
    status: 'active',
    notes: '',
  },
  {
    lever: 'cooperative-statute',
    state: 'New Jersey',
    mechanism:
      "New Jersey enacted what Project Equity identifies as the first U.S. state worker cooperative statute, in the early 1880s. The framework remains on the books today in N.J.S.A. Title 14A (Business Corporations Act). A useful historical comparator showing that early statutory adoption does not by itself drive operational EO programs — New Jersey's actively-funded state EO infrastructure (Rutgers center + NJEDA ESOP Assistance Program) did not arrive until 2017–2025, more than a century later.",
    parameters: "Historical anchor. New Jersey's current operational EO ecosystem — Rutgers center and the NJEDA $2.7M ESOP Assistance Program — is tracked under the state-funded grants & stipends lever.",
    citation:
      "[N.J.S.A. Title 14A](https://www.njleg.state.nj.us/Bill_Search) (Business Corporations Act); statute origin in early-1880s New Jersey legislation, per Project Equity's Employee Ownership Policy Database.",
    effective: 'Original statute 1880s; in force through subsequent modernizations',
    status: 'active',
    notes: '',
  },
  {
    lever: 'cooperative-statute',
    state: 'Colorado (ULCAA)',
    mechanism:
      "Colorado adopted the Uniform Limited Cooperative Association Act (ULCAA) — a hybrid corporate form that lets a cooperative take in outside investor capital while preserving worker-member control. This addresses one of the long-standing barriers to cooperative scale (raising capital without losing member control). Colorado also permits a cooperative to layer the state's Public Benefit Corporation Act on top of the cooperative form. ULCAA (or a variant) has also been adopted by Kentucky, Nebraska, Oklahoma, Utah, Vermont, Washington, the District of Columbia, Minnesota, and Wisconsin. Massachusetts has not adopted ULCAA.",
    parameters: 'Authorizes non-patron investor members while preserving one-member-one-vote democratic governance for worker-members through statutory voting protections.',
    citation: '[Colo. Rev. Stat. Title 7, Article 58](https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-07.pdf) (Limited Cooperative Association Act, 2010); Title 7, Article 56 (general cooperative)',
    effective: 'Enacted 2010 in Colorado',
    status: 'active',
    notes: '',
  },

  // Indiana linked-deposit (historical) — state-loans lever
  {
    lever: 'state-loans',
    state: 'Indiana (historical linked-deposit)',
    mechanism:
      "Historical (early 2000s through ~2010) Indiana ESOP Initiative Linked-Deposit Program: the Indiana Treasurer deposited state funds at participating banks at up to 3% below the comparable Treasury Bill rate, and banks lent the funds to ESOP-forming companies at correspondingly reduced rates. An off-budget model — uses state cash management instead of appropriations. The program is currently dormant. Indiana HB 1038 (Rep. Jake Teshka, 2025) would revive it but is pending in committee as of May 2026. The only U.S. state-level linked-deposit ESOP precedent on record.",
    parameters:
      "Below-market financing delivered through participating banks at up to 3% below the Treasury Bill rate. No new appropriation required. Software Engineering Professionals (SEP) of Carmel, IN was the program's most-cited use case (April 2010).",
    citation:
      '[Ind. Code Art. 5-13, Ch. 12](https://iga.in.gov/laws/2024/ic/titles/5#5-13-12) (Indiana Board for Depositories). Historical SEP participation announcement (April 2010). [Indiana HB 1038 (2025)](https://iga.in.gov/legislative/2025/bills/house/1038) revival bill.',
    effective: 'Operated early 2000s through ~2010; currently dormant',
    status: 'suspended',
    notes: '',
  },
  // California Hub (cautionary) — direct-assistance lever
  {
    lever: 'direct-assistance',
    state: 'California (cautionary)',
    mechanism:
      "California's SB 1407 (2022) created the California Employee Ownership Hub within the state's Office of Small Business Advocate and directed it to provide outreach, partner referrals, and capital-program access. Enacted into statute but never given a dedicated operational appropriation in any California budget from FY23 through FY26. A peer cautionary on the risk of authorizing a state EO program without a structural funding mechanism. California businesses still have access to the Office of Small Business Advocate's general Technical Assistance Program and Capital Infusion Program, but neither is EO-specific.",
    parameters: 'Statute in force; no dedicated operational funding through FY26.',
    citation: '[Cal. SB 1407 (2022)](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB1407)',
    effective: 'Enacted 2022; unfunded through FY26',
    status: 'suspended',
    notes: '',
  },
]

// Bills to watch — pending / recently acted-on legislation
export const BILLS_TO_WATCH: BillToWatch[] = [
  {
    state: 'Massachusetts',
    isMA: true,
    billNumber: 'S. 1950',
    sponsor: 'Sen. Julian Cyr',
    summary:
      'An Act to Promote Employee Ownership. Would exempt capital gains from the sale of MA businesses with ≤500 employees from MA capital gains tax, by inserting § 38OO into Ch. 63. No dollar cap stated.',
    status:
      'Hearing held Oct 28, 2025 (Joint Committee on Revenue); reporting date extended to June 25, 2026',
    relevanceToMA:
      "Would be MA's first capital gains incentive for EO sales. Interacts with Fair Share Amendment 4% surtax. Cyr has refiled this bill every session since at least 2019.",
    lever: 'capital-gains',
  },
  {
    state: 'Massachusetts',
    isMA: true,
    billNumber: 'H. 503 / S. 305',
    sponsor: 'Rep. Worrell, Rep. Garballey (H.); Sen. Paul Mark (S.)',
    summary:
      "An Act promoting entrepreneurship through employee ownership. Requires a 30-day employee right of first refusal to a 'qualified employee group' when owner sells ≥51% of a company. Provides capital gains exemption on first $1M of sale to a qualifying worker cooperative (subject to democratic governance requirements).",
    status:
      'Both versions accompanied by a study order in spring 2026 (H.503 → H.5178 on March 5, 2026; S.305 → S.3023 on March 19, 2026) — under MA legislative procedure this effectively ends the bills for the 194th General Court. Coalition expected to refile in the 195th session.',
    relevanceToMA:
      'Combines a non-fiscal right of first refusal (ROFR) for employees with targeted worker-cooperative capital-gains relief. Supported by COWOP (Coalition for Worker Ownership and Power).',
    lever: 'non-fiscal',
  },
  {
    state: 'Maine',
    billNumber: 'LD 756',
    sponsor: 'Sen. Cameron Reny',
    summary:
      'An Act Creating and Sustaining Jobs Through the Development of Cooperatives and Employee-owned Businesses by Providing Tax Deductions for Certain Qualified Business Activities. Re-introduction of the broad $750K capital gains deduction for sales to ESOPs, worker cooperatives, consumer cooperatives, and agricultural producer cooperatives; separate interest-income deduction for lenders; and statutory authorization for the Maine Employee Ownership Center.',
    status:
      'Passed Senate June 12, 2025; passed House to be enacted June 13, 2025 (chamber-level vote tallies not independently verified); placed on Special Appropriations Table pending funding; carried over June 25, 2025 to the Second Regular Session; the 132nd Legislature adjourned sine die April 29, 2026 with LD 756 still on the table and no final disposition recorded — bill died without enactment.',
    relevanceToMA:
      'Companion to S. 1950 in scope and structure. If enacted, would restore Maine to an active-status entry in the capital gains lever. Worth tracking as a model for the MA bill.',
    lever: 'capital-gains',
  },
  {
    state: 'Pennsylvania',
    billNumber: 'SB 478',
    sponsor:
      'Sen. Frank Farry (R) with bipartisan co-sponsors (Pennycuick, Fontana, Laughlin, Tartaglione, Kearney, Stefano, Pisciottano, Collett)',
    summary:
      'Establishes the Office of Employee Ownership within the PA Department of Community and Economic Development (DCED); establishes the Employee Ownership Advisory Board; establishes the Main Street Employee Ownership Grant Program; and provides technical and financial assistance to employee-owned enterprises. Companion bill HB 1751 (Rep. Paul Friel) mirrors this framework in the House.',
    status: 'Introduced March 20, 2025; re-referred to Appropriations July 17, 2025',
    relevanceToMA:
      "Closest peer model to MassCEO structurally — a state office within an economic development department plus an advisory board plus a grant program. Worth close comparison for MA's own appropriation and advisory-board design.",
    lever: 'direct-assistance',
  },
  {
    state: 'Wisconsin',
    billNumber: 'SB 21 / AB 17',
    sponsor:
      'Sens. James, Larson, Tomczyk (SB 21); Reps. Sortwell, Franklin, Kaufert et al. (AB 17) — bipartisan mix of Republican and Democratic co-sponsors',
    summary:
      'Comprehensive EO legislation touching three levers simultaneously: (1) creates an Employee Ownership Conversion Costs Tax Credit (70% of costs up to $100K for worker cooperative conversions; 50% up to $100K for ESOP conversions; $5M aggregate annual cap); (2) creates a capital gains deduction for transfers of WI businesses to an ESOP or worker cooperative that ends up owning >50% post-transaction, effective TY 2025+; (3) creates an employee ownership education and outreach program administered by the WI Department of Revenue, with DOR authorized to apply to the U.S. Secretary of Labor for a WORK Act grant under 29 USC 3228.',
    status:
      'AB 17 passed Wisconsin Assembly 96-0 on June 24, 2025 (unanimous bipartisan); referred to Senate Agriculture and Revenue Committee June 27, 2025; Senate public hearing held January 8, 2026; failed to concur in Senate on March 23, 2026 pursuant to Senate Joint Resolution 1. Wisconsin 2025-2026 Legislature adjourned sine die; bill is dead for the biennium.',
    relevanceToMA:
      "Closest peer attempt at bundling what MA currently treats as separate levers (S.1950, H.503/S.305, and the TA Stipend) into a single legislative vehicle — a conversion credit, capital gains relief, and a state-run education/outreach program. Cautionary data point: even with 96-0 unanimous Assembly passage, the package died at the end of the Wisconsin biennium because the Senate did not concur. Suggests that bundling is politically attractive in one chamber but creates more surface area for opposition or inaction in a second chamber.",
    lever: 'conversion-tax-credit',
  },
  {
    state: 'Illinois',
    billNumber: 'SB 2982',
    sponsor: 'Sen. Lakesia Collins',
    summary:
      'Would appropriate $700,000 as a grant to the Illinois Center for Employee Ownership (ILCEO).',
    status: 'Not yet enacted',
    relevanceToMA:
      'Grant-to-center model (vs. direct-to-business). A possible structural alternative for MA appropriation design.',
    lever: 'direct-assistance',
  },
  {
    state: 'Illinois',
    billNumber: 'HB 4955',
    sponsor: 'Rep. Will Guzzardi',
    summary:
      'Would create an Employee Ownership Development Account directing up to 5% of the state investment portfolio into majority employee-owned companies.',
    status: 'Pending',
    relevanceToMA:
      'Novel non-appropriation mechanism: channels existing investment capital rather than creating new outlays. Worth studying as a lower-budget-impact model — potentially interesting for PRIM.',
    lever: 'non-fiscal',
  },
  {
    state: 'Indiana',
    billNumber: 'SB 175',
    sponsor: 'Sen. Shelli Yoder',
    summary:
      'Would have created an Employee-Owned Business Resource Center with a revolving loan fund. Did not proceed in 2025 session.',
    status: 'Did not proceed (2025)',
    relevanceToMA:
      'Per INCEO advocacy page. Included for completeness — revolving loan fund model (parallel to VEOLF).',
    lever: 'direct-assistance',
  },
  {
    state: 'Indiana',
    billNumber: 'HB 1038',
    sponsor: 'Rep. Teshka',
    summary: 'Linked deposit ESOP lending program.',
    status: 'Referred to committee',
    relevanceToMA:
      'Linked-deposit model — state deposits held at banks conditional on ESOP lending. Low fiscal cost.',
    lever: 'direct-assistance',
  },
  {
    state: 'California',
    billNumber: 'SB 713',
    sponsor: 'Sen. Suzette Valladares (R)',
    summary:
      'Would direct the California Director of General Services to issue an ESOP Contractor Certificate to qualifying contractors (independent ESOP trustee, IRS favorable determination letter, specified percentage of employee participation). Beginning January 1, 2027, Caltrans (CA Department of Transportation) would be required to award an unspecified percentage of state-funded construction contracts and construction-related procurements to certified ESOP contractors, with tiered bid preferences scaled to the percentage of ESOP ownership. Certificate renewed every 3 years.',
    status: 'Amended in Senate April 23, 2025; pending. Bill text leaves specific qualification thresholds and bid-preference percentages to be set by regulation rather than fixing them in statute.',
    relevanceToMA:
      'Procurement-preference model distinct from Oregon HB 3646 (general procurement) — this is a sector-targeted ESOP set-aside on the transportation budget, the largest single procurement bucket in most state budgets. If enacted, would be the most operationally significant ESOP-preference statute in the U.S. by dollar volume. Useful design template if MA pursues a sector-targeted preference (e.g., on MassDOT contracts) rather than a general procurement preference.',
    lever: 'non-fiscal',
  },
]
