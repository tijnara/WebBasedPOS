// src/components/dashboard/PageSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Textarea } from '../ui';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Image as ImageIcon, Sliders } from 'lucide-react';

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
        physical_address: ''
    });

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
                physical_address: settings.physical_address || ''
            });
            setImagePreview(settings.logo_url || null);
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

            // Preserves primary key (id: 1) on update
            await updateSettings.mutateAsync({
                id: settings?.id || 1,
                ...formData,
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
                <form onSubmit={handleSave} className="space-y-6">
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

                    {/* Hero Section Texts */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#8DB600]">Hero Section Headline & Subtitle</h4>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Hero Main Headline (Leave blank to use default)</Label>
                            <Input
                                name="hero_title"
                                value={formData.hero_title}
                                onChange={handleInputChange}
                                placeholder="Your Family's Health, Flowing Crystal Clear from Seaside."
                                disabled={isDemo}
                            />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Hero Subtitle / Mission Statement</Label>
                            <Textarea
                                name="hero_subtitle"
                                value={formData.hero_subtitle}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="We combine commercial-grade 21-stage reverse osmosis filtration with warm local care..."
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    {/* Address & Operating Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
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

                    {/* Social & Messenger Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Facebook Page URL</Label>
                            <Input name="facebook_link" value={formData.facebook_link} onChange={handleInputChange} placeholder="https://facebook.com/..." disabled={isDemo} />
                        </div>
                        <div>
                            <Label className="font-bold text-xs text-slate-700">Messenger Link (Used in Mobile Bar & Contact)</Label>
                            <Input name="messenger_link" value={formData.messenger_link} onChange={handleInputChange} placeholder="https://m.me/61587059323111" disabled={isDemo} />
                        </div>
                    </div>

                    {/* Footer About Content */}
                    <div className="pt-2 border-t border-slate-100">
                        <Label className="font-bold text-xs text-slate-700">About / Community Roots (Footer Display)</Label>
                        <p className="text-xs text-slate-400 mb-2">Displayed in the footer to explain Seaside's story to customers.</p>
                        <Textarea
                            name="about_content"
                            value={formData.about_content}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Founded on 2020, our station was born from a desire for local self-reliance in Labrador, Pangasinan..."
                            disabled={isDemo}
                        />
                    </div>

                    {/* Google Maps Embed */}
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