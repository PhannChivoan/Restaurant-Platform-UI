import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAddresses } from "../context/AddressContext";
import AddressMapModal from "./AddressMapModal";

// "Delivering to" pill with a dropdown of saved addresses and an "Add new address" map button.
const AddressSelector = ({ compact = false }) => {
  const { addresses, selected, select, added, signedIn } = useAddresses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = closed, "new" = add, or the address being edited
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={box}>
      {compact ? (
        // slim version for the site header
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-primary-container text-[20px]">location_on</span>
          <span className="font-label-md text-label-md text-on-surface font-semibold">Deliver to:</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[160px]">
            {selected ? selected.address : signedIn ? "Add your address" : "Choose address"}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
        </button>
      ) : (      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-low rounded-full cursor-pointer hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          location_on
        </span>
        <span className="flex flex-col text-left">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Delivering to</span>
          <span className="font-label-md text-label-md text-on-surface font-semibold max-w-[210px] truncate">
            {selected ? selected.address : signedIn ? "Add your address" : "Choose your address"}
          </span>
        </span>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">keyboard_arrow_down</span>
      </button>
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-[min(92vw,360px)] bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-low p-space-xs">
          {!signedIn ? (
            <div className="p-space-md flex flex-col gap-space-xs">
              <p className="font-body-sm text-body-sm text-on-surface-variant">Sign in to save delivery addresses and pick them here.</p>
              <Link to="/login" className="font-label-md text-label-md font-bold text-primary">
                Sign in →
              </Link>
            </div>
          ) : (
            <>
              {addresses.length === 0 && (
                <p className="p-space-md font-body-sm text-body-sm text-on-surface-variant">No saved addresses yet.</p>
              )}
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    select(a.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left flex gap-2 p-space-sm rounded-lg hover:bg-surface-container-low ${
                    selected?.id === a.id ? "bg-primary-container/10" : ""
                  }`}
                >
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    {a.label === "Home" ? "home" : a.label === "Office" ? "work" : "location_on"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-label-md text-label-md font-bold text-on-surface">{a.label}</span>
                    <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">
                      {a.details ? `${a.details} · ` : ""}
                      {a.address}
                    </span>
                  </span>
                  {selected?.id === a.id && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit ${a.label} address`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      setEditing(a);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), setOpen(false), setEditing(a))}
                    className="text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditing("new");
                }}
                className="w-full mt-1 p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container font-label-md text-label-md font-bold text-primary flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add_location_alt</span> Add new address on map
              </button>
            </>
          )}
        </div>
      )}

      {editing && (
        <AddressMapModal
          address={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(res) => {
            added(res);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default AddressSelector;