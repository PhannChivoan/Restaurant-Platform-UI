import { useEffect, useState } from "react";

import { Config } from "../../utils/config";
import { useI18n } from "../i18n";
import { Stars } from "./ReviewBox";

const when = (iso) => new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

// Average rating and the latest customer reviews of a restaurant (public).
const RestaurantReviews = ({ restaurantId }) => {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!restaurantId) return undefined;
    let alive = true;
    fetch(`${Config.BASE_URL}public/restaurants/${restaurantId}/reviews`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setData(j))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  if (!data) return null;

  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low p-space-md">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-space-sm text-left">
        <span className="flex items-center gap-space-sm flex-wrap">
          <span className="font-label-lg text-label-lg font-bold text-on-surface">{t("review.restaurant", "Customer reviews")}</span>
          {data.total > 0 ? (
            <>
              <Stars value={data.average} />
              <span className="font-label-md text-label-md font-bold text-on-surface">{data.average}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">({data.total})</span>
            </>
          ) : (
            <span className="font-body-sm text-body-sm text-on-surface-variant">{t("review.none", "No reviews yet")}</span>
          )}
        </span>
        {data.total > 0 && <span className="material-symbols-outlined text-on-surface-variant">{open ? "expand_less" : "expand_more"}</span>}
      </button>

      {open && data.total > 0 && (
        <ul className="mt-space-sm flex flex-col divide-y divide-surface-container-low">
          {data.data.map((r) => (
            <li key={r.id} className="py-space-sm flex flex-col gap-0.5">
              <div className="flex items-center gap-space-sm">
                <Stars value={r.rating} size={15} />
                <span className="font-label-md text-label-md font-semibold text-on-surface">{r.name}</span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">{when(r.at)}</span>
              </div>
              {r.content && <p className="font-body-md text-body-md text-on-surface-variant">{r.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RestaurantReviews;
