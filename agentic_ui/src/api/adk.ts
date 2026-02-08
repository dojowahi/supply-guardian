import type { ADKSessionResponse, ADKAgentRequest } from '../lib/types';

const BASE_URL = '/api';
const APP_NAME = 'supply_agent';

export class ADKClient {
  private static instance: ADKClient;

  private constructor() { }

  public static getInstance(): ADKClient {
    if (!ADKClient.instance) {
      ADKClient.instance = new ADKClient();
    }
    return ADKClient.instance;
  }

  async createSession(userId: string): Promise<ADKSessionResponse> {
    const url = `${BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions`;
    console.log(`[ADK] Creating session: ${url}`);

    // We send an empty state to start
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: {} }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create session: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async sendMessage(userId: string, sessionId: string, text: string): Promise<any> {
    const url = `${BASE_URL}/run`;
    console.log(`[ADK] Sending message to ${url}`);

    const payload: ADKAgentRequest = {
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: {
        role: 'user',
        parts: [{ text }],
      },
      streaming: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to send message: ${response.status} - ${text}`);
    }

    return response.json();
  }
}
