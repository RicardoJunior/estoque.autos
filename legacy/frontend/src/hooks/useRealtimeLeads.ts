import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/organisms/ToastContainer';
import type { Lead } from '../types';

interface RealtimeLeadPayload {
  new: Lead;
  old: Lead | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useRealtimeLeads(onNewLead?: (lead: Lead) => void) {
  const { user, tenant } = useAuthStore();
  const { addToast } = useToast();

  const handleRealtimeEvent = useCallback(
    (payload: RealtimeLeadPayload) => {
      if (payload.eventType === 'INSERT') {
        const newLead = payload.new;

        // Show notification for new leads
        // If user is a seller, only show notification if lead is assigned to them
        // If user is owner/manager, show all new leads
        const shouldNotify =
          user?.role === 'owner' ||
          user?.role === 'manager' ||
          (user?.role === 'seller' && newLead.assigned_to === user.id);

        if (shouldNotify) {
          addToast(
            `Novo lead recebido: ${newLead.name} - ${newLead.type === 'proposal' ? 'Proposta' : newLead.type === 'whatsapp' ? 'WhatsApp' : 'Telefone'}`,
            'info',
            8000
          );

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore audio playback errors (user interaction may be required)
            });
          } catch {
            // Ignore audio errors
          }

          // Call custom callback if provided
          if (onNewLead) {
            onNewLead(newLead);
          }
        }
      }
    },
    [user, addToast, onNewLead]
  );

  useEffect(() => {
    if (!tenant?.id) return;

    // Subscribe to new leads for the current tenant
    const channel = supabase
      .channel(`leads:tenant_id=eq.${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          handleRealtimeEvent(payload as unknown as RealtimeLeadPayload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, handleRealtimeEvent]);

  return null;
}
