import { BigInt, Address } from '@graphprotocol/graph-ts';
import {
  TradeCreated,
  TradeExecuted,
  TradeInEscrow,
  TradeCompleted,
  TradeCancelled,
  TradeDisputed,
  DisputeResolved,
  UserProfileUpdated,
  ReviewSubmitted,
  ReviewHelpful,
} from '../generated/TrustTrade';
import { Trade, User, Review, UserProfile, Dispute, Platform } from '../generated';

function getOrCreatePlatform(): Platform {
  let platform = Platform.load('main');
  if (platform == null) {
    platform = new Platform('main');
    platform.totalTrades = 0;
    platform.totalVolume = BigInt.zero();
    platform.totalUsers = 0;
    platform.totalReviews = 0;
    platform.totalDisputes = 0;
    platform.resolvedDisputes = 0;
    platform.totalEthCollected = BigInt.zero();
    platform.lastUpdatedBlock = BigInt.zero();
    platform.lastUpdatedTimestamp = BigInt.zero();
  }
  return platform;
}

function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHex());
  if (user == null) {
    user = new User(address.toHex());
    user.address = address;
    user.totalTradesVendor = 0;
    user.totalTradesBuyer = 0;
    user.completedTradesVendor = 0;
    user.completedTradesBuyer = 0;
    user.totalVolume = BigInt.zero();
    user.averageRating = BigInt.zero();
    user.reviewCount = 0;
    user.createdAt = BigInt.fromI32(0);
    user.updatedAt = BigInt.fromI32(0);

    let platform = getOrCreatePlatform();
    platform.totalUsers = platform.totalUsers + 1;
    platform.save();
  }
  return user;
}

export function handleTradeCreated(event: TradeCreated): void {
  let trade = new Trade(event.params.tradeId.toString());
  trade.tradeId = event.params.tradeId;
  trade.seller = event.params.seller.toHex();
  trade.token = event.params.token;
  trade.tokenAmount = event.params.tokenAmount;
  trade.ethPrice = event.params.ethPrice;
  trade.feeBasisPoints = event.params.feeBasisPoints;
  trade.status = 'Active';
  trade.disputed = false;
  trade.createdAt = event.block.timestamp;
  trade.createdBlock = event.block.number;
  trade.escrowDuration = BigInt.zero();
  trade.save();

  let seller = getOrCreateUser(event.params.seller);
  seller.totalTradesVendor = seller.totalTradesVendor + 1;
  seller.updatedAt = event.block.timestamp;
  seller.save();

  let platform = getOrCreatePlatform();
  platform.totalTrades = platform.totalTrades + 1;
  platform.lastUpdatedBlock = event.block.number;
  platform.lastUpdatedTimestamp = event.block.timestamp;
  platform.save();
}

export function handleTradeExecuted(event: TradeExecuted): void {
  let trade = Trade.load(event.params.tradeId.toString());
  if (trade != null) {
    trade.buyer = event.params.buyer.toHex();
    trade.status = 'Escrow';
    trade.save();

    let buyer = getOrCreateUser(event.params.buyer);
    buyer.totalTradesBuyer = buyer.totalTradesBuyer + 1;
    buyer.updatedAt = event.block.timestamp;
    buyer.save();

    let platform = getOrCreatePlatform();
    platform.totalVolume = platform.totalVolume.plus(event.params.ethAmount);
    platform.totalEthCollected = platform.totalEthCollected.plus(event.params.feeAmount);
    platform.save();
  }
}

export function handleTradeInEscrow(event: TradeInEscrow): void {
  let trade = Trade.load(event.params.tradeId.toString());
  if (trade != null) {
    trade.status = 'Escrow';
    trade.executedAt = event.block.timestamp;
    trade.save();
  }
}

export function handleTradeCompleted(event: TradeCompleted): void {
  let trade = Trade.load(event.params.tradeId.toString());
  if (trade != null) {
    trade.status = 'Completed';
    trade.completedAt = event.block.timestamp;
    trade.save();

    let seller = User.load(event.params.seller.toHex());
    if (seller != null) {
      seller.completedTradesVendor = seller.completedTradesVendor + 1;
      seller.updatedAt = event.block.timestamp;
      seller.save();
    }

    let buyer = User.load(event.params.buyer.toHex());
    if (buyer != null) {
      buyer.completedTradesBuyer = buyer.completedTradesBuyer + 1;
      buyer.updatedAt = event.block.timestamp;
      buyer.save();
    }
  }
}

export function handleTradeCancelled(event: TradeCancelled): void {
  let trade = Trade.load(event.params.tradeId.toString());
  if (trade != null) {
    trade.status = 'Cancelled';
    trade.cancelledAt = event.block.timestamp;
    trade.save();
  }
}

export function handleTradeDisputed(event: TradeDisputed): void {
  let trade = Trade.load(event.params.tradeId.toString());
  if (trade != null) {
    trade.status = 'Disputed';
    trade.disputed = true;
    trade.save();

    let dispute = new Dispute(event.params.tradeId.toString());
    dispute.tradeId = event.params.tradeId;
    dispute.trade = event.params.tradeId.toString();
    dispute.initiatedBy = event.params.disputer;
    dispute.reason = event.params.reason;
    dispute.initiatedAt = event.block.timestamp;
    dispute.resolved = false;
    dispute.save();

    let platform = getOrCreatePlatform();
    platform.totalDisputes = platform.totalDisputes + 1;
    platform.save();
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let dispute = Dispute.load(event.params.tradeId.toString());
  if (dispute != null) {
    dispute.resolved = true;
    dispute.resolvedBy = event.params.resolver;
    dispute.favorsbuyer = event.params.favorsbuyer;
    dispute.resolvedAt = event.block.timestamp;
    dispute.save();

    let platform = getOrCreatePlatform();
    platform.resolvedDisputes = platform.resolvedDisputes + 1;
    platform.save();
  }
}

export function handleUserProfileUpdated(event: UserProfileUpdated): void {
  let user = getOrCreateUser(event.params.user);
  
  let profile = UserProfile.load(event.params.user.toHex());
  if (profile == null) {
    profile = new UserProfile(event.params.user.toHex());
    profile.user = event.params.user.toHex();
  }
  
  profile.twitter = event.params.twitter;
  profile.discord = event.params.discord;
  profile.updatedAt = event.block.timestamp;
  profile.save();

  user.profile = event.params.user.toHex();
  user.updatedAt = event.block.timestamp;
  user.save();
}

export function handleReviewSubmitted(event: ReviewSubmitted): void {
  let review = new Review(event.params.reviewId.toString());
  review.reviewId = event.params.reviewId;
  review.reviewer = event.params.reviewer.toHex();
  review.reviewee = event.params.reviewee.toHex();
  review.rating = event.params.rating.toI32();
  review.comment = event.params.comment;
  review.helpful = BigInt.zero();
  review.createdAt = event.block.timestamp;
  review.createdBlock = event.block.number;
  review.save();

  let reviewee = User.load(event.params.reviewee.toHex());
  if (reviewee != null) {
    reviewee.reviewCount = reviewee.reviewCount + 1;
    reviewee.updatedAt = event.block.timestamp;
    reviewee.save();
  }

  let platform = getOrCreatePlatform();
  platform.totalReviews = platform.totalReviews + 1;
  platform.save();
}

export function handleReviewHelpful(event: ReviewHelpful): void {
  let review = Review.load(event.params.reviewId.toString());
  if (review != null) {
    review.helpful = review.helpful.plus(BigInt.fromI32(1));
    review.save();
  }
}
