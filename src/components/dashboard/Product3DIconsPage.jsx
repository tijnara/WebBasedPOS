// src/components/dashboard/Product3DIconsPage.jsx
import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Plus,
    Trash2,
    Search,
    Upload,
    Link2,
    RotateCcw,
    ShieldAlert,
    CheckCircle2,
    Layers,
    ArrowLeft,
    Wand2,
    Loader2
} from 'lucide-react';
import {
    Button,
    Input,
    Label,
    Select,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogCloseButton
} from '../ui';
import { useStore } from '../../store/useStore';
import {
    useProduct3DAssets,
    useCreateProduct3DAsset,
    useGenerateAI3DIcon,
    useDeleteProduct3DAsset,
    useRestoreBuiltin3DAssets,
    normalize3DIconFile
} from '../../hooks/useProduct3DAssets';
import Product3DVisual from '../pos/Product3DVisual';

const CATEGORIES = [
    'Refills/Services',
    'Containers',
    'Bottled Water',
    'Ice Cubes/Tubes',
    'Accessories'
];

export default function Product3DIconsPage() {
    const user = useStore((s) => s.user);
    const addToast = useStore((s) => s.addToast);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;
        const role = String(
            user.role?.name || user.role || user.position || user.user_type || ''
        )
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager'].some((k) =>
            role.includes(k)
        );
    }, [user]);

    const isDemo = Boolean(user?.isDemo);

    const { data: assets = [], isLoading } = useProduct3DAssets();
    const createAsset = useCreateProduct3DAsset();
    const generateAI3DIcon = useGenerateAI3DIcon();
    const deleteAsset = useDeleteProduct3DAsset();
    const restoreDefaults = useRestoreBuiltin3DAssets();

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Add 3D Icon Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [sourceType, setSourceType] = useState('ai'); // 'ai' | 'upload' | 'url'
    const [label, setLabel] = useState('');
    const [category, setCategory] = useState('Refills/Services');
    const [description, setDescription] = useState('');
    const [suggestedPrice, setSuggestedPrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [normalizedPreview, setNormalizedPreview] = useState(null);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const fileInputRef = useRef(null);

    const filteredAssets = useMemo(() => {
        return assets.filter((item) => {
            if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLabel = String(item.label || '').toLowerCase().includes(q);
                const matchKey = String(item.asset_key || '').toLowerCase().includes(q);
                const matchDesc = String(item.description || '').toLowerCase().includes(q);
                if (!matchLabel && !matchKey && !matchDesc) return false;
            }
            return true;
        });
    }, [assets, categoryFilter, searchQuery]);

    const resetAddForm = () => {
        setSourceType('ai');
        setLabel('');
        setCategory('Refills/Services');
        setDescription('');
        setSuggestedPrice('');
        setImageFile(null);
        setNormalizedPreview(null);
        setImageUrlInput('');
    };

    const handleFilePicked = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const normalizedPng = await normalize3DIconFile(file, 256);
            setImageFile(file);
            setNormalizedPreview(URL.createObjectURL(normalizedPng));
        } catch (err) {
            addToast?.({
                title: 'Image Error',
                description: err.message || 'Could not process image.',
                variant: 'destructive'
            });
        }
    };

    const handleCreateSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!isAdmin || isDemo) return;

        if (!label.trim()) {
            addToast?.({
                title: 'Label Required',
                description: 'Please enter an Icon Label first.',
                variant: 'warning'
            });
            return;
        }

        try {
            if (sourceType === 'ai') {
                await generateAI3DIcon.mutateAsync({
                    label,
                    category,
                    description,
                    suggestedPrice
                });

                addToast?.({
                    title: 'AI 3D Icon Created',
                    description: `"${label}" was generated at 256×256 and saved to your 3D library.`,
                    variant: 'success'
                });
            } else {
                await createAsset.mutateAsync({
                    label,
                    category,
                    description,
                    suggestedPrice,
                    imageFile: sourceType === 'upload' ? imageFile : null,
                    imageUrlInput: sourceType === 'url' ? imageUrlInput : ''
                });

                addToast?.({
                    title: '3D Icon Saved',
                    description: `"${label}" added to the 3D library at uniform 256×256 size.`,
                    variant: 'success'
                });
            }

            setIsAddOpen(false);
            resetAddForm();
        } catch (err) {
            addToast?.({
                title: sourceType === 'ai' ? 'AI Generation Failed' : 'Save Failed',
                description: err.message || 'Could not create 3D icon.',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteAsset = async (asset) => {
        if (!isAdmin || isDemo) return;
        const ok = window.confirm(
            `Delete 3D icon "${asset.label}" from the library?`
        );
        if (!ok) return;

        try {
            await deleteAsset.mutateAsync(asset);
            addToast?.({
                title: '3D Icon Deleted',
                description: `"${asset.label}" was removed from the library.`,
                variant: 'success'
            });
        } catch (err) {
            addToast?.({
                title: 'Delete Failed',
                description: err.message || 'Could not delete 3D icon.',
                variant: 'destructive'
            });
        }
    };

    const handleRestoreDefaults = async () => {
        if (!isAdmin || isDemo) return;
        try {
            await restoreDefaults.mutateAsync();
            addToast?.({
                title: 'Default 3D Icons Restored',
                description: 'All 18 standard Philippine WRS 3D icons are active.',
                variant: 'success'
            });
        } catch (err) {
            addToast?.({
                title: 'Restore Failed',
                description: err.message || 'Could not restore defaults.',
                variant: 'destructive'
            });
        }
    };

    if (!isAdmin) {
        return (
            <div className="max-w-lg mx-auto my-12 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Administrator Access Required
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Only administrators can add or remove 3D product icons from the station library.
                </p>
                <Link
                    href="/product-management"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Product Management</span>
                </Link>
            </div>
        );
    }

    const activePreviewUrl =
        sourceType === 'upload'
            ? normalizedPreview
            : sourceType === 'url'
                ? imageUrlInput.trim() || null
                : null;

    const isSubmitting = createAsset.isPending || generateAI3DIcon.isPending;

    return (
        <div className="space-y-6 py-4 md:py-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8DB600] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-lime-600/20">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                3D Icons &amp; Product Visuals
                            </h1>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-lime-100 dark:bg-lime-950/70 text-[#5f7d00] dark:text-lime-400 border border-lime-300/60 dark:border-lime-800/50">
                                Uniform 1:1 Size (256×256)
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Create (AI or Upload) and manage all 3D product icons here. Every icon is standardized to 256×256 for Product Management and POS.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/product-management"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Products</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleRestoreDefaults}
                        disabled={restoreDefaults.isPending || isDemo}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#8DB600] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Defaults</span>
                    </button>

                    <Button
                        type="button"
                        onClick={() => {
                            resetAddForm();
                            setIsAddOpen(true);
                        }}
                        disabled={isDemo}
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add 3D Icon</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Count Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search 3D icons by name or key..."
                        className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#8DB600]"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['All', ...CATEGORIES].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                categoryFilter === cat
                                    ? 'bg-[#8DB600] text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Uniform 1:1 3D Icon Library Grid */}
            {isLoading && assets.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        No 3D icons found
                    </p>
                    <p className="text-xs text-slate-400">
                        Click &ldquo;Add 3D Icon&rdquo; to generate one with AI or upload a custom visual.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {filteredAssets.map((item) => {
                        const isAI = String(item.asset_key || '').startsWith('ai-');
                        return (
                            <div
                                key={item.id || item.asset_key}
                                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 flex flex-col justify-between items-center text-center shadow-2xs hover:border-[#8DB600] dark:hover:border-lime-500/60 transition-all"
                            >
                                <div className="w-full flex items-center justify-between gap-1">
                                    <span
                                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            isAI
                                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/50'
                                                : item.image_url
                                                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/70 dark:border-cyan-800/50'
                                                    : 'bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200/70 dark:border-lime-800/50'
                                        }`}
                                    >
                                        {isAI ? 'AI 3D' : item.image_url ? 'Custom 3D' : 'Preset 3D'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAsset(item)}
                                        disabled={deleteAsset.isPending || isDemo}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
                                        title="Delete 3D Icon"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="w-20 h-20 my-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                                    <Product3DVisual
                                        assetKey={item.asset_key}
                                        customImageUrl={item.image_url}
                                        className="w-16 h-16"
                                    />
                                </div>

                                <div className="w-full space-y-1">
                                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                        {item.label}
                                    </h3>
                                    <span className="block text-[10px] font-bold text-slate-400">
                                        {item.category}
                                    </span>
                                    <span className="inline-block text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                        1:1 • {item.asset_key}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD NEW 3D ICON / IMAGE MODAL (No <form> tag so native reload cannot occur) */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="p-0 sm:max-w-[560px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                    Add 3D Icon / Product Visual
                                </DialogTitle>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Automatically normalized to a uniform 256×256 square frame.
                                </p>
                            </div>
                            <DialogCloseButton
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
                            />
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Source Switcher */}
                            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSourceType('ai')}
                                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                        sourceType === 'ai'
                                            ? 'bg-gradient-to-r from-[#8DB600] to-emerald-600 text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <Wand2 className="w-3.5 h-3.5" />
                                    <span>Generate with AI</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('upload')}
                                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                        sourceType === 'upload'
                                            ? 'bg-[#8DB600] text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Image</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('url')}
                                    className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                        sourceType === 'url'
                                            ? 'bg-[#8DB600] text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span>Image URL</span>
                                </button>
                            </div>

                            {/* Uniform 1:1 Live Preview + Source Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                <div className="sm:col-span-1 flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-[#8DB600]/60 flex flex-col items-center justify-center p-2 text-center">
                                        {generateAI3DIcon.isPending ? (
                                            <div className="flex flex-col items-center gap-1.5 text-[#659000] dark:text-lime-400">
                                                <Loader2 className="w-7 h-7 animate-spin" />
                                                <span className="text-[10px] font-bold leading-tight">
                                                    Rendering 3D...
                                                </span>
                                            </div>
                                        ) : activePreviewUrl ? (
                                            <Product3DVisual
                                                customImageUrl={activePreviewUrl}
                                                className="w-20 h-20"
                                            />
                                        ) : sourceType === 'ai' ? (
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                <Wand2 className="w-6 h-6 text-[#8DB600]" />
                                                <span className="text-[10px] font-bold leading-tight">
                                                    AI 256×256 Studio
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-400 text-center">
                                                256×256 Preview
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-[#5f7d00] dark:text-lime-400 mt-1.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Uniform 1:1
                                    </span>
                                </div>

                                <div className="sm:col-span-2 space-y-3">
                                    {sourceType === 'ai' && (
                                        <div className="p-3 rounded-xl bg-lime-50/70 dark:bg-lime-950/30 border border-lime-200/80 dark:border-lime-900/50 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                            Enter the <strong>Icon Label</strong> and pick a <strong>Category</strong> below. AI will generate a matching 3D water-station visual and save it at <strong>256×256</strong>.
                                        </div>
                                    )}

                                    {sourceType === 'upload' && (
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Choose 3D PNG / WebP / SVG File
                                            </Label>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFilePicked}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-1.5 w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#8DB600] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Upload className="w-4 h-4 text-[#8DB600]" />
                                                <span className="truncate">
                                                    {imageFile ? imageFile.name : 'Browse 3D Image File...'}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {sourceType === 'url' && (
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                3D Image URL
                                            </Label>
                                            <Input
                                                type="url"
                                                value={imageUrlInput}
                                                onChange={(e) => setImageUrlInput(e.target.value)}
                                                placeholder="https://example.com/3d-water-jug.png"
                                                className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Icon Label <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            placeholder="e.g. 20L Alkaline Container"
                                            className="h-10 mt-1 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Category
                                    </Label>
                                    <Select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Default Price (₱)
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={suggestedPrice}
                                        onChange={(e) => setSuggestedPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-10 mt-1 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Description / Prompt Details (Optional)
                                </Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Clear blue 20L round jug with apple green cap"
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddOpen(false)}
                                disabled={isSubmitting}
                                className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateSubmit}
                                disabled={isSubmitting || isDemo}
                                className="h-10 px-5 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>
                                            {sourceType === 'ai'
                                                ? 'Generating 3D Icon...'
                                                : 'Normalizing & Saving...'}
                                        </span>
                                    </>
                                ) : sourceType === 'ai' ? (
                                    <>
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>Generate &amp; Save 3D Icon</span>
                                    </>
                                ) : (
                                    <span>Save 3D Icon</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}