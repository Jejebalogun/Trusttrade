'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useReputationFee } from '@/hooks/useReputationFee';
import { feePercentageToBasisPoints } from '@/lib/ethos';
import { TRUSTTRADE_ABI, TRUSTTRADE_ADDRESS } from '@/lib/contract';

// Mock ERC20 ABI for approve function
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function TradeForm() {
  const { address, isConnected } = useAccount();
  const { feePercent, tier, isLoading: loadingReputation } = useReputationFee(address);

  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [ethPrice, setEthPrice] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'create'>('input');

  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const {
    writeContract: createTrade,
    data: createHash,
    isPending: isCreating,
  } = useWriteContract();

  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // Calculate fee amount
  const calculateFee = () => {
    if (!ethPrice) return '0';
    const price = parseFloat(ethPrice);
    const fee = (price * feePercent) / 100;
    return fee.toFixed(6);
  };

  const calculateNetAmount = () => {
    if (!ethPrice) return '0';
    const price = parseFloat(ethPrice);
    const fee = (price * feePercent) / 100;
    return (price - fee).toFixed(6);
  };

  // Handle approval
  const handleApprove = async () => {
    if (!tokenAddress || !tokenAmount) return;

    try {
      const amount = parseUnits(tokenAmount, 18); // Assuming 18 decimals
      approve({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TRUSTTRADE_ADDRESS, amount],
      });
      setStep('approve');
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  // Handle trade creation
  const handleCreateTrade = async () => {
    if (!tokenAddress || !tokenAmount || !ethPrice) return;

    try {
      const amount = parseUnits(tokenAmount, 18);
      const price = parseEther(ethPrice);
      const feeBasisPoints = feePercentageToBasisPoints(feePercent);

      createTrade({
        address: TRUSTTRADE_ADDRESS,
        abi: TRUSTTRADE_ABI,
        functionName: 'createTrade',
        args: [tokenAddress as `0x${string}`, amount, price, BigInt(feeBasisPoints)],
      });
      setStep('create');
    } catch (error) {
      console.error('Trade creation error:', error);
    }
  };

  // Reset form after success
  if (isCreateSuccess) {
    setTimeout(() => {
      setTokenAddress('');
      setTokenAmount('');
      setEthPrice('');
      setStep('input');
    }, 3000);
  }

  if (!isConnected) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Connect Wallet to Trade</h3>
        <p className="text-gray-400">You need to connect your wallet to create trades</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-8"
    >
      <h3 className="text-2xl font-bold mb-6">Create Trade</h3>

      {isCreateSuccess ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold mb-2">Trade Created Successfully!</h4>
          <p className="text-gray-400">Your trade is now active and visible to buyers</p>
        </div>
      ) : (
        <>
          {/* Token Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Token Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full"
              disabled={step !== 'input'}
            />
            <p className="text-xs text-gray-400 mt-1">
              The ERC20 token contract address you want to sell
            </p>
          </div>

          {/* Token Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Token Amount</label>
            <input
              type="number"
              placeholder="100"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              className="w-full"
              disabled={step !== 'input'}
            />
            <p className="text-xs text-gray-400 mt-1">Amount of tokens to sell</p>
          </div>

          {/* ETH Price */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Price in ETH</label>
            <input
              type="number"
              step="0.001"
              placeholder="0.05"
              value={ethPrice}
              onChange={(e) => setEthPrice(e.target.value)}
              className="w-full"
              disabled={step !== 'input'}
            />
            <p className="text-xs text-gray-400 mt-1">
              How much ETH you want to receive for the tokens
            </p>
          </div>

          {/* Fee Breakdown */}
          {ethPrice && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Fee Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Tier:</span>
                  <span className="font-semibold">{tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trading Fee:</span>
                  <span
                    className={
                      feePercent === 0
                        ? 'text-green-400'
                        : feePercent === 1
                        ? 'text-blue-400'
                        : 'text-orange-400'
                    }
                  >
                    {feePercent}% ({calculateFee()} ETH)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="font-semibold">You Receive:</span>
                  <span className="font-bold text-teal-400">{calculateNetAmount()} ETH</span>
                </div>
              </div>

              {feePercent === 0 && (
                <div className="mt-3 p-2 bg-green-500/10 rounded text-xs text-green-400">
                  🎉 VIP Status: You pay 0% fees!
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {step === 'input' && (
              <button
                onClick={handleApprove}
                disabled={!tokenAddress || !tokenAmount || !ethPrice || loadingReputation}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loadingReputation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading Reputation...
                  </>
                ) : (
                  <>
                    Approve Tokens
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {step === 'approve' && (
              <>
                {!isApproveSuccess ? (
                  <button disabled className="btn-primary w-full flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Approving Tokens...
                  </button>
                ) : (
                  <button
                    onClick={handleCreateTrade}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Create Trade
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {step === 'create' && isCreating && (
              <button disabled className="btn-primary w-full flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Trade...
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Tokens will be held in the smart contract until the trade is executed or cancelled
          </p>
        </>
      )}
    </motion.div>
  );
}
