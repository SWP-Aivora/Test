import * as signalR from '@microsoft/signalr';

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private messageListeners: Set<(msg: MessageResponse) => void> = new Set();
  private readListeners: Set<(payload: { conversationId: string; readerId: string }) => void> = new Set();
  private errorListeners: Set<(err: string) => void> = new Set();

  /**
   * Initializes the SignalR Connection using the stored JWT Access Token
   */
  public async connect(): Promise<void> {
    if (this.connection) {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        return;
      }
      await this.disconnect();
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('[SignalR] No access token found. Delaying websocket connection...');
      return;
    }

    // Set up the Hub connection pointing to our chat endpoint (dynamic base URL)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const hubUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}/chat` : '/api/v1/chat';

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
        // Uses native transport negotiation
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Reconnect backoff intervals
          if (retryContext.previousRetryCount < 3) return 2000;
          if (retryContext.previousRetryCount < 10) return 5000;
          return 10000;
        }
      })
      .build();

    // Event registrations
    this.connection.on('ReceiveMessage', (message: MessageResponse) => {
      this.messageListeners.forEach((listener) => listener(message));
    });

    this.connection.on('ReadConfirmation', (conversationId: string, readerId: string) => {
      this.readListeners.forEach((listener) => listener({ conversationId, readerId }));
    });

    this.connection.on('Error', (errorMessage: string) => {
      this.errorListeners.forEach((listener) => listener(errorMessage));
    });

    this.connection.onclose((error) => {
      console.error('[SignalR] Real-time connection closed:', error?.message || 'None');
    });

    try {
      await this.connection.start();
      console.log('[SignalR] WebSocket connection established successfully.');
    } catch (err: any) {
      console.error('[SignalR] Failed to connect to Real-time Hub:', err.message);
      // Retry connection after 5 seconds if initial boot fails
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Disconnects the active SignalR websocket
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
      console.log('[SignalR] WebSocket connection terminated.');
    } catch (err: any) {
      console.error('[SignalR] Error disconnecting:', err.message);
    } finally {
      this.connection = null;
    }
  }

  /**
   * Invokes SendMessage on the backend ChatHub
   */
  public async sendMessage(conversationId: string, content: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Real-time chat is currently offline. Please wait for reconnect.');
    }
    await this.connection.invoke('SendMessage', conversationId, content);
  }

  /**
   * Subscription hooks for React components
   */
  public subscribeToMessages(callback: (msg: MessageResponse) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  public subscribeToReadConfirmations(callback: (payload: { conversationId: string; readerId: string }) => void): () => void {
    this.readListeners.add(callback);
    return () => {
      this.readListeners.delete(callback);
    };
  }

  public subscribeToErrors(callback: (err: string) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  public getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }
}

const chatService = new ChatService();
export default chatService;
