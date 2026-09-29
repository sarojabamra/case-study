import Button from "@/components/ui/Button";
import FormMessage from "@/components/ui/FormMessage";
import Skeleton from "@/components/ui/Skeleton";
import { api, ApiError } from "@/services/api";
import type { ReviewSummary } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useState } from "react";

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ReviewSection({ productId }: { productId: number }) {
  const { user } = useAuth();
  const loadReviews = useCallback(
    () => api<ReviewSummary>(`/products/${productId}/reviews`),
    [productId],
  );
  const reviewsQuery = useLoadData(loadReviews, { showErrorToast: false });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      setComment("");
      await reviewsQuery.reload();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Your review could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (reviewsQuery.isPending) {
    return <Skeleton className="mt-12 h-56" />;
  }

  if (reviewsQuery.isError || !reviewsQuery.data) {
    return (
      <section className="mt-12 border-t border-line pt-8">
        <p className="text-sm">Reviews could not be loaded.</p>
        <Button className="mt-3" variant="secondary" onClick={() => void reviewsQuery.refetch()}>
          Try again
        </Button>
      </section>
    );
  }

  const { average_rating: averageRating, rating_count: ratingCount, reviews } = reviewsQuery.data;
  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
            Customer feedback
          </p>
          <h2 className="mt-2 font-display text-3xl font-light">Reviews</h2>
        </div>
        <p className="text-sm tabular-nums">
          {averageRating ? `${averageRating.toFixed(1)} / 5` : "No ratings yet"}
          {ratingCount ? ` · ${ratingCount} ${ratingCount === 1 ? "review" : "reviews"}` : ""}
        </p>
      </div>
      {user ? (
        <form className="mt-6 border border-line bg-surface p-4" onSubmit={submitReview}>
          <fieldset>
            <legend className="block text-sm font-medium">Your rating</legend>
            <div className="mt-2 flex gap-1" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  className={`h-11 w-11 border text-xl leading-none ${value <= rating ? "border-ink bg-ink text-canvas" : "border-line-strong bg-canvas text-muted"}`}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 block text-sm font-medium" htmlFor="review-comment">Your review <span className="text-muted">(optional)</span></label>
          <textarea
            id="review-comment"
            value={comment}
            maxLength={1000}
            onChange={(event) => setComment(event.target.value)}
            className="mt-2 min-h-24 w-full border border-line-strong bg-canvas p-3 text-sm outline-none focus:border-ink"
          />
          <FormMessage message={error} />
          <Button className="mt-4" type="submit" busy={isSubmitting} busyLabel="Saving review">
            Post review
          </Button>
          <p className="mt-3 text-xs text-muted">Reviews are available after delivery, with one review per customer.</p>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted">Sign in after delivery to leave a review.</p>
      )}
      <div className="mt-8 grid gap-4">
        {reviews.length === 0 ? <p className="text-sm text-muted">This product has no reviews yet.</p> : reviews.map((review) => (
          <article key={review.id} className="border border-line p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>{review.reviewer_name}</strong>
              <span aria-label={`${review.rating} out of 5 stars`} className="tracking-[0.12em]">{stars(review.rating)}</span>
            </div>
            {review.comment ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{review.comment}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
