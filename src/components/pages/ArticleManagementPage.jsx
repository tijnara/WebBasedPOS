// src/components/pages/ArticleManagementPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import {
    useArticles,
    useCreateArticle,
    useUpdateArticle,
    useDeleteArticle,
    useUploadArticleImage
} from '../../hooks/useArticles';
import {
    Button, Card, CardContent, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Textarea, Select
} from '../ui';
import Pagination from '../Pagination';

import {
    Plus, Pencil, Trash2, ExternalLink, Copy, Check,
    FileText, CheckCircle2, Clock, Globe, ShieldAlert, RefreshCw,
    Image as ImageIcon, BookOpen, Layers
} from 'lucide-react';

const ICON_OPTIONS = ['Droplets', 'Shield', 'Sun', 'Snowflake', 'Truck', 'Microscope', 'HeartPulse', 'AlertTriangle', 'BookOpen'];

const ImageUploader = ({ previewUrl, onFileSelect, disabled }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => !disabled && fileInputRef.current.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };
    return (
        <div
            onClick={handleDivClick}
            className={`group relative w-full h-36 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden ${
                disabled ? 'cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-[#8DB600]'
            }`}
        >
            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {!disabled && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-lg">Change Cover Photo</span>
                        </div>
                    )}
                </>
            ) : (
                <div className={`flex flex-col items-center text-slate-400 transition-colors ${!disabled ? 'group-hover:text-[#8DB600]' : ''}`}>
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold">Upload Cover Artwork</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 5MB</span>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
        </div>
    );
};

export default function ArticleManagementPage() {
    const router = useRouter();
    const { addToast, user } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;

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

        return false;
    }, [user]);

    const isDemo = Boolean(user?.isDemo);

    const { data: articles = [], isLoading } = useArticles();
    const createArticle = useCreateArticle();
    const updateArticle = useUpdateArticle();
    const deleteArticle = useDeleteArticle();
    const uploadImage = useUploadArticleImage();

    // Filters & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [copiedSlug, setCopiedSlug] = useState(null);

    // Modal State
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

    const metrics = useMemo(() => {
        const total = articles.length;
        const published = articles.filter(a => a.is_published).length;
        const drafts = total - published;
        return { total, published, drafts };
    }, [articles]);

    const filteredArticles = useMemo(() => {
        return articles.filter(item => {
            const matchesStatus =
                statusFilter === 'all' ? true :
                    statusFilter === 'published' ? item.is_published :
                        !item.is_published;

            const q = searchTerm.toLowerCase().trim();
            const matchesSearch = !q ||
                item.title?.toLowerCase().includes(q) ||
                item.slug?.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [articles, statusFilter, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredArticles.length / itemsPerPage));
    const paginatedArticles = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredArticles.slice(start, start + itemsPerPage);
    }, [filteredArticles, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm font-medium">
                <RefreshCw className="w-5 h-5 animate-spin text-[#8DB600] mr-2" />
                Checking authorization...
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                <p className="text-slate-500 mt-2 text-sm">Administrator privileges are required to view and manage resource articles.</p>
                <Button
                    variant="outline"
                    onClick={() => router.push('/pos')}
                    className="mt-5 rounded-xl border-slate-200"
                >
                    Return to POS
                </Button>
            </div>
        );
    }

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
        setTitle(article.title || '');
        setSlug(article.slug || '');
        setDescription(article.description || '');
        setContent(article.content || '');
        setIconName(article.icon_name || 'BookOpen');
        setIsPublished(Boolean(article.is_published));
        setImagePreview(article.image_url || null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleTitleChange = (e) => {
        const val = e.target.value;
        setTitle(val);
        if (!editing) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    };

    const handleFileSelect = (file) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCopySlug = (articleSlug) => {
        const fullUrl = `${window.location.origin}/articles/${articleSlug}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedSlug(articleSlug);
        addToast({ title: 'Link Copied', description: 'Article URL copied to clipboard.', variant: 'success' });
        setTimeout(() => setCopiedSlug(null), 2500);
    };

    const handleTogglePublish = async (article) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Action disabled in demo.', variant: 'warning' });
        try {
            await updateArticle.mutateAsync({
                id: article.id,
                is_published: !article.is_published,
                updated_at: new Date().toISOString()
            });
            addToast({
                title: !article.is_published ? 'Article Published' : 'Moved to Drafts',
                description: `"${article.title}" status updated.`,
                variant: 'success'
            });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'warning' });
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
            const payload = {
                title: title.trim(),
                slug: slug.trim(),
                description: description.trim(),
                content,
                icon_name: iconName,
                image_url: finalImageUrl,
                is_published: isPublished,
                updated_at: new Date().toISOString()
            };
            if (editing) {
                await updateArticle.mutateAsync({ id: editing.id, ...payload });
                addToast({ title: 'Article Updated', description: `Saved changes to "${title}".`, variant: 'success' });
            } else {
                await createArticle.mutateAsync(payload);
                addToast({ title: 'Article Created', description: `"${title}" has been created.`, variant: 'success' });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            if (!error.message?.includes('Demo Mode')) {
                addToast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };

    const handleDelete = async (article) => {
        if (isDemo) {
            addToast({ title: 'Demo Mode', description: 'Actions are disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!window.confirm(`Delete article "${article.title}"? This cannot be undone.`)) return;
        try {
            await deleteArticle.mutateAsync(article.id);
            addToast({ title: 'Deleted', description: 'Article was removed.', variant: 'success' });
        } catch (error) {
            if (!error.message?.includes('Demo Mode')) {
                addToast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };

    const isSaving = createArticle.isPending || updateArticle.isPending || uploadImage.isPending;

    return (
        <div className="article-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 overflow-x-hidden">
            {/* Header & Primary Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-[#8DB600]" />
                        <span>Resource Articles</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage customer-facing educational guides, health tips, and station SEO content.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        variant="primary"
                        disabled={isDemo}
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>New Article</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Articles</span>
                        <span className="text-xl font-black text-slate-900">{metrics.total}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Published Live</span>
                        <span className="text-xl font-black text-[#5f7d00]">{metrics.published}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-50 text-[#5f7d00] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drafts</span>
                        <span className="text-xl font-black text-slate-600">{metrics.drafts}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Coverage</span>
                        <span className="text-xl font-black text-blue-600">
                            {metrics.total > 0 ? `${Math.round((metrics.published / metrics.total) * 100)}%` : '0%'}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                    <Input
                        placeholder="Search articles by title, description, or slug..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            statusFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All ({metrics.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('published')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                            statusFilter === 'published'
                                ? 'bg-[#8DB600] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>Published</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'published' ? 'bg-[#6f9000] text-white' : 'bg-lime-100 text-[#5f7d00]'}`}>
                            {metrics.published}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('draft')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                            statusFilter === 'draft'
                                ? 'bg-slate-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>Drafts</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'draft' ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {metrics.drafts}
                        </span>
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="w-full overflow-hidden">
                        <table className="w-full table-fixed text-xs divide-y divide-slate-100">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                            <tr>
                                <th className="w-28 py-3 px-3 text-left">Status</th>
                                <th className="py-3 px-3 text-left">Article Details</th>
                                <th className="w-48 py-3 px-3 text-left">URL Slug</th>
                                <th className="w-28 py-3 px-3 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-slate-400 text-xs">
                                        Loading articles...
                                    </td>
                                </tr>
                            ) : paginatedArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-slate-400 text-xs">
                                        No articles found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedArticles.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="w-28 py-3 px-3 align-middle whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePublish(item)}
                                                disabled={isDemo}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 transition-colors ${
                                                    item.is_published
                                                        ? 'bg-lime-50 text-[#5f7d00] border-lime-200 hover:bg-lime-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                }`}
                                                title="Click to toggle status"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.is_published ? 'bg-[#8DB600]' : 'bg-slate-400'}`}></span>
                                                <span>{item.is_published ? 'Published' : 'Draft'}</span>
                                            </button>
                                        </td>

                                        <td className="py-3 px-3 align-middle min-w-0">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = '/seaside.png'; }}
                                                        />
                                                    ) : (
                                                        <BookOpen className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={item.title}>
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5" title={item.description}>
                                                        {item.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="w-48 py-3 px-3 align-middle min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="truncate text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80 font-mono text-[11px] min-w-0 flex-1" title={`/${item.slug}`}>
                                                        /{item.slug}
                                                    </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopySlug(item.slug)}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 transition-colors"
                                                    title="Copy link"
                                                >
                                                    {copiedSlug === item.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>

                                        <td className="w-28 py-3 px-3 text-right align-middle whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={`/articles/${item.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                                    title="Preview live article"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    disabled={isDemo}
                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-30"
                                                    title="Edit article"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    disabled={isDemo}
                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-30"
                                                    title="Delete article"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 border-t border-slate-100 flex justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card List View */}
            <div className="space-y-3 md:hidden">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Loading articles...</div>
                ) : paginatedArticles.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                        No articles found.
                    </div>
                ) : (
                    paginatedArticles.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/seaside.png'; }}
                                            />
                                        ) : (
                                            <BookOpen className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm text-slate-900 leading-snug truncate" title={item.title}>
                                            {item.title}
                                        </h3>
                                        <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
                                            /{item.slug}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleTogglePublish(item)}
                                    disabled={isDemo}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                        item.is_published
                                            ? 'bg-lime-50 text-[#5f7d00] border-lime-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                >
                                    {item.is_published ? 'Published' : 'Draft'}
                                </button>
                            </div>

                            {item.description && (
                                <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    {item.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleCopySlug(item.slug)}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                >
                                    {copiedSlug === item.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                    <span>{copiedSlug === item.slug ? 'Copied' : 'Copy Link'}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <a
                                        href={`/articles/${item.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
                                        title="Preview"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        disabled={isDemo}
                                        className="p-1.5 text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-50"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item)}
                                        disabled={isDemo}
                                        className="p-1.5 text-rose-600 border border-slate-200 rounded-lg hover:bg-rose-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {filteredArticles.length > 0 && (
                    <div className="pt-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    </div>
                )}
            </div>

            {/* EXPANDED FULL-HEIGHT ARTICLE EDITOR MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 w-[95vw] sm:max-w-4xl h-[88vh] bg-white shadow-2xl border-0 overflow-hidden rounded-3xl flex flex-col">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                        {/* Pinned Sticky Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/90 flex-shrink-0 flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#8DB600]" />
                                    <span>{editing ? 'Edit Resource Article' : 'Write New Article'}</span>
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editing ? `Editing "${editing.title}"` : 'Compose a customer health tip or station announcement.'}
                                </p>
                            </div>
                            <DialogCloseButton onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                        </div>

                        {/* Full-Height Scrollable Body */}
                        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
                            {/* Row 1: Details & Artwork */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-3.5">
                                    <div>
                                        <Label htmlFor="title" className="text-xs font-bold text-slate-700">
                                            Article Title <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={handleTitleChange}
                                            required
                                            placeholder="e.g. Why Regular Water Testing Protects Your Family"
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="slug" className="text-xs font-bold text-slate-700">
                                            URL Slug <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="slug"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            required
                                            placeholder="water-testing-protection-guide"
                                            className="h-10 mt-1 text-xs font-mono rounded-xl border-slate-200 bg-slate-50"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="icon" className="text-xs font-bold text-slate-700">Topic Icon</Label>
                                        <Select
                                            id="icon"
                                            value={iconName}
                                            onChange={(e) => setIconName(e.target.value)}
                                            className="h-10 mt-1 text-xs rounded-xl border-slate-200 bg-white"
                                            disabled={isDemo}
                                        >
                                            {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700 block mb-1">Featured Cover Artwork</Label>
                                    <ImageUploader previewUrl={imagePreview} onFileSelect={handleFileSelect} disabled={isDemo} />
                                </div>
                            </div>

                            {/* Row 2: Short SEO Summary */}
                            <div>
                                <Label htmlFor="description" className="text-xs font-bold text-slate-700">
                                    Short Summary / Meta Description <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    placeholder="A concise summary of the article displayed on search engines and social cards..."
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                    disabled={isDemo}
                                />
                            </div>

                            {/* Row 3: Main Article Content */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="content" className="text-xs font-bold text-slate-700">
                                        Article Body Content <span className="text-rose-500">*</span>
                                    </Label>
                                    <span className="text-[10px] text-slate-400 font-mono">HTML tags permitted (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;)</span>
                                </div>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={12}
                                    required
                                    placeholder="Write your article body here..."
                                    className="w-full mt-1 min-h-[220px] text-xs sm:text-sm p-4 border-slate-200 rounded-2xl font-mono focus:border-[#8DB600] leading-relaxed"
                                    disabled={isDemo}
                                />
                            </div>

                            {/* Row 4: Publishing Toggle */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Visibility Setting</span>
                                        <span className="text-[11px] text-slate-500">
                                            {isPublished ? 'This article is live and accessible on the public website.' : 'Saved as a draft. Hidden from the customer-facing blog.'}
                                        </span>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#8DB600] focus:ring-[#8DB600]"
                                        disabled={isDemo}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Published Live</span>
                                </label>
                            </div>
                        </div>

                        {/* Pinned Sticky Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 flex-shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                            >
                                {isSaving ? 'Saving...' : editing ? 'Update Article' : 'Save Article'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}