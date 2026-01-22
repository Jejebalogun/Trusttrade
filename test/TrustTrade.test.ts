import { expect } from "chai";
import { ethers } from "hardhat";
import { TrustTrade, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrustTrade", function () {
  let trustTrade: TrustTrade;
  let mockToken: MockERC20;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let feeCollector: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const TOKEN_AMOUNT = ethers.parseEther("100");
  const ETH_PRICE = ethers.parseEther("0.05");
  const FEE_BASIS_POINTS = 250; // 2.5%

  beforeEach(async function () {
    [owner, seller, buyer, feeCollector] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("DAK Token", "DAK", INITIAL_SUPPLY);
    await mockToken.waitForDeployment();

    // Deploy TrustTrade
    const TrustTradeFactory = await ethers.getContractFactory("TrustTrade");
    trustTrade = await TrustTradeFactory.deploy(feeCollector.address);
    await trustTrade.waitForDeployment();

    // Transfer tokens to seller
    await mockToken.transfer(seller.address, TOKEN_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set the correct fee collector", async function () {
      expect(await trustTrade.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should initialize trade counter to 0", async function () {
      expect(await trustTrade.tradeCounter()).to.equal(0);
    });
  });

  describe("Create Trade", function () {
    it("Should create a trade successfully", async function () {
      // Approve contract to spend tokens
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);

      // Create trade
      await expect(
        trustTrade
          .connect(seller)
          .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS)
      )
        .to.emit(trustTrade, "TradeCreated")
        .withArgs(0, seller.address, await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);

      // Verify trade details
      const trade = await trustTrade.getTrade(0);
      expect(trade.seller).to.equal(seller.address);
      expect(trade.tokenAmount).to.equal(TOKEN_AMOUNT);
      expect(trade.ethPrice).to.equal(ETH_PRICE);
      expect(trade.feeBasisPoints).to.equal(FEE_BASIS_POINTS);
      expect(trade.status).to.equal(0); // Active
    });

    it("Should transfer tokens to contract", async function () {
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);

      const contractBalance = await mockToken.balanceOf(await trustTrade.getAddress());
      expect(contractBalance).to.equal(TOKEN_AMOUNT);
    });

    it("Should revert with invalid token address", async function () {
      await expect(
        trustTrade.connect(seller).createTrade(ethers.ZeroAddress, TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS)
      ).to.be.revertedWithCustomError(trustTrade, "InvalidToken");
    });

    it("Should revert with zero token amount", async function () {
      await expect(
        trustTrade.connect(seller).createTrade(await mockToken.getAddress(), 0, ETH_PRICE, FEE_BASIS_POINTS)
      ).to.be.revertedWithCustomError(trustTrade, "InvalidAmount");
    });

    it("Should revert with zero ETH price", async function () {
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await expect(
        trustTrade.connect(seller).createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, 0, FEE_BASIS_POINTS)
      ).to.be.revertedWithCustomError(trustTrade, "InvalidPrice");
    });
  });

  describe("Execute Trade", function () {
    beforeEach(async function () {
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);
    });

    it("Should execute trade successfully", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(feeCollector.address);

      // Calculate expected amounts
      const feeAmount = (ETH_PRICE * BigInt(FEE_BASIS_POINTS)) / BigInt(10000);
      const sellerAmount = ETH_PRICE - feeAmount;

      await expect(trustTrade.connect(buyer).executeTrade(0, { value: ETH_PRICE }))
        .to.emit(trustTrade, "TradeExecuted")
        .withArgs(0, buyer.address, seller.address, ETH_PRICE, TOKEN_AMOUNT, feeAmount);

      // Verify buyer received tokens
      const buyerTokenBalance = await mockToken.balanceOf(buyer.address);
      expect(buyerTokenBalance).to.equal(TOKEN_AMOUNT);

      // Verify seller received ETH (minus fee)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);

      // Verify fee collector received fee
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(feeCollector.address);
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(feeAmount);

      // Verify trade status
      const trade = await trustTrade.getTrade(0);
      expect(trade.status).to.equal(1); // Completed
      expect(trade.buyer).to.equal(buyer.address);
    });

    it("Should execute trade with zero fee (VIP tier)", async function () {
      // Create trade with 0% fee
      await mockToken.transfer(seller.address, TOKEN_AMOUNT);
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await trustTrade.connect(seller).createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, 0);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await trustTrade.connect(buyer).executeTrade(1, { value: ETH_PRICE });

      // Verify seller received full ETH amount
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ETH_PRICE);
    });

    it("Should refund excess ETH", async function () {
      const excessAmount = ethers.parseEther("0.01");
      const totalSent = ETH_PRICE + excessAmount;

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await trustTrade.connect(buyer).executeTrade(0, { value: totalSent });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should have paid ETH_PRICE + gas, excess should be refunded
      expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(ETH_PRICE + gasUsed, ethers.parseEther("0.001"));
    });

    it("Should revert with insufficient ETH", async function () {
      const insufficientAmount = ethers.parseEther("0.01");
      await expect(
        trustTrade.connect(buyer).executeTrade(0, { value: insufficientAmount })
      ).to.be.revertedWithCustomError(trustTrade, "InsufficientETH");
    });

    it("Should revert if trade is not active", async function () {
      // Execute trade first
      await trustTrade.connect(buyer).executeTrade(0, { value: ETH_PRICE });

      // Try to execute again
      await expect(
        trustTrade.connect(buyer).executeTrade(0, { value: ETH_PRICE })
      ).to.be.revertedWithCustomError(trustTrade, "TradeNotActive");
    });
  });

  describe("Cancel Trade", function () {
    beforeEach(async function () {
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);
    });

    it("Should cancel trade successfully", async function () {
      await expect(trustTrade.connect(seller).cancelTrade(0))
        .to.emit(trustTrade, "TradeCancelled")
        .withArgs(0, seller.address);

      // Verify tokens returned to seller
      const sellerBalance = await mockToken.balanceOf(seller.address);
      expect(sellerBalance).to.equal(TOKEN_AMOUNT);

      // Verify trade status
      const trade = await trustTrade.getTrade(0);
      expect(trade.status).to.equal(2); // Cancelled
    });

    it("Should revert if not seller", async function () {
      await expect(trustTrade.connect(buyer).cancelTrade(0)).to.be.revertedWithCustomError(
        trustTrade,
        "UnauthorizedCancellation"
      );
    });

    it("Should revert if trade is not active", async function () {
      await trustTrade.connect(seller).cancelTrade(0);

      await expect(trustTrade.connect(seller).cancelTrade(0)).to.be.revertedWithCustomError(
        trustTrade,
        "TradeNotActive"
      );
    });
  });

  describe("Fee Collector Management", function () {
    it("Should update fee collector", async function () {
      const newCollector = buyer.address;

      await expect(trustTrade.connect(feeCollector).updateFeeCollector(newCollector))
        .to.emit(trustTrade, "FeeCollectorUpdated")
        .withArgs(feeCollector.address, newCollector);

      expect(await trustTrade.feeCollector()).to.equal(newCollector);
    });

    it("Should revert if not called by fee collector", async function () {
      await expect(trustTrade.connect(buyer).updateFeeCollector(buyer.address)).to.be.revertedWith(
        "Only fee collector"
      );
    });

    it("Should revert with zero address", async function () {
      await expect(trustTrade.connect(feeCollector).updateFeeCollector(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid address"
      );
    });
  });

  describe("View Functions", function () {
    it("Should return correct active trades count", async function () {
      expect(await trustTrade.getActiveTradesCount()).to.equal(0);

      // Create trades
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT * BigInt(3));
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);

      expect(await trustTrade.getActiveTradesCount()).to.equal(1);

      await mockToken.transfer(seller.address, TOKEN_AMOUNT * BigInt(2));
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT * BigInt(2));
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);

      expect(await trustTrade.getActiveTradesCount()).to.equal(2);

      // Execute one trade
      await trustTrade.connect(buyer).executeTrade(0, { value: ETH_PRICE });
      expect(await trustTrade.getActiveTradesCount()).to.equal(1);
    });

    it("Should check if trade is active", async function () {
      await mockToken.connect(seller).approve(await trustTrade.getAddress(), TOKEN_AMOUNT);
      await trustTrade
        .connect(seller)
        .createTrade(await mockToken.getAddress(), TOKEN_AMOUNT, ETH_PRICE, FEE_BASIS_POINTS);

      expect(await trustTrade.isTradeActive(0)).to.be.true;

      await trustTrade.connect(buyer).executeTrade(0, { value: ETH_PRICE });
      expect(await trustTrade.isTradeActive(0)).to.be.false;
    });
  });
});
