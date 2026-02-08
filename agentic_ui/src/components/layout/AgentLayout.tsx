import React from 'react';
import { ChatPane } from '../chat/ChatPane';
import { SnapshotRenderer } from '../snapshot/SnapshotRenderer';
import { useSupplyAgent } from '../../hooks/useSupplyAgent';

export const AgentLayout: React.FC = () => {
  const { messages, sendMessage, snapshotData, isThinking } = useSupplyAgent();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Main Content Area (3/4) */}
      <div className="w-[75%] h-full border-r border-gray-200 relative">
        <SnapshotRenderer data={snapshotData} />
      </div>

      {/* Agent Sidebar (1/4) */}
      <div className="w-[25%] h-full bg-white border-l border-slate-200">
        <ChatPane
          messages={messages}
          onSendMessage={sendMessage}
          isThinking={isThinking}
        />
      </div>
    </div>
  );
};
