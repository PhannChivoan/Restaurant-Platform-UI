import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Input, Modal, Space, Spin, Typography, message } from "antd";
import { ShieldCheck } from "lucide-react";

import { request } from "../../utils/request";

const { Text, Paragraph } = Typography;

/*
 * Account security: switch two-factor sign-in (authenticator app) on or off for the signed-in user.
 * Set-up shows the secret key to type into Google Authenticator / Microsoft Authenticator / Authy,
 * then asks for one code to prove it works before turning it on.
 */
const SecurityModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState(null); // { secret, uri } while enabling
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await request("auth/2fa", "GET", undefined, { fresh: true });
    setEnabled(Boolean(res?.enabled));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    // deferred so the state updates are not made inside the effect body
    const t = setTimeout(() => {
      setSetup(null);
      setCode("");
      setPassword("");
      setError("");
      refresh();
    }, 0);
    return () => clearTimeout(t);
  }, [open, refresh]);

  const start = async () => {
    setError("");
    const res = await request("auth/2fa/setup", "POST");
    if (res?.secret) setSetup(res);
    else setError(res?.message || "Could not start the set-up.");
  };

  const confirm = async () => {
    setError("");
    const res = await request("auth/2fa/enable", "POST", { code });
    if (res?.enabled) {
      message.success(res.message);
      setSetup(null);
      setCode("");
      setEnabled(true);
    } else {
      setError(res?.message || "That code is not correct.");
    }
  };

  const turnOff = async () => {
    setError("");
    const res = await request("auth/2fa/disable", "POST", { password, code });
    if (res?.enabled === false) {
      message.success(res.message);
      setPassword("");
      setCode("");
      setEnabled(false);
    } else {
      setError(res?.errors ? Object.values(res.errors)[0]?.[0] : res?.message || "Could not turn it off.");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      title={
        <Space>
          <ShieldCheck size={18} />
          Account security
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <Space orientation="vertical" size={14} style={{ width: "100%" }}>
          <div>
            <Text strong>Two-factor sign-in</Text>{" "}
            <Text type={enabled ? "success" : "secondary"}>{enabled ? "· On" : "· Off"}</Text>
            <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
              After your password, sign-in asks for a 6-digit code from an authenticator app. A stolen password alone is no longer enough.
            </Paragraph>
          </div>

          {error && <Alert type="error" showIcon title={error} />}

          {!enabled && !setup && (
            <Button type="primary" onClick={start}>
              Set up two-factor sign-in
            </Button>
          )}

          {!enabled && setup && (
            <Space orientation="vertical" size={10} style={{ width: "100%" }}>
              <Paragraph style={{ margin: 0 }}>
                1. In your authenticator app choose <b>Add account → Enter a setup key</b> and type this key:
              </Paragraph>
              <Input readOnly value={setup.secret} style={{ fontFamily: "monospace", letterSpacing: 2 }} onFocus={(e) => e.target.select()} />
              <Text type="secondary">
                On the phone with the app you can also <a href={setup.uri}>open this link</a> to add it directly.
              </Text>
              <Paragraph style={{ margin: 0 }}>2. Type the 6-digit code the app shows now:</Paragraph>
              <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" placeholder="123456" />
              <Button type="primary" disabled={code.trim().length !== 6} onClick={confirm}>
                Turn on
              </Button>
            </Space>
          )}

          {enabled && (
            <Space orientation="vertical" size={10} style={{ width: "100%" }}>
              <Text type="secondary">To turn it off, confirm your password and a current code.</Text>
              <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" placeholder="6-digit code" />
              <Button danger disabled={!password || code.trim().length !== 6} onClick={turnOff}>
                Turn off two-factor sign-in
              </Button>
            </Space>
          )}
        </Space>
      )}
    </Modal>
  );
};

export default SecurityModal;
