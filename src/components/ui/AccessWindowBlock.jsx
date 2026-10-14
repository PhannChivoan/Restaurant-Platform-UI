import { Alert, Button, Space, Typography } from "antd";
import { Clock, LogOut, RefreshCw, ShieldAlert } from "lucide-react";

import { palette } from "../../constants/theme";

const { Text } = Typography;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatDays = (days = []) => {
  if (days.length === 7) return "every day";
  if (days.length === 0) return "no days selected";
  // collapse a Mon-Fri run so the sentence stays short
  if (days.join(",") === "Mon,Tue,Wed,Thu,Fri") return "Mon–Fri";
  return days.join(", ");
};

const formatWindow = (window) =>
  `${formatDays(window.days)} · ${window.start_time}–${window.end_time}`;

/**
 * Full-screen explanation shown when the signed-in role sits outside its access
 * window. The API already refuses the calls; this makes the reason visible instead
 * of leaving the operator with a page of failed requests.
 */
const AccessWindowBlock = ({ status, onRetry }) => (
  <div
    style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
    }}
  >
    <div style={{ maxWidth: 560, width: "100%" }}>
      <Alert
        type="warning"
        showIcon
        icon={<ShieldAlert size={22} />}
        message={
          <Text strong style={{ fontSize: 16 }}>
            Outside your access window
          </Text>
        }
        description={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text style={{ fontSize: 13 }}>
              {status.message ||
                "Your role is only allowed to work inside its configured access window."}
            </Text>

            {status.windows?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 12,
                  background: palette.bgSubtle,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  When you can work
                </Text>
                {status.windows.map((window) => (
                  <div
                    key={window.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    <Clock size={14} color={palette.muted} style={{ flexShrink: 0 }} />
                    <Text strong>{window.label}</Text>
                    <Text type="secondary">{formatWindow(window)}</Text>
                  </div>
                ))}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Times shown in {status.timezone} ({DAY_LABELS.join(" ")}).
                </Text>
              </div>
            )}

            <Text type="secondary" style={{ fontSize: 12 }}>
              A platform administrator can change these windows under Settings → Access
              Time Windows.
            </Text>

            <Space>
              <Button icon={<RefreshCw size={14} />} onClick={onRetry}>
                Check again
              </Button>
              <Button
                icon={<LogOut size={14} />}
                href="/admin/login"
                onClick={() => {
                  try {
                    localStorage.removeItem("token");
                    localStorage.removeItem("profile");
                  } catch {
                    /* storage unavailable */
                  }
                }}
              >
                Sign out
              </Button>
            </Space>
          </div>
        }
      />
    </div>
  </div>
);

export default AccessWindowBlock;