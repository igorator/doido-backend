import type Decimal from 'decimal.js';

export function notifyMarketProfit(
  netProfit: Decimal,
  totalCommission: Decimal,
  referralBonuses: Decimal,
): void {
  console.log(
    `[${new Date().toISOString()}] 🏦 PROFIT: net=${netProfit.toFixed(6)} TON` +
      ` | commission=${totalCommission.toFixed(6)} TON` +
      ` | referrals=${referralBonuses.toFixed(6)} TON`,
  );
}
