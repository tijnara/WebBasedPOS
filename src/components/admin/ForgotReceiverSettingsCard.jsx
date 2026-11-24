// src/components/admin/ForgotReceiverSettingsCard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Mail, Check } from 'lucide-react';

export default function ForgotReceiverSettingsCard({ canManageUsers = false }) {
    const currentUser = useStore((s) => s.user);
    const addToast = useStore((s) => s.addToast);
    const isDemo = Boolean(currentUser?.isDemo);

    const [adminOptions, setAdminOptions] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState('1');
    const [receiverName, setReceiverName] = useState('Aranjit Archita');
    const [receiverEmail, setReceiverEmail] = useState('aranjitarchita@gmail.com');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!canManageUsers) return;
        let mounted = true;

        async function loadData() {
            // Load Admin accounts from public.users
            const { data: admins } = await supabase
                .from('users')
                .select('id, name, email, isadmin')
                .eq('isadmin', true)
                .order('id', { ascending: true });

            if (mounted && admins?.length) {
                setAdminOptions(admins);
            }

            // Load active receiver config
            const res = await fetch('/api/forgot-password');
            const json = await res.json();
            if (mounted && json?.ok && json.receiver) {
                setReceiverName(json.receiver.name || 'Aranjit Archita');
                setReceiverEmail(json.receiver.email || 'aranjitarchita@gmail.com');
                setSelectedAdminId(
                    json.receiver.userId ? String(json.receiver.userId) : 'custom'
                );
            }
        }

        loadData().catch(() => {});
        return () => {
            mounted = false;
        };
    }, [canManageUsers]);

    if (!canManageUsers) return null;

    const handleSelectAdmin = (val) => {
        setSelectedAdminId(val);
        if (val !== 'custom') {
            const found = adminOptions.find((a) => String(a.id) === String(val));
            if (found) {
                setReceiverName(found.name || 'Administrator');
                setReceiverEmail(found.email || '');
            }
        }
    };

    const handleSave = async () => {
        if (isDemo) return;
        setSaving(true);
        try {
            const res = await fetch('/api/forgot-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actorUserId: currentUser?.id,
                    receiverUserId: selectedAdminId === 'custom' ? null : Number(selectedAdminId),
                    receiverName,
                    receiverEmail
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.message || 'Could not update receiver.');
            }
            setIsEditing(false);
            addToast?.({
                title: 'Receiver Updated',
                description: data.message,
                variant: 'success'
            });
        } catch (err) {
            addToast?.({
                title: 'Update Failed',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#8DB600]/15 text-[#8DB600] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        Forgot Password Request Receiver (Admin Only)
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {receiverName} —{' '}
                        <span className="text-[#0284c7] dark:text-sky-400">{receiverEmail}</span>
                    </p>
                </div>
            </div>

            {!isEditing ? (
                <button
                    type="button"
                    disabled={isDemo}
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                    Change Receiver
                </button>
            ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <select
                        value={selectedAdminId}
                        onChange={(e) => handleSelectAdmin(e.target.value)}
                        className="h-9 px-3 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                        {adminOptions.map((adm) => (
                            <option key={adm.id} value={String(adm.id)}>
                                {adm.name} ({adm.email})
                            </option>
                        ))}
                        <option value="custom">Custom Receiver Email...</option>
                    </select>

                    {selectedAdminId === 'custom' && (
                        <input
                            type="email"
                            value={receiverEmail}
                            onChange={(e) => setReceiverEmail(e.target.value)}
                            placeholder="admin@seaside.com"
                            className="h-9 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    )}

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 px-3.5 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}