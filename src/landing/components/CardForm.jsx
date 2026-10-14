import { useState } from "react";

import { cartRequest } from "../api/cartApi";
import { fmt } from "../hooks/useCart";

const input =
  "w-full px-space-md py-3.5 bg-surface-container-low rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-secondary focus:bg-surface-container-lowest focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.5)] transition-shadow";

const luhn = (digits) => {
  let sum = 0;
  [...digits].reverse().forEach((d, i) => {
    let n = Number(d);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  });
  return digits.length >= 12 && sum % 10 === 0;
};

const brandOf = (d) =>
  d.startsWith("4") ? "VISA" : /^(5[1-5]|2[2-7])/.test(d) ? "Mastercard" : /^3[47]/.test(d) ? "AMEX" : d.startsWith("62") ? "UnionPay" : "";

// The card as it will look, filled in live while typing.
const CardPreview = ({ number, holder, exp, brand }) => {
  const groups = (number + "•".repeat(16)).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  return (
    <div className="relative w-full aspect-[1.7/1] rounded-2xl p-space-lg text-white overflow-hidden shadow-[0_14px_36px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#ea580c]">
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-16 w-32 h-32 rounded-full bg-white/10" />
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90" />
          <span className="font-headline-sm text-headline-sm font-bold italic tracking-wide">{brand || "CARD"}</span>
        </div>
        <p className="font-headline-sm text-headline-sm tracking-[0.18em] tabular-nums">{groups}</p>
        <div className="flex items-end justify-between gap-space-sm">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Card holder</p>
            <p className="font-label-lg text-label-lg uppercase truncate">{holder || "Your name"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest opacity-70">Expires</p>
            <p className="font-label-lg text-label-lg tabular-nums">{exp || "MM/YY"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Credit / debit card form. Sandbox simulation: the server only validates and approves / declines the card.
const CardForm = ({ order, onPaid, onCancel, cancelling = false }) => {
  const [f, setF] = useState({ holder: "", number: "", exp: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const digits = f.number.replace(/\D/g, "");
  const brand = brandOf(digits);

  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setFormError("");
  };

  const fromServer = (err) => {
    const fe = err.fieldErrors || {};
    if (Object.keys(fe).length) {
      setErrors({ holder: fe.holder?.[0], number: fe.number?.[0], exp: fe.exp_month?.[0] || fe.exp_year?.[0], cvv: fe.cvv?.[0] });
    } else {
      setFormError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (!f.holder.trim()) errs.holder = "Enter the name on the card.";
    if (!luhn(digits)) errs.number = "Enter a valid card number.";
    const m = f.exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    const month = m ? Number(m[1]) : 0;
    const year = m ? 2000 + Number(m[2]) : 0;
    if (!m || month < 1 || month > 12) errs.exp = "Use MM/YY.";
    else if (new Date(year, month, 0, 23, 59, 59) < new Date()) errs.exp = "This card has expired.";
    if (!/^\d{3,4}$/.test(f.cvv)) errs.cvv = "3 or 4 digits.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await cartRequest(`payments/orders/${order.id}/card`, "POST", {
        holder: f.holder.trim(),
        number: digits,
        exp_month: month,
        exp_year: year,
        cvv: f.cvv,
      });
      onPaid(order);
    } catch (err) {
      fromServer(err);
    } finally {
      setBusy(false);
    }
  };

  const err = (k) => (errors[k] ? <p className="font-body-sm text-body-sm text-error mt-1">{errors[k]}</p> : null);
  const label = "block font-label-md text-label-md font-semibold text-on-surface mb-1.5";

  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center">
      <form
        onSubmit={submit}
        noValidate
        className="w-[min(94vw,36rem)] bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-space-xl flex flex-col gap-space-lg text-left"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Pay by card</h2>
          <span className="font-headline-sm text-headline-sm font-bold text-primary">{fmt(Number(order.total))}</span>
        </div>

        <CardPreview number={digits} holder={f.holder} exp={f.exp} brand={brand} />

        <div>
          <label className={label} htmlFor="cc-number">Card number</label>
          <input
            id="cc-number"
            className={input}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            maxLength={23}
            value={f.number}
            onChange={(e) => set("number", e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim())}
          />
          {err("number")}
        </div>

        <div>
          <label className={label} htmlFor="cc-name">Name on card</label>
          <input id="cc-name" className={input} autoComplete="cc-name" placeholder="As printed on the card" value={f.holder} onChange={(e) => set("holder", e.target.value)} />
          {err("holder")}
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div>
            <label className={label} htmlFor="cc-exp">Expiry date</label>
            <input
              id="cc-exp"
              className={input}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              maxLength={5}
              value={f.exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                set("exp", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
            />
            {err("exp")}
          </div>
          <div>
            <label className={label} htmlFor="cc-csc">CVV</label>
            <input
              id="cc-csc"
              className={input}
              inputMode="numeric"
              autoComplete="cc-csc"
              type="password"
              placeholder="•••"
              maxLength={4}
              value={f.cvv}
              onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {err("cvv")}
          </div>
        </div>

        {formError && (
          <p className="font-body-md text-body-md text-error bg-error-container/40 rounded-xl px-space-md py-space-sm">{formError}</p>
        )}

        <div className="flex flex-col gap-space-xs">
          <button
            type="submit"
            disabled={busy || cancelling}
            className="w-full min-h-[58px] bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md flex items-center justify-center gap-2"
          >
            {busy ? <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span> : `Pay ${fmt(Number(order.total))}`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy || cancelling}
            className="min-h-[52px] rounded-xl bg-surface-container-low hover:bg-surface-container font-label-lg text-label-lg font-bold text-on-surface flex items-center justify-center gap-2"
          >
            {cancelling ? <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span> : "Return back to checkout"}
          </button>
        </div>
        <p className="font-body-sm text-[12px] text-on-surface-variant text-center -mt-2">
          Sandbox mode: no real money is charged. Try 4242 4242 4242 4242 with any future date and CVV.
        </p>
      </form>
    </div>
  );
};

export default CardForm;