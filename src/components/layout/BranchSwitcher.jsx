import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Radio, Select, Tooltip, message } from "antd";
import { CopyPlus, Store } from "lucide-react";
import { request } from "../../utils/request";
import { palette } from "../../constants/theme";
import { setBranchId, useBranchId } from "../../utils/branchStore";

// Header dropdown: every branch has its own menu and orders, so the whole dashboard follows this choice.
const BranchSwitcher = () => {
  const branchId = useBranchId();
  const [branches, setBranches] = useState([]);
  const [loadOpen, setLoadOpen] = useState(false);
  const [mode, setMode] = useState("missing");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let alive = true;
    request("branches?limit=100", "GET").then((res) => {
      if (!alive || !Array.isArray(res?.data)) return;
      setBranches(res.data);
      // a remembered branch that no longer exists (or belongs to someone else) falls back to all branches
      if (branchId && !res.data.some((b) => String(b.id) === branchId)) setBranchId("");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(() => {
    const groups = new Map();
    [...branches]
      .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.id - b.id)
      .forEach((b) => {
        const g = b.restaurant_name || "Restaurant";
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push({
          value: String(b.id),
          label: `${b.name}${b.is_main ? " (Main)" : ""}`,
        });
      });
    return [
      { value: "", label: "All branches" },
      ...[...groups].map(([label, options]) => ({ label, options })),
    ];
  }, [branches]);

  const current = branches.find((b) => String(b.id) === branchId);
  if (branches.length === 0) return null;

  const loadFromMain = async () => {
    setWorking(true);
    const res = await request(`branches/${current.id}/menu/copy-from-main`, "POST", { mode });
    setWorking(false);
    if (res?.copied) {
      const { categories, items, skipped } = res.copied;
      message.success(
        `Loaded ${items} dish${items === 1 ? "" : "es"} and ${categories} categor${categories === 1 ? "y" : "ies"} from the main branch` +
          (skipped ? ` (${skipped} already there)` : ""),
      );
      setLoadOpen(false);
      // remount the pages so the new dishes show up
      const id = String(current.id);
      setBranchId("");
      setTimeout(() => setBranchId(id), 50);
    } else {
      message.error(res?.message || "Couldn't load the main menu.");
    }
  };

  return (
    <>
      <Select
        value={branchId}
        onChange={setBranchId}
        options={options}
        showSearch
        optionFilterProp="label"
        suffixIcon={<Store size={15} strokeWidth={1.75} color={palette.faint} />}
        style={{ width: 220 }}
        popupMatchSelectWidth={false}
        className="header-branch"
      />
      {current && !current.is_main && (
        <Tooltip title="Copy the main branch's menu into this branch">
          <Button
            icon={<CopyPlus size={15} strokeWidth={1.75} />}
            onClick={() => setLoadOpen(true)}
            className="header-branch-load"
          >
            Load main menu
          </Button>
        </Tooltip>
      )}
      <Modal
        open={loadOpen}
        title={`Load menu from the main branch into ${current?.name ?? ""}`}
        okText="Load menu"
        confirmLoading={working}
        onOk={loadFromMain}
        onCancel={() => setLoadOpen(false)}
      >
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} style={{ display: "grid", gap: 10 }}>
          <Radio value="missing">
            <b>Add only what is missing</b>
            <div style={{ color: palette.muted, fontSize: 12 }}>Keeps this branch's own dishes and prices.</div>
          </Radio>
          <Radio value="replace">
            <b>Replace this branch's menu</b>
            <div style={{ color: palette.muted, fontSize: 12 }}>Dishes here are overwritten by the main branch's menu.</div>
          </Radio>
        </Radio.Group>
      </Modal>
    </>
  );
};

export default BranchSwitcher;