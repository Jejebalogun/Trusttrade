'use client';

import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: number;
  reviewer: string;
  reviewee: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
  helpful: number;
  type: 'buyer' | 'seller'; // Who is reviewing whom
}

interface UserReviewsProps {
  reviews: Review[];
  userAddress?: string;
  averageRating?: number;
  totalReviews?: number;
  isLoading?: boolean;
  onAddReview?: (rating: number, comment: string) => Promise<void>;
}

export default function UserReviews({
  reviews,
  userAddress,
  averageRating = 0,
  totalReviews = 0,
  isLoading = false,
  onAddReview,
}: UserReviewsProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');

  const handleSubmitReview = async () => {
    if (!rating || !comment.trim() || !onAddReview) return;

    if (comment.length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddReview(rating, comment);
      setSuccess(true);
      setRating(0);
      setComment('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpful - a.helpful;
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'recent':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            disabled={!interactive}
            className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= (interactive ? hoveredRating || rating : value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="w-full space-y-6">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gray-900/40 border border-gray-800 rounded-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Overall Rating */}
            <div className="text-center sm:text-left sm:border-r border-gray-800 pr-6">
              <div className="text-4xl font-bold text-white mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center sm:justify-start mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-sm text-gray-400">{totalReviews} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="sm:col-span-2">
              {ratingDistribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1 w-16">
                    {[...Array(star)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    {[...Array(5 - star)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-gray-600" />
                    ))}
                  </div>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                      style={{
                        width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Review Form */}
      {onAddReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-lg space-y-4"
        >
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            Leave a Review
          </h3>

          {/* Star Rating Selector */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Rating</label>
            {renderStars(rating, true)}
          </div>

          {/* Comment Input */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              placeholder="Share your experience with this user..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-teal-500/10 border border-teal-500/30 rounded text-sm text-teal-300"
              >
                ✓ Review submitted successfully!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            onClick={handleSubmitReview}
            disabled={!rating || !comment.trim() || isSubmitting}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg text-white font-medium hover:from-teal-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Reviews ({reviews.length})</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:border-teal-500/50 transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        )}

        <AnimatePresence>
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : sortedReviews.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4 rounded-lg bg-gray-900/50 border border-gray-800"
            >
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No reviews yet</p>
              <p className="text-xs text-gray-500 mt-1">Be the first to review this user</p>
            </motion.div>
          ) : (
            // Review cards
            sortedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg hover:border-teal-500/30 transition-all"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-white text-sm">
                        {formatAddress(review.reviewer)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
                        {review.type === 'buyer' ? 'Buyer' : 'Seller'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>

                  <div className="flex-shrink-0">{renderStars(review.rating)}</div>
                </div>

                {/* Review Comment */}
                <p className="text-sm text-gray-300 mb-3">{review.comment}</p>

                {/* Helpful Button */}
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors text-xs text-gray-400 hover:text-teal-400 group">
                  <ThumbsUp className="w-3 h-3 group-hover:fill-teal-400" />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
