import React, { forwardRef, useImperativeHandle } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Shipment, Disruption, Node } from '../../lib/types';
import { Truck, Ship, Train, Plane, Warehouse, Anchor, ShoppingBag } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface GoogleShipmentMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  shipments?: Shipment[];
  disruptions?: Disruption[];
  nodes?: Node[];
}

export const GoogleShipmentMap: React.FC<GoogleShipmentMapProps> = ({
  center = { lat: 20, lng: 0 },
  zoom = 2,
  shipments = [],
  disruptions = [],
  nodes = []
}) => {
  const [activeMarkerId, setActiveMarkerId] = React.useState<string | null>(null);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-900 border border-red-900/50 text-red-400 p-4 rounded-lg">
        <p>Missing VITE_GOOGLE_MAPS_API_KEY in .env</p>
      </div>
    );
  }

  // Helper to choose icon color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stuck': return { color: '#ef4444' }; // Red
      case 'Delayed': return { color: '#f97316' }; // Orange
      case 'Mitigated': return { color: '#8B4513' }; // Brown
      default: return { color: '#10b981' }; // Green
    }
  };

  const IconWrapper = ({ children, color, onClick }: { children: React.ReactNode, color: string, onClick?: () => void }) => (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-110 drop-shadow-lg"
      style={{ color }}
    >
      {children}
    </div>
  );

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="h-full w-full rounded-lg overflow-hidden border border-zinc-800">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="e8c56e069695d820"
          disableDefaultUI={false}
          gestureHandling={'greedy'}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* NODES (Ports, Warehouses) */}
          {nodes.map((node) => {
            if (!node.coordinates) return null;
            const isPort = node.type === 'Port';
            const isStore = node.type === 'Store';

            const color = isPort ? '#3b82f6' : isStore ? '#ec4899' : '#64748b'; // Blue, Pink, Slate
            const Icon = isPort ? Anchor : isStore ? ShoppingBag : Warehouse;

            return (
              <AdvancedMarker
                key={node.id}
                position={node.coordinates}
                onClick={() => setActiveMarkerId(node.id)}
                zIndex={10}
              >
                <IconWrapper color={color}>
                  <Icon size={24} fill="currentColor" fillOpacity={0.2} />
                </IconWrapper>

                {activeMarkerId === node.id && (
                  <div className="bg-zinc-800 text-zinc-100 p-2 rounded shadow-lg border border-zinc-700 text-xs min-w-[120px] z-50 absolute -translate-x-1/2 left-1/2 mt-2">
                    <p className="font-bold text-zinc-200">{node.name}</p>
                    <p className="text-zinc-400">{node.type}</p>
                    <p className="text-xs text-zinc-500 font-mono">{node.id}</p>
                  </div>
                )}
              </AdvancedMarker>
            );
          })}

          {/* SHIPMENTS */}
          {shipments.map((shipment) => {
            if (!shipment.coordinates) return null;
            const { color } = getStatusColor(shipment.status);

            let Icon = Truck;
            if (shipment.mode === 'Sea') Icon = Ship;
            else if (shipment.mode === 'Rail') Icon = Train;
            else if (shipment.mode === 'Air') Icon = Plane;

            // Resolve Origin Name
            const originNode = nodes.find(n => n.id === shipment.origin_id);
            const originName = originNode ? originNode.name : shipment.origin_id || 'Unknown';
            const formattedValue = shipment.value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(shipment.value) : 'N/A';

            return (
              <AdvancedMarker
                key={shipment.id}
                position={shipment.coordinates}
                onClick={() => setActiveMarkerId(shipment.id)}
                zIndex={20}
              >
                <IconWrapper color={color}>
                  <Icon size={28} fill="currentColor" fillOpacity={0.2} strokeWidth={2} />
                </IconWrapper>

                {activeMarkerId === shipment.id && (
                  <div className="bg-zinc-900/95 backdrop-blur-md text-zinc-100 p-4 rounded-xl shadow-2xl border border-zinc-700/50 text-xs min-w-[200px] z-[100] absolute -translate-x-1/2 left-1/2 mt-3 transform origin-top animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-3 border-b border-zinc-800 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white tracking-tight">{shipment.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}>
                            {shipment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2.5">
                      {/* Route */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-zinc-400">
                          <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                          <span className="text-[11px] uppercase tracking-wide w-8 shrink-0">From</span>
                          <span className="text-zinc-200 font-medium truncate" title={originName}>{originName}</span>
                        </div>
                        <div className="flex items-start gap-2 text-zinc-400">
                          <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                          <span className="text-[11px] uppercase tracking-wide w-8 shrink-0">To</span>
                          <span className="text-zinc-200 font-medium truncate" title={shipment.destination}>
                            {nodes.find(n => n.id === shipment.destination)?.name || shipment.destination}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Value & Mode */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase">Value at Risk</span>
                          <span className="font-mono text-emerald-400 font-bold text-sm">{formattedValue}</span>
                        </div>
                        <div className="text-zinc-500 flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded">
                          <Icon size={12} />
                          <span className="text-[10px]">{shipment.mode || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </AdvancedMarker>
            );
          })}

          {/* DISRUPTIONS */}
          {disruptions.map((disruption) => {
            if (!disruption.coordinates) return null;
            const radius = (disruption.radius_km ? disruption.radius_km * 1000 : 500000); // Default to 500km if not specified

            return (
              <React.Fragment key={disruption.id}>
                <MapCircle
                  center={disruption.coordinates}
                  radius={radius}
                  options={{
                    fillColor: '#ef4444', // Red
                    fillOpacity: 0.2, // Semi-transparent
                    strokeColor: '#b91c1c',
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    clickable: true,
                  }}
                  onClick={() => setActiveMarkerId(disruption.id)}
                />
                <AdvancedMarker
                  position={disruption.coordinates}
                  onClick={() => setActiveMarkerId(disruption.id)}
                  zIndex={30}
                >
                  <div className="w-1 h-1" />
                  {activeMarkerId === disruption.id && (
                    <div className="bg-zinc-800 text-zinc-100 p-2 rounded shadow-lg border border-zinc-700 text-xs max-w-[200px] z-50 absolute -translate-x-1/2 left-1/2 mt-2">
                      <p className="font-bold text-red-400">Disruption: {disruption.type}</p>
                      <p>{disruption.description}</p>
                      <p className="text-zinc-500 mt-1">Impact Radius: {(radius / 1000).toFixed(0)}km</p>
                    </div>
                  )}
                </AdvancedMarker>
              </React.Fragment>
            );
          })}
        </Map>
      </div>
    </APIProvider>
  );
};

// Helper component to render a Google Maps Circle
const MapCircle = ({ center, radius, options, onClick }: { center: google.maps.LatLngLiteral, radius: number, options?: google.maps.CircleOptions, onClick?: () => void }) => {
  const map = useMap();
  const circleRef = React.useRef<google.maps.Circle | null>(null);

  React.useEffect(() => {
    if (!map) return;

    circleRef.current = new google.maps.Circle({
      ...options,
      center,
      radius,
      map,
    });

    if (onClick) {
      circleRef.current.addListener('click', onClick);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius, options, onClick]);

  return null;
};
