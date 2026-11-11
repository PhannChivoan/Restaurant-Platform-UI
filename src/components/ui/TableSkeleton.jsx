import { Skeleton } from "antd";

const TableSkeleton = ({ rows = 6 }) => (
  <div style={{ padding: "8px 4px" }}>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} active title={false} paragraph={{ rows: 1, width: "100%" }} style={{ marginBottom: 14 }} />
    ))}
  </div>
);

export default TableSkeleton;
