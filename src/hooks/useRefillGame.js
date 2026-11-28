// src/hooks/useRefillGame.js
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const GUEST_STORAGE_KEY = 'seaside_refill_guest_profile_v1';

const ADJECTIVES = [
    'Aqua', 'Crystal', 'Seaside', 'Pure', 'Coastal', 'Splash',
    'Glacier', 'Fresh', 'Ocean', 'Mist', 'Tidal', 'Spring'
];

const NOUNS = [
    'Hydrator', 'Drop', 'Wave', 'Refiller', 'Ripple', 'Stream',
    'Sprinter', 'Bubble', 'Cascade', 'Pourer', 'Surfer', 'Oasis'
];

export function generateRandomGuestName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj} ${noun} #${num}`;
}

function createGuestKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `guest_${crypto.randomUUID()}`;
    }
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useRefillGamePlayer(storeId = null) {
    const user = useStore((s) => s.user);
    const targetStoreId = Number(storeId || user?.store_id) || 1;
    const [identity, setIdentity] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (user && user.id && !user.isDemo) {
            setIdentity({
                playerKey: `user_${user.id}`,
                playerName: (user.name || user.username || generateRandomGuestName()).trim(),
                isGuest: false
            });
            return;
        }

        try {
            const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.playerKey && parsed?.playerName) {
                    setIdentity({
                        playerKey: parsed.playerKey,
                        playerName: parsed.playerName,
                        isGuest: true
                    });
                    return;
                }
            }
        } catch {
            // Ignore storage parse errors
        }

        const freshProfile = {
            playerKey: createGuestKey(),
            playerName: generateRandomGuestName(),
            isGuest: true
        };

        try {
            window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(freshProfile));
        } catch {
            // Ignore private-browsing storage limits
        }
        setIdentity(freshProfile);
    }, [user]);

    const playerQuery = useQuery({
        queryKey: ['refill-game-player', targetStoreId, identity?.playerKey],
        enabled: Boolean(identity?.playerKey),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('refill_game_players')
                .select('*')
                .eq('store_id', targetStoreId)
                .eq('player_key', identity.playerKey)
                .maybeSingle();

            if (error) throw error;
            return data || null;
        },
        staleTime: 1000 * 30
    });

    const rerollGuestName = useCallback(async () => {
        if (!identity || !identity.isGuest) return;
        const nextName = generateRandomGuestName();
        const updated = { ...identity, playerName: nextName };
        setIdentity(updated);

        try {
            window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore storage errors
        }

        if (playerQuery.data) {
            await supabase
                .from('refill_game_players')
                .update({ player_name: nextName, updated_at: new Date().toISOString() })
                .eq('store_id', targetStoreId)
                .eq('player_key', identity.playerKey);
        }
    }, [identity, playerQuery.data, targetStoreId]);

    return {
        identity,
        savedPlayer: playerQuery.data,
        isLoadingPlayer: playerQuery.isLoading,
        rerollGuestName
    };
}

export function useRefillGameLeaderboard(limit = 10, storeId = null) {
    const userStoreId = useStore((s) => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['refill-game-leaderboard', targetStoreId, limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('refill_game_players')
                .select('*')
                .eq('store_id', targetStoreId)
                .gt('total_score', 0)
                .order('total_score', { ascending: false })
                .order('jugs_completed', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 20
    });
}

export function useRecordRefillRun() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               identity,
                               jugType,
                               litersFilled,
                               grade,
                               pointsEarned,
                               streakCount,
                               newTotalScore,
                               newJugsCompleted,
                               isPerfectSeal,
                               storeId = null
                           }) => {
            if (!identity?.playerKey) return null;

            const currentUser = useStore.getState().user;
            const resolvedStoreId = Number(storeId || currentUser?.store_id) || 1;
            const nowIso = new Date().toISOString();

            const { error: logError } = await supabase.from('refill_game_logs').insert({
                store_id: resolvedStoreId,
                player_key: identity.playerKey,
                player_name: identity.playerName,
                is_guest: Boolean(identity.isGuest),
                jug_type: jugType,
                liters_filled: Number(litersFilled.toFixed(2)),
                grade,
                points_earned: pointsEarned,
                streak_count: streakCount,
                created_at: nowIso
            });

            if (logError) throw logError;

            const { data: existing } = await supabase
                .from('refill_game_players')
                .select('*')
                .eq('store_id', resolvedStoreId)
                .eq('player_key', identity.playerKey)
                .maybeSingle();

            const updatedRecord = {
                store_id: resolvedStoreId,
                player_key: identity.playerKey,
                player_name: identity.playerName,
                is_guest: Boolean(identity.isGuest),
                total_score: Math.max(newTotalScore, (existing?.total_score || 0) + pointsEarned),
                best_single_score: Math.max(existing?.best_single_score || 0, pointsEarned),
                jugs_completed: Math.max(
                    newJugsCompleted,
                    (existing?.jugs_completed || 0) + (grade !== 'OVERFLOW' ? 1 : 0)
                ),
                perfect_seals: (existing?.perfect_seals || 0) + (isPerfectSeal ? 1 : 0),
                best_streak: Math.max(existing?.best_streak || 0, streakCount),
                last_jug_type: jugType,
                updated_at: nowIso
            };

            const { data: savedPlayer, error: upsertError } = await supabase
                .from('refill_game_players')
                .upsert(updatedRecord, { onConflict: 'player_key' })
                .select()
                .single();

            if (upsertError) throw upsertError;
            return savedPlayer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['refill-game-player'] });
            queryClient.invalidateQueries({ queryKey: ['refill-game-leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['refill-game-dashboard'] });
        }
    });
}

/**
 * Authenticated Dashboard Analytics Hook (Asia/Manila UTC+8 aligned)
 */
export function useRefillGameDashboardData({ dateFrom = '', dateTo = '', storeId = null } = {}) {
    const userStoreId = useStore((s) => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['refill-game-dashboard', targetStoreId, dateFrom, dateTo],
        queryFn: async () => {
            const { data: players, error: playersError } = await supabase
                .from('refill_game_players')
                .select('*')
                .eq('store_id', targetStoreId)
                .order('total_score', { ascending: false })
                .order('jugs_completed', { ascending: false })
                .limit(200);

            if (playersError) throw playersError;

            let logsQuery = supabase
                .from('refill_game_logs')
                .select('*')
                .eq('store_id', targetStoreId)
                .order('created_at', { ascending: false })
                .limit(300);

            if (dateFrom) {
                const startIso = new Date(`${dateFrom}T00:00:00+08:00`).toISOString();
                logsQuery = logsQuery.gte('created_at', startIso);
            }
            if (dateTo) {
                const endIso = new Date(`${dateTo}T23:59:59.999+08:00`).toISOString();
                logsQuery = logsQuery.lte('created_at', endIso);
            }

            const { data: logs, error: logsError } = await logsQuery;
            if (logsError) throw logsError;

            const safePlayers = players || [];
            const safeLogs = logs || [];

            const guestPlayersCount = safePlayers.filter((p) => p.is_guest).length;
            const staffPlayersCount = safePlayers.filter((p) => !p.is_guest).length;

            const totalAttempts = safeLogs.length;
            const perfectCount = safeLogs.filter((l) => l.grade === 'PERFECT SEAL').length;
            const goodCount = safeLogs.filter((l) => l.grade === 'GOOD FILL').length;
            const underfilledCount = safeLogs.filter((l) => l.grade === 'UNDERFILLED').length;
            const overflowCount = safeLogs.filter((l) => l.grade === 'OVERFLOW').length;

            const roundCount = safeLogs.filter((l) => l.jug_type === 'round').length;
            const slimCount = safeLogs.filter((l) => l.jug_type === 'slim').length;

            const validLitersLogs = safeLogs.filter((l) => l.grade !== 'OVERFLOW');
            const avgLiters =
                validLitersLogs.length > 0
                    ? validLitersLogs.reduce((acc, l) => acc + Number(l.liters_filled || 0), 0) /
                    validLitersLogs.length
                    : 0;

            const highestScore =
                safePlayers.length > 0
                    ? Math.max(...safePlayers.map((p) => Number(p.total_score || 0)))
                    : 0;

            const topStreak =
                safePlayers.length > 0
                    ? Math.max(...safePlayers.map((p) => Number(p.best_streak || 0)))
                    : 0;

            return {
                players: safePlayers,
                logs: safeLogs,
                summary: {
                    totalPlayers: safePlayers.length,
                    guestPlayersCount,
                    staffPlayersCount,
                    totalAttempts,
                    perfectCount,
                    goodCount,
                    underfilledCount,
                    overflowCount,
                    perfectRate:
                        totalAttempts > 0 ? Math.round((perfectCount / totalAttempts) * 100) : 0,
                    roundCount,
                    slimCount,
                    avgLiters,
                    highestScore,
                    topStreak
                }
            };
        },
        staleTime: 1000 * 20
    });
}

/**
 * Admin-only mutation to clear THIS store's leaderboard & simulation logs
 */
export function useResetRefillGameData() {
    const queryClient = useQueryClient();
    const currentUser = useStore((s) => s.user);

    return useMutation({
        mutationFn: async () => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const { error: logsError } = await supabase
                .from('refill_game_logs')
                .delete()
                .eq('store_id', storeId);
            if (logsError) throw logsError;

            const { error: playersError } = await supabase
                .from('refill_game_players')
                .delete()
                .eq('store_id', storeId);
            if (playersError) throw playersError;

            logActivity({
                user,
                action: 'DELETE',
                entity_type: 'REFILL_GAME',
                description: 'Cleared Refill Simulator leaderboard and attempt logs'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['refill-game-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['refill-game-leaderboard'] });
            queryClient.invalidateQueries({ queryKey: ['refill-game-player'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}