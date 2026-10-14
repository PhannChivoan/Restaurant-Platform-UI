import {
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Activity,
  Bike,
  ChefHat,
  CircleDollarSign,
  ShoppingBag,
  Store,
  TimerReset,
} from "lucide-react";
import { palette } from "../constants/theme";

const { Text, Title } = Typography;

const orderColumns = [
  { title: "Order", dataIndex: "order", key: "order" },
  { title: "Restaurant", dataIndex: "restaurant", key: "restaurant" },
  { title: "Amount", dataIndex: "amount", key: "amount" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={status === "Delivered" ? "green" : "orange"}>{status}</Tag>
    ),
  },
];

const orderRows = [
  {
    key: "dashboard-order-1",
    order: "#ORD-1048",
    restaurant: "Sabay Kitchen",
    amount: "$24.80",
    status: "Preparing",
  },
  {
    key: "dashboard-order-2",
    order: "#ORD-1047",
    restaurant: "Rice & Roll",
    amount: "$18.50",
    status: "Delivered",
  },
  {
    key: "dashboard-order-3",
    order: "#ORD-1046",
    restaurant: "Sabay Kitchen",
    amount: "$31.20",
    status: "Out for delivery",
  },
  {
    key: "dashboard-order-4",
    order: "#ORD-1045",
    restaurant: "Noodle House",
    amount: "$16.90",
    status: "Preparing",
  },
];

const hourlyOrders = [
  { hour: "10 AM", value: 42 },
  { hour: "12 PM", value: 76 },
  { hour: "2 PM", value: 54 },
  { hour: "4 PM", value: 38 },
  { hour: "6 PM", value: 92 },
  { hour: "8 PM", value: 68 },
];

const HealthMetric = ({ icon: Icon, label, value, detail, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        borderRadius: 8,
        background: `${color}18`,
        color,
        flexShrink: 0,
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <Text strong>{value}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {detail}
        </Text>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Space align="center" size={10}>
          <Activity size={22} color={palette.primary} strokeWidth={1.8} />
          <Title level={3} style={{ margin: 0 }}>
            Operations overview
          </Title>
        </Space>
        <Text type="secondary">
          A live view of today&apos;s restaurant, kitchen, and delivery
          activity.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {[
          {
            label: "Orders today",
            value: 248,
            change: "+12.4%",
            icon: ShoppingBag,
            color: palette.primary,
          },
          {
            label: "Gross revenue",
            value: "$8,426",
            change: "+8.7%",
            icon: CircleDollarSign,
            color: palette.success,
          },
          {
            label: "Active deliveries",
            value: 17,
            change: "3 late",
            icon: Bike,
            color: palette.info,
          },
          {
            label: "Avg. delivery",
            value: 34,
            suffix: "min",
            change: "6 min under SLA",
            icon: TimerReset,
            color: palette.warning,
          },
        ].map((metric) => (
          <Col key={metric.label} xs={24} sm={12} lg={6}>
            <Card variant="outlined">
              <Space align="start" size={12}>
                <metric.icon size={20} color={metric.color} strokeWidth={1.8} />
                <Statistic
                  title={metric.label}
                  value={metric.value}
                  suffix={metric.suffix}
                  styles={{ content: { color: palette.ink, fontSize: 24 } }}
                />
              </Space>
              <Text style={{ color: metric.color, fontSize: 12 }}>
                {metric.change}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title="Order volume"
            extra={<Text type="secondary">Today</Text>}
            variant="outlined"
          >
            <div
              style={{
                height: 190,
                display: "flex",
                alignItems: "end",
                gap: 16,
                padding: "16px 8px 4px",
              }}
            >
              {hourlyOrders.map((item) => (
                <div
                  key={item.hour}
                  style={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "end",
                    gap: 8,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 11 }}>
                    {item.value}
                  </Text>
                  <div
                    style={{
                      height: `${(item.value / 100) * 130}px`,
                      minHeight: 12,
                      background: palette.primary,
                      borderRadius: "5px 5px 2px 2px",
                    }}
                  />
                  <Text
                    type="secondary"
                    style={{ textAlign: "center", fontSize: 11 }}
                  >
                    {item.hour}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="Live health" variant="outlined">
            <Space orientation="vertical" size={18} style={{ width: "100%" }}>
              <HealthMetric
                icon={ChefHat}
                label="Kitchen queue"
                value="18 orders"
                detail="6 urgent"
                color={palette.primary}
              />
              <HealthMetric
                icon={Bike}
                label="Rider availability"
                value="24 online"
                detail="17 active"
                color={palette.info}
              />
              <HealthMetric
                icon={Store}
                label="Restaurant partners"
                value="42 active"
                detail="5 pending"
                color={palette.success}
              />
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    On-time delivery rate
                  </Text>
                  <Text strong>94%</Text>
                </div>
                <Progress
                  percent={94}
                  showInfo={false}
                  strokeColor={palette.success}
                  railColor={palette.fillHover}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent orders"
        extra={<Text type="secondary">Updated just now</Text>}
        variant="outlined"
      >
        <Table
          columns={orderColumns}
          dataSource={orderRows}
          pagination={false}
          rowKey="key"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
