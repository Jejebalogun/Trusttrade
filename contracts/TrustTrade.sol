// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TrustTrade
 * @notice A reputation-weighted OTC trading platform for ETH-to-ERC20 swaps
 * @dev Integrates with Ethos Network for reputation-based fee calculation
 */
contract TrustTrade is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Structs
    struct Trade {
        uint256 id;
        address seller;
        address buyer;
        address token;
        uint256 tokenAmount;
        uint256 ethPrice;
        uint256 feeBasisPoints; // Fee in basis points (1 bp = 0.01%)
        TradeStatus status;
        uint256 createdAt;
    }

    enum TradeStatus {
        Active,
        Completed,
        Cancelled
    }

    // State variables
    mapping(uint256 => Trade) public trades;
    uint256 public tradeCounter;
    address public feeCollector;

    // Events
    event TradeCreated(
        uint256 indexed tradeId,
        address indexed seller,
        address token,
        uint256 tokenAmount,
        uint256 ethPrice,
        uint256 feeBasisPoints
    );

    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 feeAmount
    );

    event TradeCancelled(uint256 indexed tradeId, address indexed seller);

    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    // Errors
    error InvalidToken();
    error InvalidAmount();
    error InvalidPrice();
    error InvalidFeeBasisPoints();
    error TradeNotActive();
    error UnauthorizedCancellation();
    error InsufficientETH();
    error TransferFailed();

    // Modifiers
    modifier validTrade(uint256 tradeId) {
        if (trades[tradeId].status != TradeStatus.Active) revert TradeNotActive();
        _;
    }

    /**
     * @notice Constructor sets the fee collector address
     * @param _feeCollector Address that will receive trading fees
     */
    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @notice Create a new trade offer
     * @param token Address of the ERC20 token to sell
     * @param tokenAmount Amount of tokens to sell
     * @param ethPrice Amount of ETH required to buy the tokens
     * @param feeBasisPoints Fee in basis points based on Ethos score
     * @return tradeId The ID of the newly created trade
     */
    function createTrade(
        address token,
        uint256 tokenAmount,
        uint256 ethPrice,
        uint256 feeBasisPoints
    ) external nonReentrant returns (uint256) {
        // Validations
        if (token == address(0)) revert InvalidToken();
        if (tokenAmount == 0) revert InvalidAmount();
        if (ethPrice == 0) revert InvalidPrice();
        if (feeBasisPoints > 10000) revert InvalidFeeBasisPoints(); // Max 100%

        // Transfer tokens from seller to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Create trade
        uint256 tradeId = tradeCounter++;
        trades[tradeId] = Trade({
            id: tradeId,
            seller: msg.sender,
            buyer: address(0),
            token: token,
            tokenAmount: tokenAmount,
            ethPrice: ethPrice,
            feeBasisPoints: feeBasisPoints,
            status: TradeStatus.Active,
            createdAt: block.timestamp
        });

        emit TradeCreated(
            tradeId,
            msg.sender,
            token,
            tokenAmount,
            ethPrice,
            feeBasisPoints
        );

        return tradeId;
    }

    /**
     * @notice Execute a trade by sending ETH and receiving tokens
     * @param tradeId The ID of the trade to execute
     */
    function executeTrade(uint256 tradeId)
        external
        payable
        nonReentrant
        validTrade(tradeId)
    {
        Trade storage trade = trades[tradeId];

        // Validate ETH amount
        if (msg.value < trade.ethPrice) revert InsufficientETH();

        // Calculate fee
        uint256 feeAmount = (trade.ethPrice * trade.feeBasisPoints) / 10000;
        uint256 sellerAmount = trade.ethPrice - feeAmount;

        // Update trade status
        trade.status = TradeStatus.Completed;
        trade.buyer = msg.sender;

        // Transfer tokens to buyer
        IERC20(trade.token).safeTransfer(msg.sender, trade.tokenAmount);

        // Transfer ETH to seller
        (bool sellerSuccess, ) = payable(trade.seller).call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();

        // Transfer fee to collector
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeCollector).call{value: feeAmount}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Refund excess ETH
        if (msg.value > trade.ethPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - trade.ethPrice
            }("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit TradeExecuted(
            tradeId,
            msg.sender,
            trade.seller,
            trade.ethPrice,
            trade.tokenAmount,
            feeAmount
        );
    }

    /**
     * @notice Cancel an active trade and return tokens to seller
     * @param tradeId The ID of the trade to cancel
     */
    function cancelTrade(uint256 tradeId)
        external
        nonReentrant
        validTrade(tradeId)
    {
        Trade storage trade = trades[tradeId];

        // Only seller can cancel
        if (msg.sender != trade.seller) revert UnauthorizedCancellation();

        // Update status
        trade.status = TradeStatus.Cancelled;

        // Return tokens to seller
        IERC20(trade.token).safeTransfer(trade.seller, trade.tokenAmount);

        emit TradeCancelled(tradeId, msg.sender);
    }

    /**
     * @notice Update the fee collector address
     * @param newCollector New fee collector address
     */
    function updateFeeCollector(address newCollector) external {
        require(msg.sender == feeCollector, "Only fee collector");
        require(newCollector != address(0), "Invalid address");

        address oldCollector = feeCollector;
        feeCollector = newCollector;

        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Get trade details
     * @param tradeId The ID of the trade
     * @return Trade struct with all trade details
     */
    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    /**
     * @notice Get active trades count
     * @return count Number of active trades
     */
    function getActiveTradesCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < tradeCounter; i++) {
            if (trades[i].status == TradeStatus.Active) {
                count++;
            }
        }
    }

    /**
     * @notice Check if a trade is active
     * @param tradeId The ID of the trade
     * @return bool True if trade is active
     */
    function isTradeActive(uint256 tradeId) external view returns (bool) {
        return trades[tradeId].status == TradeStatus.Active;
    }
}
