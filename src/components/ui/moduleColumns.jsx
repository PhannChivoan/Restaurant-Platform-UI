import { Tag } from "antd";

export const statusColumn = {
  title: "Status",
  dataIndex: "status",
  key: "status",
  render: (status) => (
    <Tag color={status === "Active" ? "green" : "orange"}>{status}</Tag>
  ),
};
