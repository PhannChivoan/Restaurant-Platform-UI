import { useEffect, useState } from "react";
import { AutoComplete, Button, Modal, Space, Typography, message } from "antd";
import L from "leaflet";
import { MapPin, LocateFixed } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DEFAULT_CENTER, getCurrentPosition, reversePlace, searchPlaces } from "../../landing/api/geo";
import { palette } from "../../constants/theme";

const { Text } = Typography;

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;background:${palette.primary};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>`,
  iconSize: [26, 26],
  iconAnchor: [4, 26],
});

const Recenter = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 16));
  }, [pos.lat, pos.lng, map]);
  return null;
};

const ClickToPin = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

// Pick a branch location by clicking the map (or searching / using the current location),
// instead of typing latitude and longitude.
export const MapPickerModal = ({ open, initial, onCancel, onOk }) => {
  const [pos, setPos] = useState(initial ?? DEFAULT_CENTER);
  const [pinned, setPinned] = useState(Boolean(initial));
  const [place, setPlace] = useState({ address: "", city: "", postal_code: "" });
  const [options, setOptions] = useState([]);
  const [text, setText] = useState("");

  const pick = async (lat, lng, p) => {
    setPos({ lat, lng });
    setPinned(true);
    if (p) return setPlace({ address: p.label, city: p.city, postal_code: p.postal_code });
    try {
      const r = await reversePlace(lat, lng);
      setPlace({ address: r.label, city: r.city, postal_code: r.postal_code });
    } catch {
      /* the form's own address fields can be filled by hand */
    }
  };

  const search = async (q) => {
    setText(q);
    if (q.trim().length < 3) return setOptions([]);
    try {
      const rows = await searchPlaces(q.trim());
      setOptions(rows.map((r) => ({ value: r.label, label: r.label, row: r })));
    } catch {
      setOptions([]);
    }
  };

  const mine = async () => {
    try {
      const p = await getCurrentPosition();
      pick(p.lat, p.lng);
    } catch (e) {
      message.warning(e.message);
    }
  };

  return (
    <Modal
      open={open}
      title="Pick the branch location"
      onCancel={onCancel}
      okText="Use this location"
      okButtonProps={{ disabled: !pinned }}
      onOk={() => onOk({ lat: pos.lat, lng: pos.lng, ...place })}
      width={680}
      centered
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <Space.Compact style={{ width: "100%" }}>
          <AutoComplete
            style={{ width: "100%" }}
            value={text}
            options={options}
            onSearch={search}
            onChange={setText}
            onSelect={(_, opt) => {
              pick(opt.row.lat, opt.row.lng, opt.row);
              setText(opt.row.label);
            }}
            placeholder="Search a street, building or area…"
          />
          <Button icon={<LocateFixed size={14} />} onClick={mine}>
            My location
          </Button>
        </Space.Compact>
        <div style={{ height: 340, border: `1px solid ${palette.border}` }}>
          <MapContainer center={[pos.lat, pos.lng]} zoom={pinned ? 16 : 12} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickToPin onPick={pick} />
            <Recenter pos={pos} />
            {pinned && (
              <Marker
                position={[pos.lat, pos.lng]}
                icon={pin}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = e.target.getLatLng();
                    pick(ll.lat, ll.lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
        <Text type="secondary">Click the map or drag the pin to place the branch exactly. {place.address && <b>{place.address}</b>}</Text>
      </Space>
    </Modal>
  );
};

// Form.Item child: value = { lat, lng }. Shows the chosen spot and opens the map picker.
// onPlace(place) lets the form fill its address / city fields from the picked spot.
const MapLocationField = ({ value, onChange, onPlace }) => {
  const [open, setOpen] = useState(false);
  const set = value?.lat != null && value?.lng != null;

  return (
    <>
      <Space>
        <Button icon={<MapPin size={14} />} onClick={() => setOpen(true)} type={set ? "default" : "primary"}>
          {set ? "Change location on map" : "Pick location on map"}
        </Button>
        <Text type={set ? undefined : "secondary"}>{set ? `Pinned at ${Number(value.lat).toFixed(5)}, ${Number(value.lng).toFixed(5)}` : "No location yet"}</Text>
      </Space>
      <MapPickerModal
        open={open}
        initial={set ? { lat: Number(value.lat), lng: Number(value.lng) } : null}
        onCancel={() => setOpen(false)}
        onOk={(p) => {
          onChange?.({ lat: p.lat, lng: p.lng });
          onPlace?.(p);
          setOpen(false);
        }}
      />
    </>
  );
};

export default MapLocationField;