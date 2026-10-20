// Loan product catalogue (configuration, kept stable across generated datasets).
export const PRODUCT_CATALOG = [
  { id: 'p1', name: 'QuickCash Personal', range: '₦50,000 – ₦500,000', min: 50000, max: 500000, rate: '5.5%', fee: '2%', tenor: '1–6mo', tenorText: '1–6 months', minTier: 'T2', status: 'Active', why: 'Short-tenor personal loan matched to inflow regularity' },
  { id: 'p2', name: 'SME Growth Loan', range: '₦200,000 – ₦5,000,000', min: 200000, max: 5000000, rate: '8%', fee: '1.5%', tenor: '6–24mo', tenorText: '6–24 months', minTier: 'T3', status: 'Active', why: 'Business inflows support a growth facility' },
  { id: 'p3', name: 'Salary Advance Express', range: '₦20,000 – ₦300,000', min: 20000, max: 300000, rate: '4%', fee: '1%', tenor: '1–3mo', tenorText: '1–3 months', minTier: 'T1', status: 'Active', why: 'Verified salary deposits — short-tenor advance' },
  { id: 'p4', name: 'Premium Prime Credit', range: '₦500,000 – ₦10,000,000', min: 500000, max: 10000000, rate: '6.5%', fee: '1%', tenor: '12–36mo', tenorText: '12–36 months', minTier: 'T4', status: 'Active', why: 'Prime-tier profile with low DTI' },
  { id: 'p5', name: 'POS Merchant Boost', range: '₦100,000 – ₦2,000,000', min: 100000, max: 2000000, rate: '7.5%', fee: '2%', tenor: '3–12mo', tenorText: '3–12 months', minTier: 'T2', status: 'Paused', why: 'POS settlement volume supports working capital' },
  { id: 'p6', name: 'Platinum Overdraft', range: '₦1,000,000 – ₦20,000,000', min: 1000000, max: 20000000, rate: '5%', fee: '0.5%', tenor: '1–12mo', tenorText: '1–12 months', minTier: 'T5', status: 'Draft', why: 'Platinum-tier revolving facility' },
];
