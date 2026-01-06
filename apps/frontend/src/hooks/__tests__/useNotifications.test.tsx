import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { NotificationProvider } from '../../lib/NotificationProvider';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>{ children } </NotificationProvider>
);

describe('useNotifications', () => {
    it('should throw error when used outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        expect(() => {
            renderHook(() => useNotifications());
        }).toThrow('useNotifications must be used within a NotificationProvider');

        consoleSpy.mockRestore();
    });

    it('should add and remove notifications', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        expect(result.current.notifications).toHaveLength(0);

        result.current.success('Test success message');

        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('success');
            expect(result.current.notifications[0].message).toBe('Test success message');
        });
    });

    it('should auto-dismiss notifications after duration', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        result.current.addNotification({
            type: 'info',
            message: 'Auto dismiss test',
            duration: 100,
        });

        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(1);
        });

        // Wait for auto-dismiss
        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(0);
        }, { timeout: 200 });
    });

    it('should support different notification types', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        result.current.success('Success');
        result.current.error('Error');
        result.current.warning('Warning');
        result.current.info('Info');

        await waitFor(() => {
            expect(result.current.notifications).toHaveLength(4);
            expect(result.current.notifications.map(n => n.type)).toEqual([
                'success',
                'error',
                'warning',
                'info',
            ]);
        });
    });
});
