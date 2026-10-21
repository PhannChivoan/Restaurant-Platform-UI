import {
  Card,
  Col,
  ConfigProvider,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
} from "antd";
import { palette } from "../../constants/theme";
import TopProgressBar from "./TopProgressBar";

const { Paragraph, Text, Title } = Typography;

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
      <div>
        <Space align="center" size={10}>
          {Icon && <Icon size={22} color={palette.primary} strokeWidth={1.8} />}
          <Title level={3} style={{ margin: 0, letterSpacing: "-0.02em" }}>
            {title}
          </Title>
        </Space>
        <Paragraph style={{ color: palette.muted, margin: "6px 0 0", maxWidth: 720 }}>
          {description}
        </Paragraph>
      </div>

      <Row gutter={[12, 12]}>
        {stats.map((stat) => (
          <Col key={stat.label} flex="1" style={{ minWidth: 0 }}>
            <Card
              variant="outlined"
              style={{
                height: "100%",
                borderRadius: 14,
                borderColor: stat.color ? `${stat.color}30` : undefined,
              }}
            >
              <div style={{ position: "relative", minHeight: 72 }}>
                {stat.icon && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      position: "absolute",
                      top: 0,
                      right: 0,
                      borderRadius: 10,
                      color: stat.color || palette.primary,
                      background: stat.iconBackground || palette.primaryLight,
                    }}
                  >
                    <stat.icon size={18} strokeWidth={1.8} />
                  </span>
                )}
                <div style={{ minWidth: 0, paddingRight: stat.icon ? 44 : 0 }}>
                  <Statistic
                    title={stat.label}
                    value={stat.value}
                    suffix={stat.suffix}
                    styles={{
                      content: { color: stat.color || palette.ink },
                    }}
                  />
                  {stat.description && (
                    <Text
                      type="secondary"
                      style={{ display: "block", marginTop: 2, fontSize: 12 }}
                    >
                      {stat.description}
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {columns.length > 0 && (
        <Card variant="outlined" style={{ borderRadius: 14 }}>
          {toolbar && <div style={{ marginBottom: 10 }}>{toolbar}</div>}
          {error && (
            <Paragraph type="danger" style={{ marginTop: 0 }}>
              {error}
            </Paragraph>
          )}
          <ConfigProvider
            theme={{
              token: {
                borderRadius: 10,
                colorBgContainer: palette.bg,
                colorBorder: palette.border,
              },
              components: {
                Table: {
                  headerBg: "#F8FAFC",
                  headerColor: palette.muted,
                  headerBorderRadius: 12,
                },
              },
            }}
          >
            <Table
              columns={columns}
              dataSource={rows}
              loading={loading}
              pagination={pagination}
              size="small"
              locale={{ emptyText: "No activity recorded yet" }}
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
          </ConfigProvider>
        </Card>
      )}

      {error && !columns.length > 0 && (
        <Card variant="outlined" style={{ borderRadius: 14 }}>
          <Paragraph type="danger" style={{ marginTop: 0 }}>
            {error}
          </Paragraph>
        </Card>
      )}

      <TopProgressBar
        active={loadingActive}
        label={`${title || "Module"} data loading`}
      />
    </div>
  );
};

export default ModulePage;
