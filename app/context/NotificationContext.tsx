'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'SENTINEL';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: Notification = {
      ...notif,
      id,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    
    // Auto-remove toast after 2 seconds as requested by the user
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, 2000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, unreadCount }}>
      {children}
      
      {/* Real-Time Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.filter(n => !n.isRead).slice(0, 3).map((n) => (
          <NotificationToast key={n.id} notification={n} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function NotificationToast({ notification }: { notification: Notification }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />;
      case 'ERROR': return <AlertTriangle className="w-5 h-5" style={{ color: '#f43f5e' }} />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />;
      case 'SENTINEL': return <Shield className="w-5 h-5" style={{ color: '#3b82f6' }} />;
      default: return <Info className="w-5 h-5" style={{ color: '#64748b' }} />;
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#1e293b', 
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        borderStyle: 'solid'
      }} 
      className="pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-4 min-w-[320px] animate-in slide-in-from-right duration-300"
    >
      <div 
        style={{ 
          backgroundColor: '#f8fafc', 
          borderColor: '#f1f5f9',
          borderWidth: '1px',
          borderStyle: 'solid'
        }} 
        className="p-2 rounded-xl shrink-0"
      >
        {getIcon()}
      </div>
      <div className="flex-1">
        <h4 style={{ color: '#0f172a' }} className="text-sm font-bold mb-1">{notification.title}</h4>
        <p style={{ color: '#475569' }} className="text-xs font-bold leading-relaxed">{notification.message}</p>
      </div>
    </div>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
