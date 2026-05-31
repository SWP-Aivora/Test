import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ClientLayout, ExpertLayout, AdminLayout } from '../components/PortalLayout';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import type { MessageResponse } from '../services/chatService';
import { Send, User, MessageSquare, Bot, Loader } from 'lucide-react';
import api from '../services/api';
import { getDateString } from '../utils/formatters';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatarUrl?: string;
  lastMessageContent?: string;
  lastMessageCreatedAt?: string;
  unreadCount: number;
  linkedJobId?: string;
  linkedJobTitle?: string;
  linkedProjectId?: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const routeState = location.state as { activeConversationId?: string } | null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [websocketState, setWebsocketState] = useState<string>('Connecting');
  const [typing] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const updateWebsocketLabel = () => {
    const state = chatService.getConnectionState();
    setWebsocketState(state.toString());
  };

  const fetchConversations = async (autoSelectId?: string) => {
    try {
      const response = await api.get('/conversations');
      const items = response.data?.items || [];
      setConversations(items);
      updateWebsocketLabel();

      const targetId = autoSelectId || routeState?.activeConversationId;
      if (targetId) {
        const found = items.find((c: any) => c.id === targetId);
        if (found) handleSelectConversation(found);
      } else if (items.length > 0 && !activeChat) {
        handleSelectConversation(items[0]);
      }
    } catch {
      const mockChats: Conversation[] = [{
        id: 'conv-1',
        participantId: user?.role === 'CLIENT' ? 'exp-alice' : 'cl-google',
        participantName: user?.role === 'CLIENT' ? 'Alice Design (Expert)' : 'Google DevTeam (Client)',
        lastMessageContent: 'Hello! I completed coding the central CSS components.',
        lastMessageCreatedAt: new Date().toISOString(),
        unreadCount: 1,
        linkedJobId: 'mock-j1',
        linkedJobTitle: 'Build AI Product UI/UX Interface Redesign',
        linkedProjectId: 'mock-p1',
      }];
      setConversations(mockChats);
      if (!activeChat) handleSelectConversation(mockChats[0]);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => { fetchConversations(); }, [user]);

  useEffect(() => {
    const unsubscribeMsg = chatService.subscribeToMessages((message) => {
      if (activeChat && message.conversationId === activeChat.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        api.post(`/conversations/${activeChat.id}/read`).catch(() => {});
      } else {
        fetchConversations();
      }
    });

    const unsubscribeRead = chatService.subscribeToReadConfirmations((payload) => {
      if (activeChat && payload.conversationId === activeChat.id) {
        setMessages(prev => prev.map(m => m.senderId !== payload.readerId ? { ...m, isRead: true } : m));
      }
    });

    const stateInterval = setInterval(updateWebsocketLabel, 3000);
    return () => { unsubscribeMsg(); unsubscribeRead(); clearInterval(stateInterval); };
  }, [activeChat]);

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveChat(conv);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const response = await api.get(`/conversations/${conv.id}/messages`, { params: { pageSize: 40 } });
      const items = response.data?.items || [];
      setMessages(items.reverse());
      scrollToBottom();
      await api.post(`/conversations/${conv.id}/read`);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    } catch {
      setMessages([
        {
          id: 'm1', conversationId: conv.id,
          senderId: user?.role === 'CLIENT' ? 'exp-alice' : 'cl-google',
          senderName: user?.role === 'CLIENT' ? 'Alice Design' : 'Google DevTeam',
          content: 'Hello! Welcome to the Aivora work chat room. I have reviewed the design guidelines.',
          isRead: true, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'm2', conversationId: conv.id,
          senderId: user?.id || 'cl-google',
          senderName: user?.fullName || 'Google DevTeam',
          content: 'Awesome Alice! That is extremely fast. Please share the prototypes links.',
          isRead: true, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'm3', conversationId: conv.id,
          senderId: user?.role === 'CLIENT' ? 'exp-alice' : 'cl-google',
          senderName: user?.role === 'CLIENT' ? 'Alice Design' : 'Google DevTeam',
          content: 'Hello! I completed coding the central CSS components. Please check the pull request.',
          isRead: false, createdAt: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || !activeChat) return;
    setSending(true);
    try {
      await chatService.sendMessage(activeChat.id, inputText);
      const tempMsg: MessageResponse = {
        id: Math.random().toString(), conversationId: activeChat.id,
        senderId: user?.id || '', senderName: user?.fullName || 'Me',
        content: inputText, isRead: false, createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMsg]);
      setInputText('');
      scrollToBottom();
      setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessageContent: inputText, lastMessageCreatedAt: tempMsg.createdAt } : c));
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: MessageResponse[] }[]>((acc, msg) => {
    const dateStr = getDateString(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.date === dateStr) {
      last.messages.push(msg);
    } else {
      acc.push({ date: dateStr, messages: [msg] });
    }
    return acc;
  }, []);

  const renderChatBody = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', height: 'calc(100vh - 200px)' }}>
      {/* Sidebar: conversation list */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700 }}>Ongoing Chats</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: websocketState === 'Connected' ? 'var(--success)' : 'var(--danger)',
              boxShadow: websocketState === 'Connected' ? '0 0 6px var(--success)' : 'none',
            }} />
            {websocketState === 'Connected' ? 'Live websocket' : 'Offline'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {loadingChats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ width: '30px', height: '30px' }} />
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={24} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.8rem' }}>No conversations yet.</p>
            </div>
          ) : (
            conversations.map(c => {
              const active = activeChat?.id === c.id;
              return (
                <div key={c.id} onClick={() => handleSelectConversation(c)} style={{
                  padding: '1.2rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: active ? 'hsla(250,89%,65%,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent)' : 'none',
                  transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: active ? 'var(--accent-glow)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <User size={16} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {c.participantName}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>{c.unreadCount}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: active ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {c.lastMessageContent || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: message stream */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', background: 'hsla(222,47%,4%,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{activeChat.participantName}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)' }} /> Active Workspace Hub
                  </span>
                </div>
                {activeChat.linkedJobId && (
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', alignSelf: 'flex-end' }}>Linked Job Campaign</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{activeChat.linkedJobTitle}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px' }} />
                </div>
              ) : (
                <>
                  {groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      <div className="chat-date-separator">{group.date}</div>
                      {group.messages.map(m => {
                        const isMe = m.senderId === user?.id;
                        return (
                          <div key={m.id} className={`chat-bubble ${isMe ? 'sent' : 'received'}`}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem', opacity: 0.8 }}>
                              {isMe ? 'You' : m.senderName}
                            </div>
                            <div>{m.content}</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.6, textAlign: 'right', marginTop: '0.25rem' }}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {typing && (
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', background: 'hsla(222,47%,4%,0.2)' }}>
              <input type="text" placeholder="Type your message..." className="input-field"
                value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={sending} required />
              <button type="submit" disabled={sending || !inputText} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', flexShrink: 0 }}>
                {sending ? <Loader size={16} className="spinner" /> : <Send size={16} />}
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <Bot size={54} color="var(--accent)" style={{ marginBottom: '1.5rem', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Aivora Smart Messaging</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '380px', lineHeight: 1.5 }}>
              Select an active contract partner from the left menu to establish websocket connections.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (user?.role === 'CLIENT') return <ClientLayout>{renderChatBody()}</ClientLayout>;
  if (user?.role === 'EXPERT') return <ExpertLayout>{renderChatBody()}</ExpertLayout>;
  if (user?.role === 'ADMIN') return <AdminLayout>{renderChatBody()}</AdminLayout>;
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );
};

export default ChatPage;
