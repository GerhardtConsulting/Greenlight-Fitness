import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCoachConversations, supabase } from '../services/supabase';
import CoachChat from '../components/CoachChat';
import {
  MessageCircle, Search, ChevronLeft, Users, Loader2, Mic, X
} from 'lucide-react';

interface Conversation {
  relationshipId: string;
  athleteId: string;
  productId?: string;
  athlete: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
  };
  lastMessage: {
    id: string;
    content?: string;
    message_type: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
  } | null;
  unreadCount: number;
  startedAt: string;
}

const CoachChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // Subscribe to all new messages for badge updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('coach-chat-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          // Refresh conversation list on any new message
          loadConversations();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const data = await getCoachConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAthleteName = (athlete: Conversation['athlete']) => {
    if (!athlete) return 'Unbekannt';
    if (athlete.first_name || athlete.last_name) {
      return `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
    }
    return athlete.display_name || athlete.email?.split('@')[0] || 'Athlet';
  };

  const getInitial = (athlete: Conversation['athlete']) => {
    if (!athlete) return '?';
    return (athlete.first_name || athlete.email || '?').charAt(0).toUpperCase();
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return 'Noch keine Nachrichten';
    if (conv.lastMessage.message_type === 'voice') return '🎤 Sprachnachricht';
    if (conv.lastMessage.message_type === 'system') return '📋 System';
    return conv.lastMessage.content || '';
  };

  const getTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Jetzt';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const name = getAthleteName(c.athlete).toLowerCase();
    const email = (c.athlete?.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    // Optimistically clear unread for this conversation
    setConversations(prev =>
      prev.map(c => c.relationshipId === conv.relationshipId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleBack = () => {
    setActiveConversation(null);
    loadConversations(); // Refresh counts
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Chats laden...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row bg-[#0A0A0A] rounded-2xl overflow-hidden border border-zinc-800">
      {/* === LEFT: Conversation List === */}
      <div
        className={`
          w-full md:w-[340px] lg:w-[380px] md:border-r border-zinc-800 flex flex-col shrink-0 bg-[#111]
          ${activeConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* List Header */}
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle size={20} className="text-[#00FF00]" />
              Nachrichten
              {totalUnread > 0 && (
                <span className="bg-[#00FF00] text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>

          {/* Search */}
          {conversations.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input
                type="text"
                placeholder="Athlet suchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#00FF00]/50 outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Users size={36} className="text-zinc-700 mb-3" />
              {conversations.length === 0 ? (
                <>
                  <p className="text-zinc-500 font-medium text-sm">Keine aktiven Chats</p>
                  <p className="text-zinc-700 text-xs mt-1">Weise zuerst Athleten zu, um zu chatten.</p>
                </>
              ) : (
                <p className="text-zinc-500 text-sm">Kein Ergebnis für "{searchTerm}"</p>
              )}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConversation?.relationshipId === conv.relationshipId;
              const hasUnread = conv.unreadCount > 0;
              const lastTime = conv.lastMessage?.created_at || conv.startedAt;

              return (
                <button
                  key={conv.relationshipId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`
                    w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors border-b border-zinc-800/50
                    ${isActive ? 'bg-[#00FF00]/5 border-l-2 border-l-[#00FF00]' : 'hover:bg-zinc-900/80'}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                      isActive
                        ? 'bg-[#00FF00]/20 text-[#00FF00] border-2 border-[#00FF00]/40'
                        : hasUnread
                        ? 'bg-[#00FF00]/10 text-[#00FF00] border-2 border-[#00FF00]/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {getInitial(conv.athlete)}
                    </div>
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#00FF00] rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-bold text-black">{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${hasUnread ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                        {getAthleteName(conv.athlete)}
                      </span>
                      <span className={`text-[10px] shrink-0 ${hasUnread ? 'text-[#00FF00] font-bold' : 'text-zinc-600'}`}>
                        {getTimeAgo(lastTime)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>
                      {conv.lastMessage?.sender_id === user?.id && (
                        <span className="text-zinc-500">Du: </span>
                      )}
                      {getLastMessagePreview(conv)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* === RIGHT: Chat Panel === */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${!activeConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {activeConversation && user ? (
          <>
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-[#1C1C1E] shrink-0">
              <button
                onClick={handleBack}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#00FF00] text-xs font-bold">{getInitial(activeConversation.athlete)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{getAthleteName(activeConversation.athlete)}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{activeConversation.athlete?.email}</p>
                </div>
              </div>
            </div>

            {/* Chat Component */}
            <div className="flex-1 min-h-0">
              <CoachChat
                key={activeConversation.relationshipId}
                relationshipId={activeConversation.relationshipId}
                partnerId={activeConversation.athleteId}
                partnerName={getAthleteName(activeConversation.athlete)}
                currentUserId={user.id}
                hasAccess={true}
                isFullPage={true}
              />
            </div>
          </>
        ) : (
          /* Empty State (Desktop) */
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <MessageCircle size={36} className="text-zinc-700" />
            </div>
            <h3 className="text-lg font-bold text-zinc-500 mb-1">Wähle eine Konversation</h3>
            <p className="text-sm text-zinc-700 max-w-xs">
              Klicke links auf einen Athleten, um den Chat zu öffnen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachChatPage;
