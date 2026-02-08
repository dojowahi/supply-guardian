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
    const text = finalStep?.content?.parts?.[0]?.text;

    if (!text) return;

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
    error
  };
}
