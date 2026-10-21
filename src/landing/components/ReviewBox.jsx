import { useState } from "react";

import { cartRequest } from "../api/cartApi";

export const Stars = ({ value, size = 18 }) => (
  <span className="inline-flex text-primary-container" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        className="material-symbols-outlined"
        style={{ fontSize: size, fontVariationSettings: `'FILL' ${n <= Math.round(value) ? 1 : 0}` }}
      >
        star
      </span>
    ))}
  </span>
);

// Rate a delivered order (1-5 stars and an optional comment). Shows the review once it is sent.
const ReviewBox = ({ orderId, review, onDone }) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (review) {
    return (
      <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-1">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Your review</h2>
        <Stars value={review.rating} />
        {review.content && <p className="font-body-md text-body-md text-on-surface-variant">{review.content}</p>}
      </section>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to rate your order.");
    setBusy(true);
    setError("");
    try {
      await cartRequest(`my/orders/${orderId}/review`, "POST", { rating, content: content.trim() || null });
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-sm">
      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">How was your order?</h2>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="text-primary-container"
          >
            <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: `'FILL' ${n <= rating ? 1 : 0}` }}>
              star
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Tell others about the food and the delivery (optional)"
        className="w-full rounded-xl border border-surface-container-high bg-surface px-space-md py-space-sm font-body-md text-body-md"
      />
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="self-start px-space-lg py-2 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send review"}
      </button>
    </form>
  );
};

export default ReviewBox;
