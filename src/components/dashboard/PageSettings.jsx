// src/components/dashboard/PageSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Label, Textarea } from '../ui';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Image as ImageIcon } from 'lucide-react';

export default function PageSettings() {
    const { data: settings, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const { addToast } = useStore();

    const [formData, setFormData] = useState({
        business_name: '',
        contact_number: '',
        facebook_link: '',
        messenger_link: '',
        about_content: '',
        location_embed: ''
    });
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                business_name: settings.business_name || '',
                contact_number: settings.contact_number || '',
                facebook_link: settings.facebook_link || '',
                messenger_link: settings.messenger_link || '',
                about_content: settings.about_content || '',
                location_embed: settings.location_embed || ''
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

            await updateSettings.mutateAsync({ ...formData, logo_url });
            addToast({ title: 'Success', description: 'Page settings updated successfully.', variant: 'success' });
            setImageFile(null);
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-4 text-gray-500">Loading settings...</div>;

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm mt-6 responsive-page">
            <CardHeader className="bg-blue-50 pb-3 border-b border-blue-100">
                <h3 className="font-bold text-lg text-blue-800">⚙️ Page Settings (Admin Only)</h3>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Business Logo</Label>
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="cursor-pointer group relative w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-sm">Upload Logo</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Business Name</Label>
                                <Input name="business_name" value={formData.business_name} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label>Contact Number</Label>
                                <Input name="contact_number" value={formData.contact_number} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Facebook Link</Label>
                            <Input name="facebook_link" value={formData.facebook_link} onChange={handleInputChange} placeholder="https://facebook.com/..." />
                        </div>
                        <div>
                            <Label>Messenger Link</Label>
                            <Input name="messenger_link" value={formData.messenger_link} onChange={handleInputChange} placeholder="http://m.me/..." />
                        </div>
                    </div>

                    <div>
                        <Label>About Content</Label>
                        <p className="text-xs text-gray-500 mb-2">Supports multi-line formatting. This is displayed in the footer of the landing page.</p>
                        <Textarea
                            name="about_content"
                            value={formData.about_content}
                            onChange={handleInputChange}
                            rows={5}
                            placeholder="Write about your business here..."
                        />
                    </div>

                    <div>
                        <Label>Location Map Embed URL (src)</Label>
                        <Input name="location_embed" value={formData.location_embed} onChange={handleInputChange} placeholder="https://www.google.com/maps/embed?pb=..." />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving Changes...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
