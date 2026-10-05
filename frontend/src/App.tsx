import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChatSession, ChatMessage, UserRole } from './types';
import {
  fetchChats,
  fetchChatMessages,
  sendCSMessage,
  fetchDashboardAnalytics,
} from './services/api';
import { useTheme } from './hooks/useTheme';
import { useSocket } from './hooks/useSocket';
import { useAutoSimulation } from './hooks/useAutoSimulation';
import { Header } from './components/Header';
import { InboxList } from './components/InboxList';
import { ChatWorkspace } from './components/ChatWorkspace';
import { CustomerProfile } from './components/CustomerProfile';
import { Dashboard } from './components/Dashboard';
import { SimulationLab } from './components/SimulationLab';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('cs');
  const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard' | 'simulation'>('inbox');

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Analytics Dashboard state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Filters & sorting for inbox
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'urgency'>('recent');

  // Responsive mobile/tablet navigation
  const [mobileView, setMobileView] = useState<'inbox' | 'chat' | 'profile'>('inbox');
  const [showTabletProfile, setShowTabletProfile] = useState(false);

  // Custom hooks
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAutoSimulating, autoSimLogs, toggleAutoSim, clearLogs } = useAutoSimulation();

  // Switch role handler: auto-switch to Dashboard when role = Manager
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'manager') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('inbox');
    }
  };

  // 1. Load chats from API
  const loadChats = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchChats({
        platform: selectedPlatform,
        search: searchQuery,
      });
      setSessions(data);

      // Auto-select first chat on initial desktop load if none selected
      if (!selectedSessionId && data.length > 0 && window.innerWidth >= 1024) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedPlatform, searchQuery, selectedSessionId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 2. Load dashboard analytics
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await fetchDashboardAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics dashboard:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // 3. Load messages when selected session changes
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    setLoadingMessages(true);

    fetchChatMessages(selectedSessionId)
      .then((res) => {
        if (isSubscribed) {
          setMessages(res.messages);

          // Mark unread as 0 locally in sessions list
          setSessions((prev) =>
            prev.map((s) => (s.id === selectedSessionId ? { ...s, unread_count: 0 } : s))
          );
        }
      })
      .catch((err) => console.error('Error fetching chat messages:', err))
      .finally(() => {
        if (isSubscribed) setLoadingMessages(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedSessionId]);

  // 4. Socket.io Real-time event listeners (extracted to hook)
  const { isSocketConnected } = useSocket({
    selectedSessionId,
    loadChats,
    loadAnalytics,
    setMessages,
    setSessions,
  });

  // Handle select session from Inbox list
  const handleSelectSession = (session: ChatSession) => {
    setSelectedSessionId(session.id);
    setMobileView('chat');

    // Optimistically set unread to 0
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, unread_count: 0 } : s))
    );
  };

  // Handle send message from CS
  const handleSendMessage = async (text: string) => {
    if (!selectedSessionId) return;
    const res = await sendCSMessage(selectedSessionId, text);

    // Append to messages list
    setMessages((prev) => [...prev, res.message]);

    // Update in sessions list
    setSessions((prev) => {
      const target = prev.find((s) => s.id === selectedSessionId);
      if (!target) return prev;
      const updated = {
        ...target,
        last_message: text,
        last_message_at: res.message.created_at,
        unread_count: 0,
      };
      return [updated, ...prev.filter((s) => s.id !== selectedSessionId)];
    });

    // Refresh analytics
    loadAnalytics();
  };

  // Filtered and sorted sessions
  const displayedSessions = useMemo(() => {
    const list = [...sessions];
    if (sortBy === 'urgency') {
      const urgencyRank: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
      list.sort((a, b) => (urgencyRank[b.urgency] || 0) - (urgencyRank[a.urgency] || 0));
    } else {
      list.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    }
    return list;
  }, [sessions, sortBy]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const totalUnread = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.unread_count || 0), 0);
  }, [sessions]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-900 dark:selection:text-emerald-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        unreadTotal={totalUnread}
        isSocketConnected={isSocketConnected}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Role Notice Banner if Manager */}
      {currentRole === 'manager' && (
        <div className="bg-indigo-950 dark:bg-indigo-950/90 text-indigo-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-indigo-900 dark:border-indigo-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>
            Mode Store Manager aktif: Memantau analitik omzet omnichannel, kesehatan stok real-time, dan respon CS Rancaekek Supply Co.
          </span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6 flex flex-col">
        {activeTab === 'inbox' ? (
          /* THREE-COLUMN UNIFIED CHAT LAYOUT */
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex h-[calc(100vh-8.5rem)] min-h-[580px]">
            {/* COLUMN 1: LEFT (Inbox List) */}
            <div
              className={`w-full md:w-[320px] lg:w-[360px] h-full shrink-0 ${
                mobileView === 'inbox' ? 'block' : 'hidden md:block'
              }`}
            >
              <InboxList
                sessions={displayedSessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={handleSelectSession}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                sortBy={sortBy}
                onSortChange={setSortBy}
                loading={loadingSessions}
                onRefresh={loadChats}
              />
            </div>

            {/* COLUMN 2: CENTER (Chat Workspace) */}
            <div
              className={`flex-1 h-full min-w-0 ${
                mobileView === 'chat'
                  ? 'block'
                  : mobileView === 'profile'
                  ? 'hidden lg:block'
                  : 'hidden md:block'
              }`}
            >
              <ChatWorkspace
                session={activeSession}
                messages={messages}
                loadingMessages={loadingMessages}
                onSendMessage={handleSendMessage}
                onBackToList={() => setMobileView('inbox')}
                onToggleProfile={() => {
                  if (window.innerWidth < 1024) {
                    setMobileView(mobileView === 'profile' ? 'chat' : 'profile');
                  } else {
                    setShowTabletProfile(!showTabletProfile);
                  }
                }}
                showProfileToggle={true}
              />
            </div>

            {/* COLUMN 3: RIGHT (Customer Profile & Create Order Modal) */}
            <div
              className={`w-full lg:w-[320px] xl:w-[350px] h-full shrink-0 ${
                mobileView === 'profile'
                  ? 'block'
                  : showTabletProfile
                  ? 'block'
                  : 'hidden lg:block'
              }`}
            >
              <div className="h-full relative">
                {/* Mobile Back to Chat Button */}
                <div className="lg:hidden p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700">Profil Pelanggan</span>
                  <button
                    onClick={() => setMobileView('chat')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Kembali ke Chat
                  </button>
                </div>
                <CustomerProfile
                  session={activeSession}
                  onOrderCreated={() => {
                    if (selectedSessionId) {
                      fetchChatMessages(selectedSessionId)
                        .then((res) => setMessages(res.messages))
                        .catch((err) => console.error(err));
                    }
                    loadAnalytics();
                  }}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          /* DASHBOARD MANAGER */
          <Dashboard
            analyticsData={analyticsData}
            loading={loadingAnalytics}
            onRefresh={loadAnalytics}
          />
        ) : (
          /* SIMULATION LAB */
          <SimulationLab
            onRefreshAll={() => {
              loadChats();
              loadAnalytics();
            }}
            isAutoSimulating={isAutoSimulating}
            onToggleAutoSim={toggleAutoSim}
            autoSimLogs={autoSimLogs}
            onClearLogs={clearLogs}
          />
        )}
      </main>
    </div>
  );
}
