// src/components/dashboard/PageSettings.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Textarea, Select } from '../ui';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { resetScheduledFloaterStorage } from '../ScheduledFloaterToast';
import { Image as ImageIcon, Sliders, Layers, BellRing, Eye, RotateCcw, ShieldAlert } from 'lucide-react';

const DEFAULT_SERVICES = [
    {
        id: 'walk_in',
        badge: 'In-Store',
        title: 'Walk-In Refills',
        price: '₱20 - ₱25',
        description: 'Fast, sanitary refilling right in front of you. Bring your 5-gallon slim or round containers for full high-pressure interior wash and seal.'
    },
    {
        id: 'delivery',
        badge: 'Delivery',
        title: 'Door-to-Door Delivery',
        price: '₱25 - ₱30',
        description: 'Stay relaxed while we deliver freshly filtered jugs directly to your doorstep anywhere in Labrador and nearby barangays.'
    },
    {
        id: 'bottles',
        badge: 'Grab & Go',
        title: 'Bottled Water Pack',
        price: 'From ₱6.00',
        description: 'Convenient 350ml and 500ml sealed PET bottles. Ideal for family gatherings, school snacks, road trips, and store resale.'
    },
    {
        id: 'ice',
        badge: 'Food Safe',
        title: 'Purified Tube Ice',
        price: 'From ₱20.00',
        description: 'Crystal-clear, food-grade ice cubes manufactured solely from our 21-stage RO filtered water. Melts slow and stays pure.'
    }
];

const MONTH_OPTIONS = [
    { value: 0, label: 'Every Month (Recurring)' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

const FREQUENCY_OPTIONS = [
    { value: 'once_a_day', label: 'Once a Day (During Active Dates)' },
    { value: 'every_day_all_month', label: 'Every Day (Once Daily — All Month)' },
    { value: 'every_session', label: 'Every Login / Browser Session' },
    { value: 'every_page', label: 'Every Page Load / Navigation' },
    { value: 'testing', label: 'Testing Mode (Pop Out Immediately Every Time)' }
];

export default function PageSettings() {
    const { data: settings, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const { addToast, user } = useStore();
    const isDemo = user?.isDemo;

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;
        const role = String(user.role?.name || user.role || user.position || user.user_type || user.type || '').toLowerCase().trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }
        if (user.role_id === 1 || user.roleId === 1) return true;
        return false;
    }, [user]);

    const [formData, setFormData] = useState({
        business_name: '',
        hero_title: '',
        hero_subtitle: '',
        contact_number: '',
        email: '',
        facebook_link: '',
        messenger_link: '',
        about_content: '',
        location_embed: '',
        business_hours: '',
        physical_address: '',
        services_title: '',
        services_subtitle: '',
        promo_floater_enabled: true,
        promo_floater_title: 'Monthly Schedule & Reminder',
        promo_floater_content: 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!',
        promo_floater_month: 0,
        promo_floater_start_day: 10,
        promo_floater_end_day: 15,
        promo_floater_audience: 'pos',
        promo_floater_frequency: 'once_a_day',
        promo_floater_reset_at: new Date().toISOString()
    });

    const [servicesData, setServicesData] = useState(DEFAULT_SERVICES);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                business_name: settings.business_name || '',
                hero_title: settings.hero_title || '',
                hero_subtitle: settings.hero_subtitle || '',
                contact_number: settings.contact_number || '',
                email: settings.email || '',
                facebook_link: settings.facebook_link || '',
                messenger_link: settings.messenger_link || '',
                about_content: settings.about_content || '',
                location_embed: settings.location_embed || '',
                business_hours: settings.business_hours || '',
                physical_address: settings.physical_address || '',
                services_title: settings.services_title || '',
                services_subtitle: settings.services_subtitle || '',
                promo_floater_enabled: settings.promo_floater_enabled !== false,
                promo_floater_title: settings.promo_floater_title ?? 'Monthly Schedule & Reminder',
                promo_floater_content: settings.promo_floater_content ?? 'Reminder: Our monthly promo & billing schedule is active from the 10th to the 15th of the month!',
                promo_floater_month: Number(settings.promo_floater_month ?? 0),
                promo_floater_start_day: Number(settings.promo_floater_start_day ?? 10),
                promo_floater_end_day: Number(settings.promo_floater_end_day ?? 15),
                promo_floater_audience: settings.promo_floater_audience === 'admin' ? 'admin' : 'pos',
                promo_floater_frequency: settings.promo_floater_frequency || 'once_a_day',
                promo_floater_reset_at: settings.promo_floater_reset_at || new Date().toISOString()
            });

            if (settings.services_data && Array.isArray(settings.services_data) && settings.services_data.length > 0) {
                setServicesData(settings.services_data);
            } else {
                setServicesData(DEFAULT_SERVICES);
            }

            setImagePreview(settings.logo_url || null);
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Selecting any frequency option automatically resets the floater state
    const handleFrequencyChange = (e) => {
        const newFreq = e.target.value;
        const resetTimestamp = new Date().toISOString();

        resetScheduledFloaterStorage();
        setFormData(prev => ({
            ...prev,
            promo_floater_frequency: newFreq,
            promo_floater_reset_at: resetTimestamp
        }));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('reset-scheduled-floater', {
                    detail: {
                        showNow: newFreq === 'testing',
                        draft: {
                            promo_floater_title: formData.promo_floater_title,
                            promo_floater_content: formData.promo_floater_content,
                            promo_floater_month: Number(formData.promo_floater_month ?? 0),
                            promo_floater_start_day: Number(formData.promo_floater_start_day ?? 10),
                            promo_floater_end_day: Number(formData.promo_floater_end_day ?? 15),
                            promo_floater_frequency: newFreq
                        }
                    }
                })
            );
        }

        const label = FREQUENCY_OPTIONS.find(o => o.value === newFreq)?.label || newFreq;
        addToast({
            title: 'Floater Reset & Updated',
            description: `Pop-out schedule set to "${label}". Click Save Settings to apply for all staff.`,
            variant: 'success'
        });
    };

    const handleManualReset = () => {
        const resetTimestamp = new Date().toISOString();
        resetScheduledFloaterStorage();
        setFormData(prev => ({
            ...prev,
            promo_floater_reset_at: resetTimestamp
        }));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('reset-scheduled-floater', { detail: { showNow: false } }));
        }

        addToast({
            title: 'Notification Timer Reset',
            description: 'Daily/session tracking cleared. Save Settings to reset for all staff.',
            variant: 'success'
        });
    };

    const handleServiceChange = (index, field, value) => {
        setServicesData(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handlePreviewFloater = () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('preview-scheduled-floater', {
                    detail: {
                        promo_floater_title: formData.promo_floater_title,
                        promo_floater_content: formData.promo_floater_content,
                        promo_floater_month: Number(formData.promo_floater_month ?? 0),
                        promo_floater_start_day: Number(formData.promo_floater_start_day ?? 10),
                        promo_floater_end_day: Number(formData.promo_floater_end_day ?? 15),
                        promo_floater_frequency: formData.promo_floater_frequency
                    }
                })
            );
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSaving(true);
        try {
            let logo_url = settings?.logo_url || null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `logo-${Date.now()}.${fileExt}`;
                const filePath = `settings/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, imageFile, { upsert: true });
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);
                logo_url = data.publicUrl;
            }

            const startDay = Math.min(31, Math.max(1, parseInt(formData.promo_floater_start_day, 10) || 10));
            const endDay = Math.min(31, Math.max(1, parseInt(formData.promo_floater_end_day, 10) || 15));
            const targetMonth = Math.min(12, Math.max(0, parseInt(formData.promo_floater_month, 10) || 0));
            const audience = formData.promo_floater_audience === 'admin' ? 'admin' : 'pos';
            const resetTimestamp = new Date().toISOString();

            resetScheduledFloaterStorage();

            await updateSettings.mutateAsync({
                id: settings?.id || 1,
                ...formData,
                promo_floater_enabled: Boolean(formData.promo_floater_enabled),
                promo_floater_month: targetMonth,
                promo_floater_start_day: startDay,
                promo_floater_end_day: endDay,
                promo_floater_audience: audience,
                promo_floater_frequency: formData.promo_floater_frequency || 'once_a_day',
                promo_floater_reset_at: resetTimestamp,
                services_data: servicesData,
                logo_url,
                updated_at: resetTimestamp
            });

            addToast({ title: 'Success', description: 'Page & floater settings saved and reset for all users.', variant: 'success' });
            setImageFile(null);
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 mt-6">
                <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Administrator Access Only</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">You do not have permission to view or edit Page Settings.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Loading settings...
            </div>
        );
    }

    const isDateWindowBypassed =
        formData.promo_floater_frequency === 'testing' ||
        formData.promo_floater_frequency === 'every_day_all_month';

    return (
        <Card className="shadow-sm mt-6 responsive-page bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-colors">
            {/* Header */}
            <CardHeader className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <Sliders className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                            Landing Page Content &amp; Settings (Admin)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Customize customer-facing branding, operational details, scheduled staff floater reminders, and featured services.
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-7">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* SCHEDULED MONTHLY FLOATER / TOAST SETTINGS */}
                    <div className="p-5 rounded-2xl bg-lime-50/50 dark:bg-lime-950/20 border border-lime-200/80 dark:border-lime-900/50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-lime-200/70 dark:border-lime-900/40">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#8DB600]/20 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                                    <BellRing className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        Scheduled Staff Floater / Center Alert
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Appears aggressively in the center of the screen on POS &amp; Staff pages (never shown on public website).
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={handleManualReset}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                    title="Reset seen status so it pops out again"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Reset</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePreviewFloater}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <Eye className="w-3.5 h-3.5 text-[#8DB600]" />
                                    <span>Preview</span>
                                </button>

                                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer select-none shadow-2xs">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.promo_floater_enabled)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, promo_floater_enabled: e.target.checked }))}
                                        disabled={isDemo}
                                        className="w-4 h-4 rounded text-[#8DB600] focus:ring-[#8DB600] border-slate-300 cursor-pointer"
                                    />
                                    <span className={`text-xs font-black ${formData.promo_floater_enabled ? 'text-[#5f7d00] dark:text-lime-400' : 'text-slate-400'}`}>
                                        {formData.promo_floater_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Pop-Out Frequency & Audience Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    When Will It Pop Out (Frequency — Auto-Resets on Select)
                                </Label>
                                <Select
                                    name="promo_floater_frequency"
                                    value={formData.promo_floater_frequency}
                                    onChange={handleFrequencyChange}
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                                >
                                    {FREQUENCY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Show To (POS &amp; Staff Only)
                                </Label>
                                <Select
                                    name="promo_floater_audience"
                                    value={formData.promo_floater_audience}
                                    onChange={handleInputChange}
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                                >
                                    <option value="pos" className="bg-white dark:bg-slate-900">All POS &amp; Staff Users</option>
                                    <option value="admin" className="bg-white dark:bg-slate-900">Admin Users Only</option>
                                </Select>
                            </div>
                        </div>

                        {/* Month & Day Range Row */}
                        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity ${isDateWindowBypassed ? 'opacity-55' : 'opacity-100'}`}>
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Active Month
                                </Label>
                                <Select
                                    name="promo_floater_month"
                                    value={formData.promo_floater_month}
                                    onChange={(e) => setFormData(prev => ({ ...prev, promo_floater_month: Number(e.target.value) }))}
                                    disabled={isDemo || isDateWindowBypassed}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                                >
                                    {MONTH_OPTIONS.map(m => (
                                        <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900">
                                            {m.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Start Day of Month
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    name="promo_floater_start_day"
                                    value={formData.promo_floater_start_day}
                                    onChange={handleInputChange}
                                    disabled={isDemo || isDateWindowBypassed}
                                    className="h-10 mt-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    End Day of Month
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    name="promo_floater_end_day"
                                    value={formData.promo_floater_end_day}
                                    onChange={handleInputChange}
                                    disabled={isDemo || isDateWindowBypassed}
                                    className="h-10 mt-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Title & Message Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Floater Title / Headline
                                </Label>
                                <Input
                                    name="promo_floater_title"
                                    value={formData.promo_floater_title}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Monthly Promo & Billing Reminder"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Floater Message Content
                                </Label>
                                <Textarea
                                    name="promo_floater_content"
                                    value={formData.promo_floater_content}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="Enter the announcement, promo, or reminder text to display..."
                                    disabled={isDemo}
                                    className="w-full mt-1 text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand & Logo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                Business Logo
                            </Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer group relative w-48 h-48 bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#8DB600] dark:hover:border-lime-500 rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden"
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Logo Preview" className="w-full h-full object-contain p-3" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-lg">
                                                Change Logo
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-[#8DB600] dark:group-hover:text-lime-400 transition-colors p-4 text-center">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Upload Station Logo</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">PNG, JPG, WebP</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isDemo}
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Business Name
                                </Label>
                                <Input
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleInputChange}
                                    placeholder="Seaside Water Refilling Station"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Station Contact Number
                                </Label>
                                <Input
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleInputChange}
                                    placeholder="+63 960 219 6388"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Inquiry Email
                                </Label>
                                <Input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="seasidewrs@gmail.com"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400">
                            Hero Section Content
                        </h4>
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                Hero Main Headline (Leave blank for default)
                            </Label>
                            <Input
                                name="hero_title"
                                value={formData.hero_title}
                                onChange={handleInputChange}
                                placeholder="Your Family's Health, Flowing Crystal Clear from Seaside."
                                disabled={isDemo}
                                className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                Hero Subtitle / Description
                            </Label>
                            <Textarea
                                name="hero_subtitle"
                                value={formData.hero_subtitle}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="We combine commercial-grade 21-stage reverse osmosis filtration with warm local care..."
                                disabled={isDemo}
                                className="w-full mt-1 text-xs sm:text-sm p-3 bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                    </div>

                    {/* Refill & Supply Services Section Editor */}
                    <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#8DB600] dark:text-lime-400" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400">
                                Refill &amp; Supply Services Cards (Landing Section)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Services Section Title
                                </Label>
                                <Input
                                    name="services_title"
                                    value={formData.services_title}
                                    onChange={handleInputChange}
                                    placeholder="Our Refill & Supply Services"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Services Section Subtitle
                                </Label>
                                <Input
                                    name="services_subtitle"
                                    value={formData.services_subtitle}
                                    onChange={handleInputChange}
                                    placeholder="Whether visiting our physical refilling bay or requesting high-volume delivery..."
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                        </div>

                        {/* Grid of 4 Service Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {servicesData.map((service, index) => (
                                <div key={service.id || index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700/80">
                                        <span className="text-xs font-black text-[#8DB600] dark:text-lime-400 uppercase tracking-wider">
                                            Card #{index + 1}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Service Title</Label>
                                            <Input
                                                value={service.title}
                                                onChange={e => handleServiceChange(index, 'title', e.target.value)}
                                                placeholder="e.g. Walk-In Refills"
                                                disabled={isDemo}
                                                className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Badge Label</Label>
                                            <Input
                                                value={service.badge}
                                                onChange={e => handleServiceChange(index, 'badge', e.target.value)}
                                                placeholder="e.g. In-Store"
                                                disabled={isDemo}
                                                className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Starting Price / Display Rate</Label>
                                        <Input
                                            value={service.price}
                                            onChange={e => handleServiceChange(index, 'price', e.target.value)}
                                            placeholder="e.g. ₱20 - ₱25 or From ₱6.00"
                                            disabled={isDemo}
                                            className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Short Description</Label>
                                        <Textarea
                                            value={service.description}
                                            onChange={e => handleServiceChange(index, 'description', e.target.value)}
                                            rows={2}
                                            placeholder="Card details..."
                                            disabled={isDemo}
                                            className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address & Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Station Business Hours</Label>
                            <Input
                                name="business_hours"
                                value={formData.business_hours}
                                onChange={handleInputChange}
                                placeholder="Monday - Saturday: 8:00 AM - 5:00 PM"
                                disabled={isDemo}
                                className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Physical Address</Label>
                            <Input
                                name="physical_address"
                                value={formData.physical_address}
                                onChange={handleInputChange}
                                placeholder="Barangay Laois, Labrador, Pangasinan"
                                disabled={isDemo}
                                className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                    </div>

                    {/* Social & Messenger */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Facebook Page URL</Label>
                            <Input
                                name="facebook_link"
                                value={formData.facebook_link}
                                onChange={handleInputChange}
                                placeholder="https://facebook.com/..."
                                disabled={isDemo}
                                className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Messenger Link</Label>
                            <Input
                                name="messenger_link"
                                value={formData.messenger_link}
                                onChange={handleInputChange}
                                placeholder="https://m.me/61587059323111"
                                disabled={isDemo}
                                className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>
                    </div>

                    {/* Footer Content */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">About / Community Roots (Footer Display)</Label>
                        <Textarea
                            name="about_content"
                            value={formData.about_content}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Founded on 2020, our station was born from a desire for local self-reliance in Labrador, Pangasinan..."
                            disabled={isDemo}
                            className="w-full mt-1 text-xs sm:text-sm p-3 bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                        />
                    </div>

                    {/* Location Embed */}
                    <div>
                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Location Map Embed URL (iframe src)</Label>
                        <Input
                            name="location_embed"
                            value={formData.location_embed}
                            onChange={handleInputChange}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                            disabled={isDemo}
                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 px-8 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                            disabled={isSaving || isDemo}
                        >
                            {isSaving ? 'Saving Changes...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}