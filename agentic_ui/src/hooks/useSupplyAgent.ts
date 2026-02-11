import { useState, useEffect, useRef } from 'react';
import { ADKClient } from '../api/adk';
import { BackendClient } from '../api/backend';
import type { AgentMessage, SupplySnapshotData } from '../lib/types';

const USER_ID = 'user_default'; // In a real app, this would come from auth context

export function useSupplyAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [snapshotData, setSnapshotData] = useState<SupplySnapshotData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mapView, setMapView] = useState<{ center: { lat: number; lng: number }; zoom: number } | null>(null);

  const client = ADKClient.getInstance();
  const initialized = useRef(false);

  // Initialize
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Fetch Data Immediately (Independent of Agent)
    console.log('[Hook] Fetching initial snapshot data...');
    fetchSnapshot();

    // 2. Initialize Agent Session (Parallel)
    const initSession = async () => {
      try {
        console.log('[Hook] Initializing Agent Session...');
        const session = await client.createSession(USER_ID);
        setSessionId(session.id);
        console.log('[Hook] Session Created:', session.id);

        // Add initial greeting if not present
        setMessages([{
          id: 'init',
          role: 'agent',
          content: 'I am the **Supply Chain Guardian**. I have analyzed the current network state.',
          timestamp: new Date()
        }]);

      } catch (err) {
        console.error('[Hook] Agent Session Failed:', err);
      }
    };

    initSession();
  }, []);

  const fetchSnapshot = async () => {
    try {
      // Direct backend fetch for speed
      const backendClient = BackendClient.getInstance();
      const freshData = await backendClient.getSnapshot();
      setSnapshotData(freshData);
      console.log('[Hook] Snapshot Updated via Backend:', freshData);
    } catch (e) {
      console.error('[Hook] Snapshot Fetch Failed:', e);
    }
  };

  const processAgentResponse = (adkResponse: any) => {
    if (!Array.isArray(adkResponse) || adkResponse.length === 0) return;

    // The last step typically contains the final answer
    const finalStep = adkResponse[adkResponse.length - 1];
    let text = finalStep?.content?.parts?.[0]?.text;

    if (!text) return;

    // Check for [VIEW: ...] token
    const viewMatch = text.match(/\[VIEW: ({.*?})\]/);
    if (viewMatch) {
      try {
        const viewData = JSON.parse(viewMatch[1]);
        console.log('[Hook] VIEW Token found:', viewData);

        // Remove the token from the display text
        text = text.replace(viewMatch[0], '');

        if (viewData.target_id) {
          // Look up shipment or node in the current snapshot data
          // We need access to the *latest* snapshot data here. 
          // Since snapshotData state might be stale in this closure, we might need to rely on the fetch we just did?
          // Actually, we can just use the state - if it's slightly stale, it might miss a BRAND NEW shipment, 
          // but usually we are viewing existing things. 
          // BETTER: We should probably use a ref for snapshotData if we need it immediately, 
          // or just search in the snapshotData state.

          // NOTE: relying on 'snapshotData' state here.
          const findTarget = (data: SupplySnapshotData | null) => {
            if (!data) return null;

            // 1. Try Shipments
            const shipment = data.shipments.find(s => s.id === viewData.target_id);
            if (shipment?.coordinates) return { center: shipment.coordinates, zoom: 6 };

            // 2. Try Nodes (Ports/Warehouses)
            const node = data.nodes?.find(n => n.id === viewData.target_id);
            if (node?.coordinates) return { center: node.coordinates, zoom: 10 };

            // 3. Try Disruptions
            const disruption = data.disruptions?.find(d => d.id === viewData.target_id);
            if (disruption?.coordinates) return { center: disruption.coordinates, zoom: 7 };

            return null;
          };

          // Use the current state
          setSnapshotData(curr => {
            const result = findTarget(curr);
            if (result) setMapView(result);
            return curr; // Return same state
          });

        } else if (viewData.lat && viewData.lng) {
          setMapView({
            center: { lat: viewData.lat, lng: viewData.lng },
            zoom: viewData.zoom || 5
          });
        }
      } catch (e) {
        console.error('Failed to parse VIEW token:', e);
      }
    }

    // Regular chat response
    addMessage('agent', text);
    // After a chat response, refresh the snapshot immediately to reflect changes
    fetchSnapshot();
  };

  const addMessage = (role: 'user' | 'agent', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;

    addMessage('user', text);
    setIsThinking(true);

    try {
      const response = await client.sendMessage(USER_ID, sessionId, text);
      processAgentResponse(response);
    } catch (err) {
      console.error('[Hook] Send Message Failed:', err);
      addMessage('agent', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsThinking(false);
    }
  };

  return {
    messages,
    isThinking,
    snapshotData,
    sendMessage,
    error,
    mapView
  };
}
