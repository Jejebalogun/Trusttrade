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
        uint256 executedAt; // When trade was executed (for escrow timer)
        uint256 escrowDuration; // How long to hold funds in escrow (default 24 hours)
        bool disputed; // Whether trade is under dispute
    }

    enum TradeStatus {
        Active,
        Escrow,
        Completed,
        Cancelled,
        Disputed
    }

    // User Profile struct
    struct UserProfile {
        string twitter; // Twitter/X handle (without @)
        string discord; // Discord username
        uint256 updatedAt; // Timestamp of last update
    }

    // Review struct
    struct Review {
        uint256 id;
        address reviewer;
        address reviewee;
        uint8 rating; // 1-5 stars
        string comment;
        uint256 createdAt;
        uint256 helpful; // Count of helpful votes
    }

    // State variables
    mapping(uint256 => Trade) public trades;
    uint256 public tradeCounter;
    address public feeCollector;
    uint256 public defaultEscrowDuration = 1 days; // Default 24 hour escrow
    
    // User profiles mapping
    mapping(address => UserProfile) public userProfiles;
    
    // Reviews storage
    mapping(uint256 => Review) public reviews;
    uint256 public reviewCounter;
    mapping(address => uint256[]) public userReviews; // Reviews about a user
    mapping(address => mapping(address => bool)) public userReviewedTrade; // Prevent duplicate reviews per trade

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

    event TradeInEscrow(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 escrowUntil
    );

    event TradeCompleted(uint256 indexed tradeId, address indexed buyer, address indexed seller);

    event TradeCancelled(uint256 indexed tradeId, address indexed seller);

    event TradeDisputed(uint256 indexed tradeId, address indexed disputer, string reason);

    event DisputeResolved(uint256 indexed tradeId, address indexed resolver, bool favorsbuyer);

    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    event UserProfileUpdated(address indexed user, string twitter, string discord);

    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed reviewer,
        address indexed reviewee,
        uint8 rating,
        string comment
    );

    event ReviewHelpful(uint256 indexed reviewId, address indexed voter);

    // Errors
    error InvalidToken();
    error InvalidAmount();
    error InvalidPrice();
    error InvalidFeeBasisPoints();
    error TradeNotActive();
    error TradeNotInEscrow();
    error UnauthorizedCancellation();
    error InsufficientETH();
    error TransferFailed();
    error EscrowNotExpired();
    error TradeDisputed();

    // Modifiers
    modifier validTrade(uint256 tradeId) {
        if (trades[tradeId].status != TradeStatus.Active) revert TradeNotActive();
        _;
    }

    modifier notDisputed(uint256 tradeId) {
        if (trades[tradeId].disputed) revert TradeDisputed();
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
            createdAt: block.timestamp,
            executedAt: 0,
            escrowDuration: defaultEscrowDuration,
            disputed: false
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
     * @notice Execute a trade by sending ETH (funds held in escrow)
     * @param tradeId The ID of the trade to execute
     */
    function executeTrade(uint256 tradeId)
        external
        payable
        nonReentrant
        validTrade(tradeId)
        notDisputed(tradeId)
    {
        Trade storage trade = trades[tradeId];

        // Validate ETH amount
        if (msg.value < trade.ethPrice) revert InsufficientETH();

        // Update trade status to escrow
        trade.status = TradeStatus.Escrow;
        trade.buyer = msg.sender;
        trade.executedAt = block.timestamp;

        // Transfer tokens to buyer immediately
        IERC20(trade.token).safeTransfer(msg.sender, trade.tokenAmount);

        // Refund excess ETH
        if (msg.value > trade.ethPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - trade.ethPrice
            }("");
            if (!refundSuccess) revert TransferFailed();
        }

        uint256 escrowUntil = block.timestamp + trade.escrowDuration;

        emit TradeInEscrow(tradeId, msg.sender, trade.seller, escrowUntil);
    }

    /**
     * @notice Release escrow funds to seller after escrow period expires
     * @param tradeId The ID of the trade
     */
    function releaseEscrow(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];

        // Check trade is in escrow
        if (trade.status != TradeStatus.Escrow) revert TradeNotInEscrow();
        
        // Check escrow period has expired
        if (block.timestamp < trade.executedAt + trade.escrowDuration) revert EscrowNotExpired();
        
        // Check not disputed
        if (trade.disputed) revert TradeDisputed();

        // Calculate fee
        uint256 feeAmount = (trade.ethPrice * trade.feeBasisPoints) / 10000;
        uint256 sellerAmount = trade.ethPrice - feeAmount;

        // Update status
        trade.status = TradeStatus.Completed;

        // Transfer ETH to seller
        (bool sellerSuccess, ) = payable(trade.seller).call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();

        // Transfer fee to collector
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeCollector).call{value: feeAmount}("");
            if (!feeSuccess) revert TransferFailed();
        }

        emit TradeCompleted(tradeId, trade.buyer, trade.seller);
    }

    /**
     * @notice Dispute a trade during escrow period
     * @param tradeId The ID of the trade to dispute
     * @param reason Reason for dispute
     */
    function disputeTrade(uint256 tradeId, string calldata reason) external {
        Trade storage trade = trades[tradeId];

        // Only buyer or seller can dispute
        require(
            msg.sender == trade.buyer || msg.sender == trade.seller,
            "Only buyer or seller can dispute"
        );

        // Trade must be in escrow
        if (trade.status != TradeStatus.Escrow) revert TradeNotInEscrow();

        // Mark as disputed
        trade.disputed = true;
        trade.status = TradeStatus.Disputed;

        emit TradeDisputed(tradeId, msg.sender, reason);
    }

    /**
     * @notice Resolve a disputed trade (only fee collector)
     * @param tradeId The ID of the trade
     * @param favorsbuyer True if resolution favors buyer (refund), false if favors seller
     */
    function resolveDispute(uint256 tradeId, bool favorsbuyer) external {
        require(msg.sender == feeCollector, "Only fee collector can resolve disputes");

        Trade storage trade = trades[tradeId];

        // Trade must be disputed
        if (trade.status != TradeStatus.Disputed) revert("Trade not disputed");

        trade.disputed = false;
        trade.status = TradeStatus.Completed;

        if (favorsbuyer) {
            // Refund buyer (return tokens were already transferred)
            (bool success, ) = payable(trade.buyer).call{value: trade.ethPrice}("");
            if (!success) revert TransferFailed();
        } else {
            // Favor seller - release escrow normally
            uint256 feeAmount = (trade.ethPrice * trade.feeBasisPoints) / 10000;
            uint256 sellerAmount = trade.ethPrice - feeAmount;

            (bool sellerSuccess, ) = payable(trade.seller).call{value: sellerAmount}("");
            if (!sellerSuccess) revert TransferFailed();

            if (feeAmount > 0) {
                (bool feeSuccess, ) = payable(feeCollector).call{value: feeAmount}("");
                if (!feeSuccess) revert TransferFailed();
            }
        }

        emit DisputeResolved(tradeId, msg.sender, favorsbuyer);
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
     * @notice Update the default escrow duration
     * @param newDuration New duration in seconds
     */
    function setDefaultEscrowDuration(uint256 newDuration) external {
        require(msg.sender == feeCollector, "Only fee collector");
        require(newDuration > 0, "Duration must be positive");
        defaultEscrowDuration = newDuration;
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
     * @notice Set or update user profile with social links
     * @param twitter Twitter/X handle (without @)
     * @param discord Discord username
     */
    function setUserProfile(string calldata twitter, string calldata discord) external {
        require(bytes(twitter).length > 0 || bytes(discord).length > 0, "At least one social link required");
        require(bytes(twitter).length <= 15, "Twitter handle max 15 characters");
        require(bytes(discord).length <= 37, "Discord username max 37 characters");

        userProfiles[msg.sender] = UserProfile({
            twitter: twitter,
            discord: discord,
            updatedAt: block.timestamp
        });

        emit UserProfileUpdated(msg.sender, twitter, discord);
    }

    /**
     * @notice Get user profile by address
     * @param user Address of the user
     * @return UserProfile struct with user's social links
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @notice Submit a review for a user
     * @param reviewee Address being reviewed
     * @param rating Rating from 1-5 stars
     * @param comment Review comment
     * @return reviewId The ID of the newly created review
     */
    function submitReview(
        address reviewee,
        uint8 rating,
        string calldata comment
    ) external returns (uint256) {
        require(msg.sender != reviewee, "Cannot review yourself");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(bytes(comment).length >= 10, "Comment must be at least 10 characters");
        require(bytes(comment).length <= 500, "Comment must be 500 characters or less");
        require(!userReviewedTrade[msg.sender][reviewee], "Already reviewed this user");

        uint256 reviewId = reviewCounter++;
        reviews[reviewId] = Review({
            id: reviewId,
            reviewer: msg.sender,
            reviewee: reviewee,
            rating: rating,
            comment: comment,
            createdAt: block.timestamp,
            helpful: 0
        });

        userReviews[reviewee].push(reviewId);
        userReviewedTrade[msg.sender][reviewee] = true;

        emit ReviewSubmitted(reviewId, msg.sender, reviewee, rating, comment);

        return reviewId;
    }

    /**
     * @notice Mark a review as helpful
     * @param reviewId The ID of the review
     */
    function markReviewHelpful(uint256 reviewId) external {
        Review storage review = reviews[reviewId];
        require(review.id == reviewId, "Review does not exist");
        require(msg.sender != review.reviewer, "Cannot vote on own review");

        review.helpful++;

        emit ReviewHelpful(reviewId, msg.sender);
    }

    /**
     * @notice Get review by ID
     * @param reviewId The ID of the review
     * @return Review struct with all review details
     */
    function getReview(uint256 reviewId) external view returns (Review memory) {
        return reviews[reviewId];
    }

    /**
     * @notice Get all reviews for a user
     * @param user Address of the user
     * @return Array of review IDs for the user
     */
    function getUserReviews(address user) external view returns (uint256[] memory) {
        return userReviews[user];
    }

    /**
     * @notice Get average rating for a user
     * @param user Address of the user
     * @return averageRating The average rating (scaled by 100, so 450 = 4.5 stars)
     */
    function getUserAverageRating(address user) external view returns (uint256) {
        uint256[] memory reviewIds = userReviews[user];
        if (reviewIds.length == 0) return 0;

        uint256 totalRating = 0;
        for (uint256 i = 0; i < reviewIds.length; i++) {
            totalRating += reviews[reviewIds[i]].rating;
        }

        return (totalRating * 100) / reviewIds.length;
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

    /**
     * @notice Check if escrow period has expired for a trade
     * @param tradeId The ID of the trade
     * @return bool True if escrow period expired
     */
    function isEscrowExpired(uint256 tradeId) external view returns (bool) {
        Trade memory trade = trades[tradeId];
        if (trade.status != TradeStatus.Escrow) return false;
        return block.timestamp >= trade.executedAt + trade.escrowDuration;
    }

    /**
     * @notice Get escrow expiry time for a trade
     * @param tradeId The ID of the trade
     * @return uint256 Timestamp when escrow expires
     */
    function getEscrowExpiryTime(uint256 tradeId) external view returns (uint256) {
        Trade memory trade = trades[tradeId];
        if (trade.status != TradeStatus.Escrow) return 0;
        return trade.executedAt + trade.escrowDuration;
    }
}
