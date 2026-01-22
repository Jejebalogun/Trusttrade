import PDFDocument from 'pdfkit';
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

export function generateTradeReceipt(trade: TradeData): Readable {
  const doc = new PDFDocument();
  
  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('TrustTrade Receipt', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(`Trade ID: #${trade.tradeId}`, { align: 'center' });
  doc.moveDown(1);

  // Status
  const statusColor = trade.status === 'Completed' ? '#10B981' : '#3B82F6';
  doc.fontSize(12).font('Helvetica-Bold').fillColor(statusColor).text(`Status: ${trade.status}`, {
    align: 'center',
  });
  doc.moveDown(1);

  // Trade Details
  doc.fillColor('#000000');
  doc.fontSize(12).font('Helvetica-Bold').text('Trade Details', { underline: true });
  doc.moveDown(0.5);

  const details = [
    ['Seller:', trade.seller],
    ['Buyer:', trade.buyer],
    ['Token:', trade.token],
    ['Token Amount:', trade.tokenAmount],
    ['ETH Price:', `${trade.ethPrice} ETH`],
    ['Fee Percentage:', trade.feePercentage],
    ['Total Fee:', `${trade.totalFee} ETH`],
  ];

  details.forEach(([label, value]) => {
    doc.fontSize(10).font('Helvetica-Bold').text(label, { width: 100 });
    doc.moveUp().fontSize(10).font('Helvetica').text(value, { align: 'right' });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // Timestamps
  doc.fontSize(12).font('Helvetica-Bold').text('Timeline', { underline: true });
  doc.moveDown(0.5);

  const timestamps = [
    ['Created:', new Date(trade.createdAt * 1000).toLocaleString()],
    trade.executedAt ? ['Executed:', new Date(trade.executedAt * 1000).toLocaleString()] : null,
    trade.completedAt ? ['Completed:', new Date(trade.completedAt * 1000).toLocaleString()] : null,
  ].filter(Boolean);

  timestamps.forEach(([label, value]: any) => {
    doc.fontSize(10).font('Helvetica-Bold').text(label as string, { width: 100 });
    doc.moveUp().fontSize(10).font('Helvetica').text(value, { align: 'right' });
    doc.moveDown(0.3);
  });

  doc.moveDown(2);

  // Footer
  doc.fontSize(8).fillColor('#666666').text('This is an on-chain verified receipt from TrustTrade.', {
    align: 'center',
  });
  doc.text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });

  doc.end();

  return doc as any as Readable;
}
