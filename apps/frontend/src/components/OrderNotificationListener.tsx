import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../features/auth/AuthProvider";
import { toast } from "sonner";

export function OrderNotificationListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.restaurant_id) return;

    console.log("🔔 Subscribing to Supabase Realtime Notifications...");

    const channel = supabase
      .channel("waiter_notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${user.restaurant_id}`,
        },
        (payload: any) => {
          const order = payload.new;
          console.log("🔔 Order Status Update Received:", order);

          // Check if order is ready (ready) and if this user is the creator (user_id)
          if (order.status === "ready" && order.user_id === user.id) {
            console.log("🎯 Notifying waiter about ready order");

            // Play notification sound
            try {
              const audio = new Audio("/notification.mp3");
              audio.play().catch((e) => console.log("Audio play error", e));
            } catch (e) {
              console.error("Notification sound error:", e);
            }

            // Show Toast - Extracted from metadata or ID
            const orderNum = order.id.slice(-4).toUpperCase();
            toast.success("📢 ¡Pedido listo!", {
              description: `La orden #${orderNum} está lista para ser entregada.`,
              duration: 10000,
              action: {
                label: "Ir a Pedido",
                onClick: () => console.log("View order", order.id),
              },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.restaurant_id, user?.id]);

  return null;
}
