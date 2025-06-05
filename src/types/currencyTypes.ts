type BGN = 'BGN';
type CHF = 'CHF';
type DKK = 'DKK';
type EUR = 'EUR';
type GBP = 'GBP';
type HUF = 'HUF';
type MAD = 'MAD';
type RON = 'RON';
type USD = 'USD';

export type ValidCurrency = BGN | CHF | DKK | EUR | GBP | HUF | MAD | RON | USD;

interface Currency {
  BGN: BGN;
  CHF: CHF;
  DKK: DKK;
  EUR: EUR;
  GBP: GBP;
  HUF: HUF;
  MAD: MAD;
  RON: RON;
  USD: USD;
}

export const CURRENCY: Currency = {
  BGN: 'BGN',
  CHF: 'CHF',
  DKK: 'DKK',
  EUR: 'EUR',
  GBP: 'GBP',
  HUF: 'HUF',
  MAD: 'MAD',
  RON: 'RON',
  USD: 'USD'
};

