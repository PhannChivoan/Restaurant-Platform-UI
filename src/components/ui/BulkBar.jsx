import { Button, Dropdown, Space, Typography } from "antd";
import { ChevronDown, X } from "lucide-react";

import { palette } from "../../constants/theme";

const { Text } = Typography;

/**
 * "3 selected" strip with a menu of bulk actions. Shown above a table when rows are ticked.
 * actions: [{ key, label, danger? }]
 */
const BulkBar = ({ count, actions, onAction, onClear, busy = false }) => {
  if (!count) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
        width: "100%",
        padding: "6px 12px",
        border: `1px solid ${palette.primary}`,
        background: palette.primaryLight,
        borderRadius: 2,
      }}
    >
      <Text strong>{count} selected</Text>
      <Space size={8}>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: actions.map((a) => ({ key: a.key, label: a.label, danger: a.danger })),
            onClick: ({ key }) => onAction(key),
          }}
        >
          <Button type="primary" size="small" loading={busy} icon={<ChevronDown size={14} />} iconPosition="end">
            Bulk actions
          </Button>
        </Dropdown>
        <Button size="small" icon={<X size={14} />} onClick={onClear}>
          Clear
        </Button>
      </Space>
    </div>
  );
};

export default BulkBar;
