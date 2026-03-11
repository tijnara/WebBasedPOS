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
import { Image as GalleryIcon } from 'lucide-react';

const ImageUploader = ({ previewUrl, onFileSelect }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };
    return (
        <div onClick={handleDivClick} className="cursor-pointer group relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden">
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-primary transition-colors">
                    <GalleryIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">Upload Image</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
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
            // Assuming a 'gallery' bucket exists for gallery images
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

    // Helper to extract file path from public URL
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
        setUploading(true);
        try {
            let imageUrl = imagePreview;
            let oldImagePath = null;

            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (!uploadedUrl) throw new Error('Image upload failed.');

                imageUrl = uploadedUrl;

                // If editing and a new image is uploaded, delete the old one
                if (editing && editing.image_url && editing.image_url !== imageUrl) {
                    oldImagePath = getFilePathFromUrl(editing.image_url);
                }
            }

            if (editing) {
                await updateItem.mutateAsync({ id: editing.id, title, description, image_url: imageUrl });
                addToast({ title: 'Success', description: 'Gallery item updated successfully' });
                if (oldImagePath) {
                    // Delete old image from storage
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
                // Find the item to get its image_url
                const itemToDelete = galleryItems.find(item => item.id === id);
                await deleteItem.mutateAsync(id);
                addToast({ title: 'Success', description: 'Gallery item deleted successfully' });

                // Delete image from storage if it exists
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gallery Management</h1>
                    <p className="text-slate-500">Manage the images displayed on the landing page</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn--primary">
                    Add New Item
                </Button>
            </div>

            {/* --- DESKTOP TABLE --- */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                                ) : galleryItems.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10">No items found</TableCell></TableRow>
                                ) : (
                                    galleryItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div
                                                    className="rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
                                                    style={{ width: '80px', height: '48px' }}
                                                >
                                                    <img src={item.image_url} alt={item.title} className="object-cover" style={{ width: '100%', height: '100%' }} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="max-w-[300px] truncate">{item.description}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <EditIcon className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                    <DeleteIcon className="w-4 h-4 text-red-600" />
                                                </Button>
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
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-muted p-6">Loading items...</div>
                ) : galleryItems.length === 0 ? (
                    <div className="text-center text-muted p-6 bg-white rounded-lg border border-dashed">
                        No items found
                    </div>
                ) : (
                    galleryItems.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                            <div className="flex-shrink-0">
                                {/* Strict inline sizing container to force thumbnail aspect */}
                                <div
                                    className="rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden"
                                    style={{ width: '80px', height: '80px' }}
                                >
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="object-cover"
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[5rem]">
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between pl-2 border-l border-gray-50 min-h-[5rem]">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 p-1 hover:bg-blue-50 rounded flex items-center justify-center"
                                >
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-500 p-1 hover:bg-red-50 rounded flex items-center justify-center"
                                >
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-0">
                    <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                            <DialogTitle>{editing ? 'Edit Gallery Item' : 'Add Gallery Item'}</DialogTitle>
                            <DialogCloseButton onClick={() => setIsModalOpen(false)} />
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Image</Label>
                                <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
                            <div className="flex w-full justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={uploading || createItem.isPending || updateItem.isPending} className="btn--primary">
                                    {uploading ? 'Uploading...' : editing ? 'Update Item' : 'Add Item'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}