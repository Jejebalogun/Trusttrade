"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTradeReceipt = generateTradeReceipt;
const pdfkit_1 = __importDefault(require("pdfkit"));
function generateTradeReceipt(trade) {
    const doc = new pdfkit_1.default();
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
    timestamps.forEach(([label, value]) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, { width: 100 });
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
    return doc;
}
//# sourceMappingURL=pdfService.js.map