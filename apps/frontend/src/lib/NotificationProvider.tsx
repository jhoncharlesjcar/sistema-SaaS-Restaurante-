import { createContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification: Notification = {
            id,
            duration: 5000,
            ...notification,
        };

        setNotifications((prev) => [...prev, newNotification]);

        // Auto-dismiss after duration
        if (newNotification.duration) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }
    }, [removeNotification]);

    const success = useCallback((message: string, title?: string) => {
        addNotification({ type: 'success', message, title });
    }, [addNotification]);

    const error = useCallback((message: string, title?: string) => {
        addNotification({ type: 'error', message, title, duration: 7000 });
    }, [addNotification]);

    const warning = useCallback((message: string, title?: string) => {
        addNotification({ type: 'warning', message, title, duration: 6000 });
    }, [addNotification]);

    const info = useCallback((message: string, title?: string) => {
        addNotification({ type: 'info', message, title });
    }, [addNotification]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                removeNotification,
                success,
                error,
                warning,
                info,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
