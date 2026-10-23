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
        const file = e.target.files[0];
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

    if (isLoading) return <div className="p-4 text-gray-500">Loading settings...</div>;

    return (
        <Card className="shadow-sm mt-6 responsive-page border border-slate-200">
            <CardHeader className="bg-lime-50/70 border-b border-lime-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#8DB600]" />
                    <h3 className="font-extrabold text-base text-slate-900">Landing Page Content & Settings (Admin)</h3>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* Brand & Logo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Business Logo</Label>
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="cursor-pointer group relative w-44 h-44 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#8DB600] rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-semibold">Upload Station Logo</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} disabled={isDemo} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="font-bold text-xs text-slate-700">Business Name</Label>
                                <Input name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="Seaside Water Refilling Station" disabled={isDemo} />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700">Station Contact Number</Label>
                                <Input name="contact_number" value={formData.contact_number} onChange={handleInputChange} placeholder="+63 960 219 6388" disabled={isDemo} />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700">Inquiry Email</Label>
                                <Input name="email" value={formData.email} onChange={handleInputChange} placeholder="seasidewrs@gmail.com" disabled={isDemo} />
                            </div>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600]">Hero Section Content</h4>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Hero Main Headline (Leave blank for default)</Label>
                            <Input
                                name="hero_title"
                                value={formData.hero_title}
                                onChange={handleInputChange}
                                placeholder="Your Family's Health, Flowing Crystal Clear from Seaside."
                                disabled={isDemo}
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Hero Subtitle / Description</Label>
                            <Textarea
                                name="hero_subtitle"
                                value={formData.hero_subtitle}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="We combine commercial-grade 21-stage reverse osmosis filtration with warm local care..."
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    {/* Refill & Supply Services Section Editor */}
                    <div className="space-y-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#8DB600]" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600]">
                                Refill & Supply Services Cards (Landing Section)
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="font-bold text-xs text-slate-700">Services Section Title</Label>
                                <Input
                                    name="services_title"
                                    value={formData.services_title}
                                    onChange={handleInputChange}
                                    placeholder="Our Refill & Supply Services"
                                    disabled={isDemo}
                                />
                            </div>
                            <div>
                                <Label className="font-bold text-xs text-slate-700">Services Section Subtitle</Label>
                                <Input
                                    name="services_subtitle"
                                    value={formData.services_subtitle}
                                    onChange={handleInputChange}
                                    placeholder="Whether visiting our physical refilling bay or requesting high-volume delivery..."
                                    disabled={isDemo}
                                />
                            </div>
                        </div>

                        {/* Grid of 4 Service Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {servicesData.map((service, index) => (
                                <div key={service.id || index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                                        <span className="text-xs font-black text-[#8DB600] uppercase tracking-wider">
                                            Card #{index + 1}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600">Service Title</Label>
                                            <Input
                                                value={service.title}
                                                onChange={e => handleServiceChange(index, 'title', e.target.value)}
                                                placeholder="e.g. Walk-In Refills"
                                                disabled={isDemo}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-bold text-slate-600">Badge Label</Label>
                                            <Input
                                                value={service.badge}
                                                onChange={e => handleServiceChange(index, 'badge', e.target.value)}
                                                placeholder="e.g. In-Store"
                                                disabled={isDemo}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-bold text-slate-600">Starting Price / Display Rate</Label>
                                        <Input
                                            value={service.price}
                                            onChange={e => handleServiceChange(index, 'price', e.target.value)}
                                            placeholder="e.g. ₱20 - ₱25 or From ₱6.00"
                                            disabled={isDemo}
                                            className="h-9 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-[11px] font-bold text-slate-600">Short Description</Label>
                                        <Textarea
                                            value={service.description}
                                            onChange={e => handleServiceChange(index, 'description', e.target.value)}
                                            rows={2}
                                            placeholder="Card details..."
                                            disabled={isDemo}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address & Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Station Business Hours</Label>
                            <Input
                                name="business_hours"
                                value={formData.business_hours}
                                onChange={handleInputChange}
                                placeholder="Monday - Saturday: 8:00 AM - 5:00 PM"
                                disabled={isDemo}
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Physical Address</Label>
                            <Input
                                name="physical_address"
                                value={formData.physical_address}
                                onChange={handleInputChange}
                                placeholder="Barangay Laois, Labrador, Pangasinan"
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    {/* Social & Messenger */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Facebook Page URL</Label>
                            <Input name="facebook_link" value={formData.facebook_link} onChange={handleInputChange} placeholder="https://facebook.com/..." disabled={isDemo} />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Messenger Link</Label>
                            <Input name="messenger_link" value={formData.messenger_link} onChange={handleInputChange} placeholder="https://m.me/61587059323111" disabled={isDemo} />
                        </div>
                    </div>

                    {/* Footer Content */}
                    <div className="pt-4 border-t border-slate-100">
                        <Label className="font-bold text-xs text-slate-700">About / Community Roots (Footer Display)</Label>
                        <Textarea
                            name="about_content"
                            value={formData.about_content}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Founded on 2020, our station was born from a desire for local self-reliance in Labrador, Pangasinan..."
                            disabled={isDemo}
                        />
                    </div>

                    {/* Location Embed */}
                    <div>
                        <Label className="font-bold text-xs text-slate-700">Location Map Embed URL (iframe src)</Label>
                        <Input name="location_embed" value={formData.location_embed} onChange={handleInputChange} placeholder="https://www.google.com/maps/embed?pb=..." disabled={isDemo} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" variant="primary" className="bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 px-8 rounded-xl shadow-md" disabled={isSaving || isDemo}>
                            {isSaving ? 'Saving Changes...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}