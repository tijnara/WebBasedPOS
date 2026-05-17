import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, useUploadArticleImage } from '../../hooks/useArticles';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Textarea, Select
} from '../ui';
import { EditIcon, DeleteIcon } from '../Icons';
import { Image as ImageIcon } from 'lucide-react';

const ICON_OPTIONS = ['Droplets', 'Shield', 'Sun', 'Snowflake', 'Truck', 'Microscope', 'HeartPulse', 'AlertTriangle', 'BookOpen'];

const ImageUploader = ({ previewUrl, onFileSelect, disabled }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => !disabled && fileInputRef.current.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };
    return (
        <div onClick={handleDivClick} className={`group relative w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden ${disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:border-primary'}`}>
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {!disabled && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm">Change Image</span>
                    </div>}
                </>
            ) : (
                <div className={`flex flex-col items-center text-gray-400 transition-colors ${!disabled && 'group-hover:text-primary'}`}>
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-sm font-medium">Upload Featured Image</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={disabled} />
        </div>
    );
};

export default function ArticleManagementPage() {
    const { addToast, user } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';
    const isDemo = user?.isDemo;

    const { data: articles = [], isLoading } = useArticles();
    const createArticle = useCreateArticle();
    const updateArticle = useUpdateArticle();
    const deleteArticle = useDeleteArticle();
    const uploadImage = useUploadArticleImage();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [iconName, setIconName] = useState('BookOpen');
    const [isPublished, setIsPublished] = useState(false);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    if (!isAdmin) return <div className="p-10 text-center">Access Denied. Admins only.</div>;

    const resetForm = () => {
        setEditing(null);
        setTitle('');
        setSlug('');
        setDescription('');
        setContent('');
        setIconName('BookOpen');
        setIsPublished(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleEdit = (article) => {
        setEditing(article);
        setTitle(article.title);
        setSlug(article.slug);
        setDescription(article.description);
        setContent(article.content);
        setIconName(article.icon_name || 'BookOpen');
        setIsPublished(article.is_published);
        setImagePreview(article.image_url || null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        if (!editing) {
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    };

    const handleFileSelect = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'destructive' });
            return;
        }
        try {
            let finalImageUrl = editing?.image_url || null;
            if (imageFile) {
                const uploadedUrl = await uploadImage.mutateAsync(imageFile);
                if (uploadedUrl) finalImageUrl = uploadedUrl;
                else {
                    addToast({ title: 'Upload Error', description: 'Failed to upload image.', variant: 'destructive' });
                    return;
                }
            }
            const payload = { title, slug, description, content, icon_name: iconName, image_url: finalImageUrl, is_published: isPublished, updated_at: new Date().toISOString() };
            if (editing) {
                await updateArticle.mutateAsync({ id: editing.id, ...payload });
                addToast({ title: 'Success', description: 'Article updated!', variant: 'success' });
            } else {
                await createArticle.mutateAsync(payload);
                addToast({ title: 'Success', description: 'Article created!', variant: 'success' });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            if (!error.message.includes('Demo Mode')) {
                addToast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };

    const handleDelete = async (id) => {
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'destructive' });
            return;
        }
        if (!window.confirm('Are you sure you want to delete this article?')) return;
        try {
            await deleteArticle.mutateAsync(id);
            addToast({ title: 'Deleted', description: 'Article deleted.', variant: 'success' });
        } catch (error) {
            if (!error.message.includes('Demo Mode')) {
                addToast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };
    
    const isSaving = createArticle.isPending || updateArticle.isPending || uploadImage.isPending;

    return (
        <div className="p-6 space-y-6 responsive-page">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Resource Articles</h1>
                    <p className="text-slate-500 text-sm md:text-base">Manage SEO articles and health tips.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn--primary px-4 py-2" disabled={isDemo}>
                    New Article
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow> : articles.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-10">No articles found.</TableCell></TableRow> : articles.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell><span className={`px-2 py-1 rounded text-xs font-bold ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.is_published ? 'Published' : 'Draft'}</span></TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="text-gray-500 font-mono text-sm">/{item.slug}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={isDemo}><EditIcon className="w-4 h-4 text-blue-600" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={isDemo}><DeleteIcon className="w-4 h-4 text-red-600" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="block md:hidden p-4 space-y-4">
                            {isLoading ? <div className="text-center py-10 text-gray-500 font-medium">Loading articles...</div> : articles.length === 0 ? <div className="text-center py-10 text-gray-500 font-medium">No articles found.</div> : articles.map((item) => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.is_published ? 'Published' : 'Draft'}</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={isDemo} className="h-8 w-8 bg-gray-50 border shadow-sm rounded-lg"><EditIcon className="w-4 h-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={isDemo} className="h-8 w-8 bg-gray-50 border shadow-sm rounded-lg"><DeleteIcon className="w-4 h-4 text-red-600" /></Button>
                                        </div>
                                    </div>
                                    <div className="mt-1"><h3 className="font-bold text-slate-900 text-lg leading-tight">{item.title}</h3><p className="text-xs text-slate-500 font-mono mt-2 break-all bg-slate-50 p-2 rounded-md">/{item.slug}</p></div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 w-full !max-w-4xl" style={{ maxWidth: '900px', maxHeight: '85vh' }}>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"><DialogTitle className="text-lg font-bold text-gray-900">{editing ? 'Edit Article' : 'Write New Article'}</DialogTitle><DialogCloseButton onClick={() => setIsModalOpen(false)} /></DialogHeader>
                        <div className="px-6 py-6 space-y-5 overflow-y-auto bg-white" style={{ maxHeight: 'calc(85vh - 140px)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5"><Label htmlFor="title" className="text-sm font-semibold text-gray-700">Article Title</Label><Input id="title" value={title} onChange={handleTitleChange} required className="h-11" disabled={isDemo} /></div>
                                    <div className="space-y-1.5"><Label htmlFor="slug" className="text-sm font-semibold text-gray-700">URL Slug</Label><Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="font-mono text-sm h-11 bg-gray-50" disabled={isDemo} /></div>
                                </div>
                                <div className="space-y-1.5"><Label className="text-sm font-semibold text-gray-700">Featured Image</Label><ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} disabled={isDemo} /></div>
                            </div>
                            <div className="space-y-1.5"><Label htmlFor="description" className="text-sm font-semibold text-gray-700">Short Description (For SEO & Card)</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="h-11" disabled={isDemo} /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5"><Label htmlFor="icon" className="text-sm font-semibold text-gray-700">Card Icon</Label><Select id="icon" value={iconName} onChange={(e) => setIconName(e.target.value)} className="h-11" disabled={isDemo}>{ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}</Select></div>
                                <div className="space-y-2 flex flex-col justify-center pt-5"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" disabled={isDemo} /><span className="font-medium text-gray-700">Publish Immediately</span></label></div>
                            </div>
                            <div className="space-y-1.5"><Label htmlFor="content" className="text-sm font-semibold text-gray-700">Article Content (HTML allowed)</Label><Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={12} required placeholder="<p>Write your article here...</p> You can use HTML tags like <h2>, <strong>, etc." className="w-full text-base p-4 border-gray-300" disabled={isDemo} /></div>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10" style={{ backgroundColor: '#f9fafb' }}>
                            <div className="flex w-full justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 bg-white border-gray-300">Cancel</Button>
                                <Button type="submit" disabled={isSaving || isDemo} className="px-6 btn--primary font-semibold">{isSaving ? 'Saving...' : editing ? 'Update Article' : 'Save Article'}</Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}