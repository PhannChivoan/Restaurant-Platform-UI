import StatusBadge from "./StatusBadge";

export const statusColumn = {
  title: "Status",
  dataIndex: "status",
  key: "status",
  render: (status) => <StatusBadge status={status} />,
};
