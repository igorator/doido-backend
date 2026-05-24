/**
 * Re-exports from `config` for backward compatibility.
 * Prefer importing directly from `config` in new code.
 */
import { config } from '../config';

export const MARKET_PERCENT_FEE = config.fees.marketPercent;
export const REFERRAL_PERCENT_FEE = config.fees.referralPercent;
export const INFLUENCER_REFERRAL_PERCENT_FEE = config.fees.influencerReferralPercent;
export const GIFT_LISTING_PERCENT_FEE = config.fees.giftListing;
export const GIFT_TRANSFER_FEE = config.fees.giftTransfer;
export const SELL_FEE = config.fees.sell;

export const MIN_SELL_PRICE = config.limits.minSellPrice;
export const MAX_SELL_PRICE = config.limits.maxSellPrice;
export const MIN_WITHDRAW_AMOUNT = config.limits.minWithdraw;
export const MAX_WITHDRAW_AMOUNT = config.limits.maxWithdraw;
export const MIN_DEPOSIT_AMOUNT = config.limits.minDeposit;
export const MAX_FREE_GIFTS_LISTINGS = config.limits.maxFreeListings;

export const MAX_STARS_THRESHOLD = config.stars.maxThreshold;
export const TRANSFER_STARS_COUNT = config.stars.transferCount;
