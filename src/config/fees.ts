import { num } from './_helpers';

const marketPercent = num(process.env.DEFAULT_FEE, 0.01);

export const feesConfig = {
  marketPercent,
  referralPercent: num(process.env.REFERRAL_FEE, 0.2),
  influencerReferralPercent: num(process.env.INFLUENCER_REFERRAL_PERCENT_FEE, 0.01),
  giftListing: num(process.env.GIFT_LISTING_FEE, 0.1),
  giftTransfer: num(process.env.GIFT_TRANSFER_FEE, 0.1),
  sell: num(process.env.SELL_FEE, marketPercent),
} as const;
