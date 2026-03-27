// src/components/pages/GalleryManagementPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Textarea
} from '../ui';
import { useGallery } from '../../hooks/useGallery';
import {
    useCreateGalleryItem,
    useUpdateGalleryItem,
    useDeleteGalleryItem
} from '../../hooks/useGalleryMutations';
import { EditIcon, DeleteIcon } from '../Icons';
import { Image as GalleryIcon, UploadCloud } from 'lucide-react';

const ImageUploader = ({ previewUrl, onFileSelect }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };

    return (
        <div
            onClick={handleDivClick}
            className="cursor-pointer group relative w-full aspect-video bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center transition-all duration-200 overflow-hidden"
        >
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <UploadCloud className="w-8 h-8 text-white mb-2" />
                        <span className="text-white font-medium text-sm">Click to change image</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors duration-200">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-105 transition-transform duration-200">
                        <GalleryIcon className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Click to upload image</span>
                    <span className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</span>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default function GalleryManagementPage() {
    const { data: galleryItems = [], isLoading } = useGallery();
    const { addToast, user } = useStore(s => ({ addToast: s.addToast, user: s.user }));
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';
    const router = useRouter();

    useEffect(() => {
        if (user && !isAdmin) {
            router.replace('/dashboard');
        }
    }, [user, isAdmin, router]);

    const createItem = useCreateGalleryItem();
    const updateItem = useUpdateGalleryItem();
    const deleteItem = useDeleteGalleryItem();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    if (!isAdmin) return null;

    const resetForm = () => {
        setEditing(null);
        setTitle('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
    };

    const handleEdit = (item) => {
        setEditing(item);
        setTitle(item.title);
        setDescription(item.description);
        setImagePreview(item.image_url);
        setIsModalOpen(true);
    };

    const handleFileSelect = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `gallery/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);
            return publicUrl;
        } catch (error) {
            console.error('Error uploading image: ', error);
            addToast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
            return null;
        }
    };

    const getFilePathFromUrl = (url) => {
        if (!url) return null;
        const parts = url.split('/public/');
        if (parts.length > 1) {
            return parts[1];
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!imagePreview && !imageFile) {
            addToast({ title: 'Missing Image', description: 'Please upload an image.', variant: 'destructive' });
            return;
        }

        setUploading(true);
        try {
            let imageUrl = imagePreview;
            let oldImagePath = null;

            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (!uploadedUrl) throw new Error('Image upload failed.');

                imageUrl = uploadedUrl;

                if (editing && editing.image_url && editing.image_url !== imageUrl) {
                    oldImagePath = getFilePathFromUrl(editing.image_url);
                }
            }

            if (editing) {
                await updateItem.mutateAsync({ id: editing.id, title, description, image_url: imageUrl });
                addToast({ title: 'Success', description: 'Gallery item updated successfully' });
                if (oldImagePath) {
                    await supabase.storage.from('gallery').remove([oldImagePath]);
                }
            } else {
                await createItem.mutateAsync({ title, description, image_url: imageUrl });
                addToast({ title: 'Success', description: 'Gallery item added successfully' });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const itemToDelete = galleryItems.find(item => item.id === id);
                await deleteItem.mutateAsync(id);
                addToast({ title: 'Success', description: 'Gallery item deleted successfully' });

                if (itemToDelete && itemToDelete.image_url) {
                    const filePath = getFilePathFromUrl(itemToDelete.image_url);
                    if (filePath) {
                        await supabase.storage.from('gallery').remove([filePath]);
                    }
                }
            } catch (error) {
                addToast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };

    return (
        <div className="p-6 space-y-6 responsive-page max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gallery Management</h1>
                    <p className="text-slate-500 mt-1">Manage the images displayed on the landing page</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn--primary shadow-sm hover:shadow-md transition-shadow"
                >
                    + Add New Item
                </Button>
            </div>

            {/* --- DESKTOP TABLE --- */}
            <Card className="hidden md:block shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[120px] pl-6">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">Loading gallery items...</TableCell></TableRow>
                                ) : galleryItems.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">No gallery items found. Add one to get started!</TableCell></TableRow>
                                ) : (
                                    galleryItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden w-[80px] h-[52px]">
                                                    <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
                                            <TableCell className="max-w-[300px] text-slate-600 truncate">{item.description}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="hover:bg-blue-50">
                                                        <EditIcon className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-red-50">
                                                        <DeleteIcon className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* --- MOBILE LIST VIEW --- */}
            <div className="block md:hidden space-y-4">
                {isLoading ? (
                    <div className="text-center text-slate-500 p-8 bg-white rounded-xl border border-slate-200">Loading items...</div>
                ) : galleryItems.length === 0 ? (
                    <div className="text-center text-slate-500 p-8 bg-white rounded-xl border border-dashed border-slate-300">
                        No items found. Tap "Add New Item" to start.
                    </div>
                ) : (
                    galleryItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden w-[80px] h-[80px]">
                                    <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[5rem]">
                                <div className="font-semibold text-slate-900 text-[15px] leading-tight truncate">
                                    {item.title}
                                </div>
                                <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                                    {item.description}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 border-l border-slate-100 pl-3">
                                <button onClick={() => handleEdit(item)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- ADD/EDIT MODAL --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[550px] w-full p-0 overflow-hidden rounded-2xl">
                    <form onSubmit={handleSubmit} className="w-full block">

                        {/* Header */}
                        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white relative block text-left">
                            <div className="pr-8">
                                <DialogTitle className="text-xl font-semibold text-slate-900 block">
                                    {editing ? 'Edit Gallery Item' : 'Add New Gallery Item'}
                                </DialogTitle>
                                <p className="text-sm text-slate-500 mt-1 block">
                                    {editing ? 'Update the details and image for this item.' : 'Upload an image and provide a title and description.'}
                                </p>
                            </div>
                            <div className="absolute right-4 top-4">
                                <DialogCloseButton onClick={() => setIsModalOpen(false)} />
                            </div>
                        </DialogHeader>

                        {/* Body (Scrollable) */}
                        <div className="px-6 py-6 space-y-6 bg-white max-h-[60vh] overflow-y-auto">
                            {/* Image Upload Section */}
                            <div className="space-y-2.5">
                                <Label className="text-sm font-medium text-slate-700 block">Display Image <span className="text-red-500">*</span></Label>
                                <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} />
                            </div>

                            {/* Details Section */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium text-slate-700 block">Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter a catchy title"
                                        className="w-full focus-visible:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-slate-700 block">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Briefly describe this image..."
                                        className="w-full resize-none focus-visible:ring-blue-500"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                            <div className="flex w-full justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={uploading || createItem.isPending || updateItem.isPending}
                                    className="btn--primary min-w-[120px]"
                                >
                                    {uploading ? 'Uploading...' : editing ? 'Save Changes' : 'Add Item'}
                                </Button>
                            </div>
                        </DialogFooter>

                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}