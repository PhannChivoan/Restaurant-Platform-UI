import { Alert, Card, Col, ConfigProvider, Row, Table } from "antd";
import { palette } from "../../constants/theme";
import TopProgressBar from "./TopProgressBar";
import PageHeader from "./PageHeader";
import StatCard from "./StatCard";
import EmptyState from "./EmptyState";
import TableSkeleton from "./TableSkeleton";

const ModulePage = ({
  title,
  description,
  icon: Icon,
  stats = [],
  columns = [],
  rows = [],
  loading = false,
  error = "",
  pagination = false,
  toolbar,
  expandable,
  rowSelection,
}) => {
  const loadingActive =
    typeof loading === "object"
      ? Boolean(loading?.spinning)
      : Boolean(loading);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "auto",
        width: "100%",
      }}
    >
      <PageHeader icon={Icon} title={title} description={description} />

      {stats.length > 0 && (
        <Row gutter={[16, 16]}>
          {stats.map((stat) => (
            <Col key={stat.label} xs={24} sm={12} xl={{ flex: "1" }} style={{ minWidth: 0 }}>
              <StatCard icon={stat.icon} label={stat.label} value={stat.value} suffix={stat.suffix} description={stat.description} color={stat.color} iconBackground={stat.iconBackground} />
            </Col>
          ))}
        </Row>
      )}

      {columns.length > 0 && (
        <Card variant="outlined" className="module-table-card" styles={{ body: { padding: 20 } }}>
          {toolbar && <div className="module-toolbar" style={{ marginBottom: 14 }}>{toolbar}</div>}
          {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 14 }} />}
          <ConfigProvider
            theme={{
              token: {
                borderRadius: 10,
                colorBgContainer: palette.bg,
                colorBorder: palette.border,
              },
              components: {
                Table: {
                  headerBg: palette.tableHead,
                  headerColor: palette.muted,
                  headerBorderRadius: 12,
                },
              },
            }}
          >
            {loadingActive && rows.length === 0 ? (
              <TableSkeleton />
            ) : (
            <Table
              columns={columns}
              dataSource={rows}
              loading={loading}
              pagination={pagination ? { showTotal: (total, range) => `Showing ${range[0]}–${range[1]} of ${total} records`, ...pagination } : pagination}
              size="middle"
              locale={{ emptyText: <EmptyState title="No records found" description="Nothing matches yet. New activity will appear here." compact /> }}
              rowKey={(record) => record.key ?? record.id}
              rowSelection={rowSelection}
              expandable={expandable}
              scroll={{ x: "max-content" }}
              components={{
                header: {
                  cell: (props) => (
                    <th
                      {...props}
                      style={{ ...props.style, borderInlineEnd: "none" }}
                    />
                  ),
                },
              }}
            />
            )}
          </ConfigProvider>
        </Card>
      )}

      {error && !columns.length > 0 && (
        <Alert type="error" showIcon title={error} />
      )}

      <TopProgressBar
        active={loadingActive}
        label={`${title || "Module"} data loading`}
      />
    </div>
  );
};

export default ModulePage;
