// Name, institution and merchant pools for realistic Nigerian dummy data.

export const FIRST = [
  'Adaeze', 'Chidi', 'Funmi', 'Tunde', 'Ngozi', 'Ibrahim', 'Bola', 'Yetunde', 'Emeka', 'Kemi', 'Aisha', 'Segun', 'Amaka', 'Musa',
  'Chiamaka', 'Olumide', 'Zainab', 'Kelechi', 'Temitope', 'Nnamdi', 'Halima', 'Babatunde', 'Ifeoma', 'Uche', 'Folake', 'Abdullahi',
  'Damilola', 'Obinna', 'Fatima', 'Seun', 'Nkechi', 'Yusuf', 'Ebere', 'Tolu', 'Hauwa', 'Chukwudi', 'Bisi', 'Kunle', 'Adanna', 'Femi',
  'Rukayat', 'Ikenna', 'Oluwaseun', 'Efosa', 'Grace', 'Kwasi', 'Mariam', 'Victor', 'Esther', 'Sani',
];
export const LAST = [
  'Okonkwo', 'Okafor', 'Bakare', 'Adeyemi', 'Eze', 'Sani', 'Adebayo', 'Williams', 'Nwosu', 'Okafor', 'Bello', 'Ajayi', 'Nnadi', 'Danjuma',
  'Obi', 'Lawal', 'Musa', 'Anyanwu', 'Ogunleye', 'Uzor', 'Yusuf', 'Effiong', 'Igbinedion', 'Mensah', 'Afolabi', 'Chukwu', 'Abubakar',
  'Ogundipe', 'Eke', 'Balogun', 'Nwachukwu', 'Garba', 'Olaniyan', 'Okoro', 'Adeleke', 'Ibekwe', 'Shittu', 'Ndukwe', 'Oyelaran', 'Umar',
];

export const BANKS = [
  { name: 'Guaranty Trust Bank', short: 'GTBank', type: 'Commercial' },
  { name: 'Access Bank', short: 'Access Bank', type: 'Commercial' },
  { name: 'Zenith Bank', short: 'Zenith Bank', type: 'Commercial' },
  { name: 'First Bank of Nigeria', short: 'First Bank', type: 'Commercial' },
  { name: 'United Bank for Africa', short: 'UBA', type: 'Commercial' },
  { name: 'Stanbic IBTC', short: 'Stanbic IBTC', type: 'Commercial' },
  { name: 'Fidelity Bank', short: 'Fidelity Bank', type: 'Commercial' },
  { name: 'Sterling Bank', short: 'Sterling Bank', type: 'Commercial' },
  { name: 'Opay MFB', short: 'Opay', type: 'MFB' },
  { name: 'Kuda Microfinance Bank', short: 'Kuda', type: 'MFB' },
  { name: 'Moniepoint MFB', short: 'Moniepoint', type: 'MFB' },
  { name: 'PalmPay', short: 'PalmPay', type: 'Fintech' },
  { name: 'Carbon', short: 'Carbon', type: 'Fintech' },
];

export const EMPLOYERS = [
  ['TechFlow Solutions Ltd', 'Technology'], ['Dangote Cement Plc', 'Manufacturing'], ['MTN Nigeria', 'Telecoms'], ['Interswitch Group', 'Fintech'],
  ['Nigerian Breweries Plc', 'FMCG'], ['Lagos State Government', 'Public sector'], ['Flutterwave', 'Fintech'], ['Shoprite Nigeria', 'Retail'],
  ['Andela', 'Technology'], ['Seplat Energy', 'Oil & gas'], ['Lagos University Teaching Hospital', 'Healthcare'], ['Jumia Nigeria', 'E-commerce'],
  ['Nestlé Nigeria', 'FMCG'], ['KPMG Nigeria', 'Professional services'], ['Airtel Nigeria', 'Telecoms'],
];

export const LENDERS = [
  ['GTBank Auto Loan', 'COMMERCIAL', 'TERM_LOAN', [1200000, 3500000]],
  ['Access Bank PL', 'COMMERCIAL', 'TERM_LOAN', [400000, 1500000]],
  ['Zenith Personal Loan', 'COMMERCIAL', 'TERM_LOAN', [300000, 1200000]],
  ['UBA Credit Card', 'COMMERCIAL', 'RETAIL', [100000, 400000]],
  ['First Bank Salary Advance', 'COMMERCIAL', 'TERM_LOAN', [100000, 500000]],
  ['Carbon Quick Loan', 'DIGITAL', 'TERM_LOAN', [80000, 350000]],
  ['FairMoney Loan', 'DIGITAL', 'TERM_LOAN', [50000, 300000]],
  ['Renmoney Personal Loan', 'DIGITAL', 'TERM_LOAN', [200000, 900000]],
  ['Branch Loan', 'DIGITAL', 'TERM_LOAN', [30000, 150000]],
  ['Palmcredit Loan', 'DIGITAL', 'TERM_LOAN', [20000, 120000]],
];

export const GATEWAY_NARRATIONS = [
  ['PAYSTACK CHECKOUT', 'Chowdeck', 'FOOD/DELIVERY_APP', 'Email Receipt', '0.95'],
  ['Flutterwave/PIGGYVEST', 'PiggyVest', 'SAVINGS', 'Narration Context', '1.00'],
  ['Flutterwave/SPECTRANET', 'Spectranet', 'UTILITY/INTERNET', 'Narration Context', '1.00'],
  ['PAYSTACK CHECKOUT', 'Jumia', 'OTHER/ECOMMERCE', 'SMS Confirmation', '0.85'],
  ['PSTKDIRECTDEBITZAP', 'Carbon (direct debit)', 'LOAN_REPAYMENT', 'Recurring Pattern', '0.75'],
  ['FLW*BUYPOWER IKEDC', 'Ikeja Electric', 'UTILITY/POWER', 'Narration Context', '1.00'],
  ['PAYSTACK CHECKOUT', 'Bolt', 'TRANSPORT', 'Amount Signature', '0.80'],
  ['Flutterwave/COWRYWISE', 'Cowrywise', 'SAVINGS', 'Narration Context', '1.00'],
  ['MON/TRF/BET9JA-WEB', 'Bet9ja', 'BETTING', 'Narration Context', '0.90'],
  ['OPay/MONIEPOINT', 'Unresolved', 'OTHER', 'Unresolved', '—'],
  ['NIP/TRF/WEB', 'Unresolved', 'OTHER', 'Unresolved', '—'],
];

export const ANALYSTS = ['You', 'Tunde A.', 'Kemi O.'];
export const PERSONAS = [
  ['SALARIED_FORMAL', 'Salaried / Formal'], ['GIG_ECONOMY', 'Gig Economy'], ['MARKET_TRADER', 'Market Trader / Informal'],
  ['MICRO_MERCHANT', 'Micro-merchant / POS'], ['FREELANCER', 'Freelancer / Creator'],
];
