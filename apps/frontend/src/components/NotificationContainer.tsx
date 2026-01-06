import { useNotifications } from '../hooks/useNotifications';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
};

export function NotificationContainer() {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {notifications.map((notification) => {
                const Icon = iconMap[notification.type];
                const colorClass = colorMap[notification.type];
                const iconColorClass = iconColorMap[notification.type];

                return (
                    <div
                        key={notification.id}
                        className={`${colorClass} border rounded-lg p-4 shadow-lg animate-slide-in-right flex items-start gap-3`}
                    >
                        <Icon className={`${iconColorClass} w-5 h-5 flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                            {notification.title && (
                                <h4 className="font-semibold text-sm mb-1">
                                    {notification.title}
                                </h4>
                            )}
                            <p className="text-sm">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 hover:opacity-70 transition-opacity"
                            aria-label="Cerrar notificación"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
