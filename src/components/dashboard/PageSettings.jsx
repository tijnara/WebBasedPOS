// src/components/dashboard/PageSettings.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Textarea, Select } from '../ui';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { resetScheduledFloaterStorage } from '../ScheduledFloaterToast';
import PageSettingsTour from './PageSettingsTour';
import {
    Image as ImageIcon,
    Sliders,
    Layers,
    BellRing,
    Eye,
    RotateCcw,
    ShieldAlert,
    Droplets,
    MapPin,
    Store,
    ChevronDown
} from 'lucide-react';

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
    { value: 0, label: 'Every Month' },
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
    { value: 'once_a_day', label: 'Once a day (on selected dates)' },
    { value: 'every_day_all_month', label: 'Once a day (all month)' },
    { value: 'every_session', label: 'Every time a user logs in' },
    { value: 'every_page', label: 'Every time a page opens' },
    { value: 'testing', label: 'Test mode (show right away)' }
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
        tds_reading: '002 PPM',
        jug_price_range: '₱20-₱30 / Jug',
        hero_tagline: 'Always Fresh, Cold & Pure',
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

    // Folded by default on initial load to keep the page shorter
    const [openSections, setOpenSections] = useState({
        bannerAndServices: false,
        locationAndLinks: false
    });

    const fileInputRef = useRef(null);

    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (settings) {
            setFormData({
                business_name: settings.business_name || '',
                hero_title: settings.hero_title || '',
                hero_subtitle: settings.hero_subtitle || '',
                tds_reading: settings.tds_reading || '002 PPM',
                jug_price_range: settings.jug_price_range || '₱20-₱30 / Jug',
                hero_tagline: settings.hero_tagline || 'Always Fresh, Cold & Pure',
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
            title: 'Schedule Updated',
            description: `Pop-up set to "${label}". Click Save Settings to apply for all staff.`,
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
            title: 'Pop-Up Reset',
            description: 'Seen status cleared. Click Save Settings to apply for everyone.',
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
                tds_reading: formData.tds_reading?.trim() || '002 PPM',
                jug_price_range: formData.jug_price_range?.trim() || '₱20-₱30 / Jug',
                hero_tagline: formData.hero_tagline?.trim() || 'Always Fresh, Cold & Pure',
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

            addToast({ title: 'Settings Saved', description: 'Your page and reminder updates are now live.', variant: 'success' });
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
                <p className="text-xs text-slate-500 dark:text-slate-400">You do not have permission to change Page Settings.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Loading page settings...
            </div>
        );
    }

    const isDateWindowBypassed =
        formData.promo_floater_frequency === 'testing' ||
        formData.promo_floater_frequency === 'every_day_all_month';

    const previewTdsText = /^tds:/i.test((formData.tds_reading || '').trim())
        ? formData.tds_reading.trim()
        : `TDS: ${(formData.tds_reading || '002 PPM').trim()} • 21-STAGE`;

    return (
        <Card className="shadow-sm mt-6 responsive-page bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-colors">
            <CardHeader className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 py-4 px-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                        <Sliders className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                            Page Settings
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Update your station details, website text, service prices, and staff reminders in one place.
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSave} className="space-y-5">

                    {/* 1. STAFF POP-UP REMINDER */}
                    <section
                        id="tour-ps-floater"
                        className="p-4 sm:p-5 rounded-2xl bg-lime-50/50 dark:bg-lime-950/20 border border-lime-200/80 dark:border-lime-900/50 space-y-4"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-lime-200/70 dark:border-lime-900/40">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#8DB600]/20 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                                    <BellRing className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        1. Staff Pop-Up Reminder
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Shows a reminder box to staff/POS users. Never appears on the public customer page.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleManualReset}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Reset Seen</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePreviewFloater}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Eye className="w-3.5 h-3.5 text-[#8DB600]" />
                                    <span>Preview</span>
                                </button>

                                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.promo_floater_enabled)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, promo_floater_enabled: e.target.checked }))}
                                        disabled={isDemo}
                                        className="w-4 h-4 rounded text-[#8DB600] focus:ring-[#8DB600] border-slate-300 cursor-pointer"
                                    />
                                    <span className={`text-xs font-bold ${formData.promo_floater_enabled ? 'text-[#5f7d00] dark:text-lime-400' : 'text-slate-400'}`}>
                                        {formData.promo_floater_enabled ? 'Active' : 'Off'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    How Often It Appears
                                </Label>
                                <Select
                                    name="promo_floater_frequency"
                                    value={formData.promo_floater_frequency}
                                    onChange={handleFrequencyChange}
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
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
                                    Who Can See It
                                </Label>
                                <Select
                                    name="promo_floater_audience"
                                    value={formData.promo_floater_audience}
                                    onChange={handleInputChange}
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
                                >
                                    <option value="pos" className="bg-white dark:bg-slate-900">All Staff &amp; POS Users</option>
                                    <option value="admin" className="bg-white dark:bg-slate-900">Admins Only</option>
                                </Select>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 transition-opacity ${isDateWindowBypassed ? 'opacity-55' : 'opacity-100'}`}>
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Month
                                </Label>
                                <Select
                                    name="promo_floater_month"
                                    value={formData.promo_floater_month}
                                    onChange={(e) => setFormData(prev => ({ ...prev, promo_floater_month: Number(e.target.value) }))}
                                    disabled={isDemo || isDateWindowBypassed}
                                    className="h-10 mt-1 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
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
                                    Start Day (1–31)
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
                                    End Day (1–31)
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Reminder Title
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
                                    Reminder Message
                                </Label>
                                <Textarea
                                    name="promo_floater_content"
                                    value={formData.promo_floater_content}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="Write a short note or reminder for staff..."
                                    disabled={isDemo}
                                    className="w-full mt-1 text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. STATION INFO & LOGO */}
                    <section
                        id="tour-ps-station"
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/35 border border-slate-200/80 dark:border-slate-800 space-y-4"
                    >
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                                <Store className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    2. Station Name, Logo &amp; Contact
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Core identity and contact details used across your station.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Station Logo
                                </Label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer group relative w-40 h-40 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#8DB600] dark:hover:border-lime-500 rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Logo Preview" className="w-full h-full object-contain p-3" />
                                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-bold text-xs bg-black/70 px-3 py-1.5 rounded-lg">
                                                    Change Logo
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-[#8DB600] dark:group-hover:text-lime-400 transition-colors p-4 text-center">
                                            <ImageIcon className="w-7 h-7 mb-1.5" />
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Click to upload logo</span>
                                            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WebP</span>
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

                            <div className="space-y-3">
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
                                        className="h-10 mt-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                        Phone Number
                                    </Label>
                                    <Input
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleInputChange}
                                        placeholder="+63 960 219 6388"
                                        disabled={isDemo}
                                        className="h-10 mt-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                        Email Address
                                    </Label>
                                    <Input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="seasidewrs@gmail.com"
                                        disabled={isDemo}
                                        className="h-10 mt-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. COLLAPSIBLE: LANDING BANNER, PRICES & SERVICES */}
                    <section
                        id="tour-ps-banner-services"
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => toggleSection('bannerAndServices')}
                            aria-expanded={openSections.bannerAndServices}
                            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                        3. Landing Banner, Prices &amp; Services
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        Headline, TDS &amp; price pills, and the 4 service cards ({servicesData.length} items)
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                <span>{openSections.bannerAndServices ? 'Hide' : 'Edit'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.bannerAndServices ? 'rotate-180' : ''}`} />
                            </span>
                        </button>

                        {openSections.bannerAndServices && (
                            <div className="p-4 sm:p-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                            Main Headline
                                        </Label>
                                        <Input
                                            name="hero_title"
                                            value={formData.hero_title}
                                            onChange={handleInputChange}
                                            placeholder="Your Family's Health, Flowing Crystal Clear from Seaside."
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>

                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                            Short Subheadline
                                        </Label>
                                        <Input
                                            name="hero_subtitle"
                                            value={formData.hero_subtitle}
                                            onChange={handleInputChange}
                                            placeholder="21-stage reverse osmosis water with warm local service."
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Water Purity &amp; Jug Price Badges
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-mono">
                                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/25 font-bold">
                                                {previewTdsText}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-lg bg-lime-100 dark:bg-lime-950/70 text-[#5f7d00] dark:text-lime-300 font-black">
                                                {formData.jug_price_range || '₱20-₱30 / Jug'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                                Water Reading (TDS)
                                            </Label>
                                            <Input
                                                name="tds_reading"
                                                value={formData.tds_reading}
                                                onChange={handleInputChange}
                                                placeholder="002 PPM"
                                                disabled={isDemo}
                                                className="h-10 mt-1 text-xs sm:text-sm font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                                Jug Price Label
                                            </Label>
                                            <Input
                                                name="jug_price_range"
                                                value={formData.jug_price_range}
                                                onChange={handleInputChange}
                                                placeholder="₱20-₱30 / Jug"
                                                disabled={isDemo}
                                                className="h-10 mt-1 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                                Short Tagline
                                            </Label>
                                            <Input
                                                name="hero_tagline"
                                                value={formData.hero_tagline}
                                                onChange={handleInputChange}
                                                placeholder="Always Fresh, Cold & Pure"
                                                disabled={isDemo}
                                                className="h-10 mt-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
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
                                            placeholder="Walk-in refills, door-to-door delivery, bottled water, and tube ice."
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {servicesData.map((service, index) => (
                                        <div key={service.id || index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                                            <div className="text-xs font-extrabold text-[#5f7d00] dark:text-lime-400">
                                                Service #{index + 1}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div>
                                                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Name</Label>
                                                    <Input
                                                        value={service.title}
                                                        onChange={e => handleServiceChange(index, 'title', e.target.value)}
                                                        placeholder="Walk-In Refills"
                                                        disabled={isDemo}
                                                        className="h-9 mt-1 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tag</Label>
                                                    <Input
                                                        value={service.badge}
                                                        onChange={e => handleServiceChange(index, 'badge', e.target.value)}
                                                        placeholder="In-Store"
                                                        disabled={isDemo}
                                                        className="h-9 mt-1 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Price / Rate</Label>
                                                <Input
                                                    value={service.price}
                                                    onChange={e => handleServiceChange(index, 'price', e.target.value)}
                                                    placeholder="₱20 - ₱25"
                                                    disabled={isDemo}
                                                    className="h-9 mt-1 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Description</Label>
                                                <Textarea
                                                    value={service.description}
                                                    onChange={e => handleServiceChange(index, 'description', e.target.value)}
                                                    rows={2}
                                                    placeholder="Brief description of this service..."
                                                    disabled={isDemo}
                                                    className="mt-1 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 4. COLLAPSIBLE: LOCATION, HOURS & SOCIAL LINKS */}
                    <section
                        id="tour-ps-location-links"
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => toggleSection('locationAndLinks')}
                            aria-expanded={openSections.locationAndLinks}
                            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                        4. Location, Hours &amp; Social Links
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        Open hours, address, Facebook/Messenger links, footer note, and map URL
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                <span>{openSections.locationAndLinks ? 'Hide' : 'Edit'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSections.locationAndLinks ? 'rotate-180' : ''}`} />
                            </span>
                        </button>

                        {openSections.locationAndLinks && (
                            <div className="p-4 sm:p-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Open Hours</Label>
                                        <Input
                                            name="business_hours"
                                            value={formData.business_hours}
                                            onChange={handleInputChange}
                                            placeholder="Monday - Saturday: 8:00 AM - 5:00 PM"
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Station Address</Label>
                                        <Input
                                            name="physical_address"
                                            value={formData.physical_address}
                                            onChange={handleInputChange}
                                            placeholder="Barangay Laois, Labrador, Pangasinan"
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Facebook Page Link</Label>
                                        <Input
                                            name="facebook_link"
                                            value={formData.facebook_link}
                                            onChange={handleInputChange}
                                            placeholder="https://facebook.com/..."
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Messenger Link</Label>
                                        <Input
                                            name="messenger_link"
                                            value={formData.messenger_link}
                                            onChange={handleInputChange}
                                            placeholder="https://m.me/..."
                                            disabled={isDemo}
                                            className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">About Note (Shown in Footer)</Label>
                                    <Textarea
                                        name="about_content"
                                        value={formData.about_content}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Tell visitors briefly about your station..."
                                        disabled={isDemo}
                                        className="w-full mt-1 text-xs sm:text-sm p-3 bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <Label className="font-bold text-xs text-slate-700 dark:text-slate-300">Google Map Embed Link</Label>
                                    <Input
                                        name="location_embed"
                                        value={formData.location_embed}
                                        onChange={handleInputChange}
                                        placeholder="https://www.google.com/maps/embed?pb=..."
                                        disabled={isDemo}
                                        className="h-10 mt-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    <div
                        id="tour-ps-save"
                        className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800"
                    >
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full sm:w-auto bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 px-8 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                            disabled={isSaving || isDemo}
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>

            <PageSettingsTour isSettingsLoading={isLoading} />
        </Card>
    );
}