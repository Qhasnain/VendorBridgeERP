import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearItem: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, apiFetch, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll every 30 seconds for live notifications updates
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

  const markRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const clearItem = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
        clearItem,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
