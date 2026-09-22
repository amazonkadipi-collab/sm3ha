import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  const utils = trpc.useUtils();
  const [authReady, setAuthReady] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: authReady,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().finally(() => {
      if (mounted) setAuthReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      setAuthReady(true);
      if (event === "SIGNED_OUT") {
        utils.auth.me.setData(undefined, null);
      }
      void utils.auth.me.invalidate();
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [utils]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      try {
        await logoutMutation.mutateAsync();
      } catch {
        // Supabase is the source of truth for user sessions; local admin
        // sessions are cleared by the same endpoint when applicable.
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: !authReady || meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [authReady, meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || !authReady || meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user || typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [authReady, redirectOnUnauthenticated, redirectPath, logoutMutation.isPending, meQuery.isLoading, state.user]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
