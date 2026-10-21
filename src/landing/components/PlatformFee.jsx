import { formatMoney } from "../../utils/platformSettings";
// Worked example for a $20.00 order, so the deduction is easy to understand.
export const FeeExample = ({ rate }) => {
  const order = 20;
  const fee = rate === null ? null : Math.round(order * rate) / 100;
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-sm w-full max-w-sm">
      <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Example: one $20.00 order</p>
      <div className="flex justify-between font-body-md text-body-md text-on-surface">
        <span>Customer pays for food</span>
        <span className="font-semibold">$20.00</span>
      </div>
      <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
        <span>Platform commission ({rate ?? "…"}%)</span>
        <span>− {fee === null ? "…" : `${formatMoney(fee)}`}</span>
      </div>
      <div className="flex justify-between border-t border-surface-container-low pt-space-sm font-headline-sm text-headline-sm font-bold text-primary">
        <span>You receive</span>
        <span>{fee === null ? "…" : `${formatMoney((order - fee))}`}</span>
      </div>
    </div>
  );
};