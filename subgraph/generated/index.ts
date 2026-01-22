// Auto-generated schema types from GraphQL
// Run: graph codegen to regenerate

export class Trade {
  static load(id: string): Trade | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  tradeId?: any;
  seller?: any;
  buyer?: any;
  token?: string;
  tokenAmount?: any;
  ethPrice?: any;
  feeBasisPoints?: any;
  status?: string;
  disputed?: boolean;
  createdAt?: any;
  executedAt?: any;
  escrowDuration?: any;
  completedAt?: any;
  cancelledAt?: any;
  dispute?: any;
  createdBlock?: any;
}

export class User {
  static load(id: string): User | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  address?: any;
  totalTradesVendor?: any;
  totalTradesBuyer?: any;
  completedTradesVendor?: any;
  completedTradesBuyer?: any;
  totalVolume?: any;
  averageRating?: any;
  reviewCount?: any;
  profile?: any;
  createdAt?: any;
  updatedAt?: any;
}

export class Review {
  static load(id: string): Review | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  reviewId?: any;
  reviewer?: any;
  reviewee?: any;
  rating?: any;
  comment?: string;
  helpful?: any;
  createdAt?: any;
  createdBlock?: any;
}

export class UserProfile {
  static load(id: string): UserProfile | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  user?: any;
  twitter?: string;
  discord?: string;
  updatedAt?: any;
}

export class Dispute {
  static load(id: string): Dispute | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  tradeId?: any;
  trade?: any;
  initiatedBy?: any;
  resolvedBy?: any;
  reason?: string;
  favorsbuyer?: any;
  initiatedAt?: any;
  resolvedAt?: any;
  resolved?: boolean;
}

export class Platform {
  static load(id: string): Platform | null { return null; }
  constructor(id: string) {}
  save(): void {}
  id?: string;
  totalTrades?: any;
  totalVolume?: any;
  totalUsers?: any;
  totalReviews?: any;
  totalDisputes?: any;
  resolvedDisputes?: any;
  totalEthCollected?: any;
  lastUpdatedBlock?: any;
  lastUpdatedTimestamp?: any;
}
