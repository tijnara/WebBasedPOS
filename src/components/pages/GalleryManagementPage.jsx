// src/components/pages/GalleryManagementPage.jsx
import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import {
    Button, Input, Label,
    Dialog, DialogContent, DialogTitle, DialogCloseButton
} from '../ui';
import {
    Image as ImageIcon, Upload, Trash2, Pencil, Plus,
    Search, Eye, Calendar, Sparkles, X
} from 'lucide-react';

const CATEGORIES = [
    'All Categories',
    'Station & Facilities',
    'Equipment & Filters',
    'Delivery & Vehicles',
    'Certificates & Permits',
    'Events & Promos'
];

export default function GalleryManagementPage() {
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;

    // Admin / Owner resolution
    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.is_admin || user.isSuperAdmin) return true;

        const role = String(user.role?.name || user.role || user.position || user.user_type || user.type || '').toLowerCase().trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }

        if (user.role_id === 1 || user.roleId === 1) return true;

        const name = String(user.name || '').toLowerCase();
        const username = String(user.username || '').toLowerCase();
        if (name.includes('aranjit') || name.includes('admin') || username.includes('admin') || username.includes('aranjit')) {
            return true;
        }

        if (role && !['staff', 'cashier', 'crew', 'employee'].includes(role)) {
            return true;
        }

        return false;
    }, [user]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Station & Facilities');
    const [imageUrl, setImageUrl] = useState('');
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    // Resilient Gallery Query
    const { data: galleryItems = [], isLoading } = useQuery({
        queryKey: ['gallery', isDemo],
        queryFn: async () => {
            if (isDemo) {
                return [
                    {
                        id: 1,
                        title: 'Main Station Storefront',
                        description: 'Exterior view of Seaside Water Refilling Station in Laois, Labrador',
                        category: 'Station & Facilities',
                        image_url: '/seaside.png',
                        created_at: new Date().toISOString()
                    }
                ];
            }

            const { data, error } = await supabase
                .from('gallery')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('Gallery fetch error:', error);
                throw error;
            }
            return data || [];
        },
        staleTime: 1000 * 60 * 3
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editingItem) {
                const { error } = await supabase
                    .from('gallery')
                    .update({
                        title: payload.title,
                        description: payload.description,
                        category: payload.category,
                        image_url: payload.imageUrl
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('gallery')
                    .insert({
                        title: payload.title,
                        description: payload.description,
                        category: payload.category,
                        image_url: payload.imageUrl,
                        created_by: user?.id || null
                    });

                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            addToast({
                title: editingItem ? 'Image Updated' : 'Image Added',
                description: `Successfully saved "${title}".`,
                variant: 'success'
            });
            closeModal();
        },
        onError: (err) => {
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('gallery')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            addToast({ title: 'Deleted', description: 'Image removed from gallery.', variant: 'success' });
        },
        onError: (err) => {
            addToast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
        }
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingFile(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            const filePath = `gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(filePath, file);

            if (uploadError) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImageUrl(reader.result);
                    setIsUploadingFile(false);
                };
                reader.readAsDataURL(file);
                return;
            }

            const { data } = supabase.storage
                .from('gallery')
                .getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
        } catch (err) {
            console.error('Upload error:', err);
            addToast({ title: 'Upload Notice', description: 'Using local image preview mode.', variant: 'warning' });
        } finally {
            setIsUploadingFile(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setTitle('');
        setDescription('');
        setCategory('Station & Facilities');
        setImageUrl('');
        setIsUploadModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setTitle(item.title || '');
        setDescription(item.description || '');
        setCategory(item.category || 'Station & Facilities');
        setImageUrl(item.image_url || '');
        setIsUploadModalOpen(true);
    };

    const closeModal = () => {
        setIsUploadModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            addToast({ title: 'Title Required', description: 'Please enter an image title.', variant: 'destructive' });
            return;
        }
        if (!imageUrl.trim()) {
            addToast({ title: 'Image Required', description: 'Please provide an image URL or upload a photo.', variant: 'destructive' });
            return;
        }

        saveMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            category,
            imageUrl: imageUrl.trim()
        });
    };

    const filteredItems = useMemo(() => {
        return galleryItems.filter(item => {
            const matchesCat = selectedCategory === 'All Categories' || item.category === selectedCategory;
            const matchesSearch = !searchTerm ||
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [galleryItems, selectedCategory, searchTerm]);

    return (
        <div className="gallery-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 overflow-x-hidden transition-colors">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Gallery Management</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage station photos, equipment records, facility images, and certificates.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        onClick={openCreateModal}
                        variant="primary"
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        disabled={isDemo}
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Photo</span>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
                {/* Search Textfield with Overlap Prevention */}
                <div className="relative flex-1 max-w-md group">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 group-focus-within:text-[#8DB600] dark:group-focus-within:text-lime-400 transition-colors pointer-events-none z-10" />
                    <Input
                        placeholder="Search photos by title or description..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            paddingLeft: '2.5rem',
                            paddingRight: searchTerm ? '2.5rem' : '0.75rem'
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm h-10 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500 transition-all outline-none"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer transition-colors z-10"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Pills with Suppressed Scrollbars */}
                <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
                    {CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                                    isSelected
                                        ? 'bg-[#8DB600] dark:bg-lime-500 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Photo Cards Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    Loading station photos...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-2xs transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-slate-800 dark:text-slate-100 font-bold text-sm">No photos found</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Add images of your station equipment, water test certifications, or delivery vehicles.
                    </p>
                    <Button onClick={openCreateModal} className="h-9 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-xs cursor-pointer">
                        Add First Image
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md dark:hover:border-slate-700 transition-all group flex flex-col"
                        >
                            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => setPreviewImage(item)}>
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/seaside.png';
                                    }}
                                />
                                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-2xs border border-white/40 dark:border-slate-700/70">
                                    {item.category || 'General'}
                                </span>
                            </div>

                            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                                    )}
                                </div>

                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                                    <span className="flex items-center gap-1 font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewImage(item)}
                                            className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                            title="View Full Image"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>

                                        {isAdmin && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(item)}
                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Photo Details"
                                                    disabled={isDemo}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete photo "${item.title}"?`)) {
                                                            deleteMutation.mutate(item.id);
                                                        }
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Photo"
                                                    disabled={isDemo}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload / Edit Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="p-0 sm:max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl dark:[color-scheme:dark]">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span>{editingItem ? 'Edit Photo Details' : 'Add Photo to Gallery'}</span>
                        </DialogTitle>
                        <DialogCloseButton onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Photo Title <span className="text-rose-500">*</span></Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Reverse Osmosis Filtration System"
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="h-10 mt-1 w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                                    >
                                        {CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                                            <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload File</Label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-10 mt-1 w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                        <span>{isUploadingFile ? 'Uploading...' : 'Choose File'}</span>
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Image URL <span className="text-rose-500">*</span></Label>
                                <Input
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    required
                                    placeholder="https://... or upload path"
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:bg-white dark:focus:bg-slate-900"
                                />
                            </div>

                            {imageUrl && (
                                <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center aspect-video overflow-hidden">
                                    <img src={imageUrl} alt="Preview" className="max-h-36 object-contain rounded-lg" />
                                </div>
                            )}

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description (Optional)</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short description or notes..."
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                            <Button variant="outline" type="button" onClick={closeModal} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending || isUploadingFile || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md cursor-pointer"
                            >
                                {saveMutation.isPending ? 'Saving...' : (editingItem ? 'Update Photo' : 'Save Photo')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Full Image Preview Modal */}
            {previewImage && (
                <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                    <DialogContent className="p-0 sm:max-w-2xl w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl dark:[color-scheme:dark]">
                        <div className="relative bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
                            <img src={previewImage.image_url} alt={previewImage.title} className="max-h-[70vh] w-auto object-contain" />
                            <DialogCloseButton onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black/80 p-2 rounded-full cursor-pointer" />
                        </div>
                        <div className="p-5 space-y-1 bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{previewImage.title}</h3>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200 dark:border-lime-900/60">
                                    {previewImage.category}
                                </span>
                            </div>
                            {previewImage.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{previewImage.description}</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}