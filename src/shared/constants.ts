export const MARKET_PERCENT_FEE = Number(process.env.DEFAULT_FEE || 0.01);
export const REFERRAL_PERCENT_FEE = Number(process.env.REFERRAL_FEE || 0.2);
export const INFLUENCER_REFERRAL_PERCENT_FEE = Number(
  process.env.INFLUENCER_REFERRAL_PERCENT_FEE || 0.01,
);
export const GIFT_LISTING_PERCENT_FEE = Number(
  process.env.GIFT_LISTING_FEE || 0.1,
);
export const GIFT_TRANSFER_FEE = Number(process.env.GIFT_TRANSFER_FEE || 0.1);
export const SELL_FEE = Number(process.env.SELL_FEE || MARKET_PERCENT_FEE);

export const GIFT_ORDER_PLACE_FEE = Number(
  process.env.GIFT_ORDER_PLACE_FEE || 0.1,
);

export const MIN_SELL_PRICE = Number(process.env.MIN_SELL_PRICE || 0.5);
export const MAX_SELL_PRICE = Number(process.env.MAX_SELL_PRICE || 50000.0);

export const MIN_WITHDRAW_AMOUNT = Number(
  process.env.MIN_WITHDRAW_AMOUNT || 0.1,
);
export const MAX_WITHDRAW_AMOUNT = Number(
  process.env.MAX_WITHDRAW_AMOUNT || 50,
);

export const MIN_DEPOSIT_AMOUNT = Number(process.env.MIN_DEPOSIT_AMOUNT || 0.1);

export const MAX_FREE_GIFTS_LISTINGS = Number(
  process.env.MAX_FREE_LISTINGS || 5,
);

export const MAX_STARS_THRESHOLD = 1000;
export const TRANSFER_STARS_COUNT = 25;
