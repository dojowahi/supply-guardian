import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Node, Shipment, Disruption } from '@/types';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet Default Icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  nodes: Node[];
  shipments: Shipment[];
  disruptions: Disruption[];
}

const getShipmentIcon = (mode: string, status: string) => {
  const color = status === 'Stuck' ? '#cc0000' : status === 'Delayed' ? '#eab308' : '#22c55e';

  // Simplified SVG for brevity, using circles/shapes
  let iconHtml = '';
  const svgAttr = `width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"`;

  if (mode === 'Air') {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr} style="transform: rotate(45deg);"><path d="M2 12h20"/><path d="M13 12l2-7"/><path d="M13 12l2 7"/><path d="M5 12l-2-3"/><path d="M5 12l-2 3"/></svg>`;
  } else if (mode === 'Truck') {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr}><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><path d="M15 17h1"/><path d="M9 17H5"/><circle cx="15" cy="17" r="2"/><circle cx="7" cy="17" r="2"/></svg>`;
  } else if (mode === 'Rail') {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr}><rect width="16" height="12" x="4" y="3" rx="2"/><path d="M6 3v20"/><path d="M18 3v20"/><path d="M8 15h8"/><path d="M4 20h16"/></svg>`;
  } else {
    // Sea/Default
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr}><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.8 2.38 8"/><path d="M12 10V4"/></svg>`;
  }

  return L.divIcon({
    className: 'shipment-icon',
    html: `<div style="background-color: rgba(0,0,0,0.8); width: 22px; height: 22px; border-radius: 50%; border: 1px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px ${color};">${iconHtml}</div>`,
    iconSize: [22, 22]
  });
};

const getNodeIcon = (type: string) => {
  let color = '#ffffff';
  let iconHtml = '';
  const svgAttr = `width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"`;

  if (type === 'Port') {
    color = '#06b6d4';
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr} stroke="${color}"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`;
  } else if (type === 'Warehouse') {
    color = '#a855f7';
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr} stroke="${color}"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
  } else {
    color = '#3b82f6';
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttr} stroke="${color}"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }

  return L.divIcon({
    className: 'node-icon',
    html: `<div style="background-color: rgba(23,23,23,0.8); width: 24px; height: 24px; border-radius: 50%; border: 1px solid ${color}; display: flex; align-items: center; justify-content: center;">${iconHtml}</div>`,
    iconSize: [24, 24]
  });
}

export function LeafletMap({ nodes, shipments, disruptions }: LeafletMapProps) {
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: '#171717' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Disruptions */}
      {disruptions.map((d, i) => (
        <Circle
          key={d.id || `disruption-${i}`}
          center={[d.location.lat, d.location.lon]}
          radius={d.radius_km * 1000}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }}
        >
          <Popup>
            <div className="text-gray-900 min-w-[150px]">
              <strong className="text-red-600 uppercase text-xs tracking-wider">{d.type}</strong>
              <div className="font-bold text-sm mt-1">{d.description || 'Unknown Disruption'}</div>
              <div className="text-xs text-gray-500 mt-1">Radius: {d.radius_km}km</div>
              <div className="text-xs text-gray-500">Affects: {d.affected_modes.join(', ')}</div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Nodes */}
      {nodes.map(node => (
        <Marker
          key={node.id}
          position={[node.location.lat, node.location.lon]}
          icon={getNodeIcon(node.type)}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-gray-900">
              <strong>{node.name}</strong><br />
              {node.type}<br />
              Tier: {node.capacity_tier}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Shipments */}
      {shipments.map(s => {
        const destNode = nodes.find(n => n.id === s.destination_id);
        const valueFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(s.total_value_at_risk || 0);

        return (
          <Marker
            key={s.id}
            position={[s.current_location.lat, s.current_location.lon]}
            icon={getShipmentIcon(s.transport_mode, s.status)}
          >
            <Popup>
              <div className="text-gray-900 min-w-[180px]">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
                  <strong className="text-sm">{s.id}</strong>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${s.status === 'Stuck' ? 'bg-red-500' : s.status === 'Delayed' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>{s.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <span className="text-gray-500">Mode:</span>
                  <span className="font-medium">{s.transport_mode}</span>

                  <span className="text-gray-500">Value:</span>
                  <span className="font-medium text-green-700">{valueFormatted}</span>

                  <span className="text-gray-500">To:</span>
                  <span className="font-medium truncate">{destNode?.name || s.destination_id}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
