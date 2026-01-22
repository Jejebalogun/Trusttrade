import { Readable } from 'stream';
export interface TradeData {
    tradeId: number;
    seller: string;
    buyer: string;
    token: string;
    tokenAmount: string;
    ethPrice: string;
    feePercentage: string;
    totalFee: string;
    status: string;
    createdAt: number;
    executedAt?: number;
    completedAt?: number;
}
export declare function generateTradeReceipt(trade: TradeData): Readable;
//# sourceMappingURL=pdfService.d.ts.map