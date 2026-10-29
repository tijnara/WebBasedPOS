// src/components/dashboard/PageSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Textarea } from '../ui';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Image as ImageIcon, Sliders, Layers } from 'lucide-react';

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

export default function PageSettings() {
    const { data: settings, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const { addToast, user } = useStore();
    const isDemo = user?.isDemo;

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
        services_subtitle: ''
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
                services_subtitle: settings.services_subtitle || ''
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

    const handleSave = async (e) => {
        e.preventDefault();
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

            await updateSettings.mutateAsync({
                id: settings?.id || 1,
                ...formData,
                services_data: servicesData,
                logo_url,
                updated_at: new Date().toISOString()
            });

            addToast({ title: 'Success', description: 'Landing page settings updated successfully.', variant: 'success' });
            setImageFile(null);
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Loading settings...
            </div>
        );
    }

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
                            Landing Page Content & Settings (Admin)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Customize customer-facing branding, operational details, and featured services.
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-7">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* Brand & Logo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                                Refill & Supply Services Cards (Landing Section)
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