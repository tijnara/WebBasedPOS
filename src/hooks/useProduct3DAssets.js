// src/hooks/useProduct3DAssets.js
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import {
    BUILTIN_WRS_3D_ASSETS,
    registerCustom3DAssetsCache
} from '../components/pos/Product3DVisual';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

function stripOuterWhiteBackground(ctx, size) {
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const visited = new Uint8Array(size * size);
    const queue = new Int32Array(size * size);
    let head = 0;
    let tail = 0;

    const isNearWhite = (idx) => {
        const p = idx * 4;
        const a = data[p + 3];
        if (a < 15) return true;
        return data[p] >= 242 && data[p + 1] >= 242 && data[p + 2] >= 242;
    };

    const enqueue = (x, y) => {
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const idx = y * size + x;
        if (visited[idx]) return;
        visited[idx] = 1;
        if (isNearWhite(idx)) {
            queue[tail++] = idx;
        }
    };

    for (let i = 0; i < size; i++) {
        enqueue(i, 0);
        enqueue(i, size - 1);
        enqueue(0, i);
        enqueue(size - 1, i);
    }

    while (head < tail) {
        const idx = queue[head++];
        const p = idx * 4;
        data[p + 3] = 0;

        const x = idx % size;
        const y = (idx - x) / size;
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
    }

    ctx.putImageData(imgData, 0, 0);
}

export function normalize3DIconFile(file, targetSize = 256, { stripSolidWhiteBg = false } = {}) {
    return new Promise((resolve, reject) => {
        if (!file || typeof window === 'undefined') {
            reject(new Error('Invalid image file.'));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new window.Image();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, targetSize, targetSize);

                const padding = Math.round(targetSize * 0.12);
                const maxBox = targetSize - padding * 2;
                const srcW = img.naturalWidth || img.width || targetSize;
                const srcH = img.naturalHeight || img.height || targetSize;
                const scale = Math.min(maxBox / srcW, maxBox / srcH);
                const drawW = Math.round(srcW * scale);
                const drawH = Math.round(srcH * scale);
                const dx = Math.round((targetSize - drawW) / 2);
                const dy = Math.round((targetSize - drawH) / 2);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, dx, dy, drawW, drawH);

                if (stripSolidWhiteBg) {
                    stripOuterWhiteBackground(ctx, targetSize);
                }

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(objectUrl);
                        if (!blob) {
                            reject(new Error('Failed to normalize 3D icon image.'));
                            return;
                        }
                        const normalizedFile = new File([blob], 'normalized-3d-icon.png', {
                            type: 'image/png'
                        });
                        resolve(normalizedFile);
                    },
                    'image/png',
                    0.95
                );
            } catch (err) {
                URL.revokeObjectURL(objectUrl);
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not read the selected image file.'));
        };

        img.src = objectUrl;
    });
}

function dataUrlToFile(dataUrl, filename = 'ai-3d-raw.png') {
    const [header, base64Data] = String(dataUrl).split(',');
    const mimeMatch = header.match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
}

export function useProduct3DAssets() {
    const query = useQuery({
        queryKey: ['product-3d-assets'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_3d_assets')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });

            const resolved =
                !error && Array.isArray(data) && data.length > 0
                    ? data
                    : BUILTIN_WRS_3D_ASSETS;

            registerCustom3DAssetsCache(resolved);
            return resolved;
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false
    });

    useEffect(() => {
        if (Array.isArray(query.data)) {
            registerCustom3DAssetsCache(query.data);
        }
    }, [query.data]);

    return query;
}

export function useCreateProduct3DAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               label,
                               category = 'Refills/Services',
                               description = '',
                               suggestedPrice = 0,
                               imageFile = null,
                               imageUrlInput = ''
                           }) => {
            const cleanLabel = String(label || '').trim();
            if (!cleanLabel) throw new Error('3D icon label is required.');

            let finalImageUrl = String(imageUrlInput || '').trim() || null;

            if (imageFile) {
                const normalizedPng = await normalize3DIconFile(imageFile, 256);
                const fileName = `3d-icons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, normalizedPng, {
                        contentType: 'image/png',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const { data: pubData } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);
                finalImageUrl = pubData.publicUrl;
            }

            if (!finalImageUrl) {
                throw new Error('Please upload a 3D icon image or provide an image URL.');
            }

            const slugBase = cleanLabel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 32);
            const assetKey = `custom-${slugBase || 'icon'}-${Date.now().toString(36)}`;

            const { data, error } = await supabase
                .from('product_3d_assets')
                .insert({
                    asset_key: assetKey,
                    label: cleanLabel,
                    category: category || 'Refills/Services',
                    description: String(description || '').trim() || null,
                    image_url: finalImageUrl,
                    is_builtin: false,
                    suggested_price: Number(suggestedPrice) || 0,
                    sort_order: 100,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT_3D_ICON',
                description: `Added 3D icon "${cleanLabel}" (${category})`
            });

            return data;
        },
        onSuccess: (createdAsset) => {
            queryClient.setQueryData(['product-3d-assets'], (old = BUILTIN_WRS_3D_ASSETS) => {
                const next = [...old, createdAsset];
                registerCustom3DAssetsCache(next);
                return next;
            });
        }
    });
}

export function useGenerateAI3DIcon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               label,
                               category = 'Refills/Services',
                               description = '',
                               suggestedPrice = 0
                           }) => {
            const cleanLabel = String(label || '').trim();
            if (!cleanLabel) throw new Error('Enter an Icon Label first.');

            const res = await fetch('/api/generate-3d-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: cleanLabel, category, description })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to generate AI 3D icon.');

            const isSvgDataUrl = String(json.imageDataUrl || '').startsWith('data:image/svg+xml');
            const rawFile = dataUrlToFile(
                json.imageDataUrl,
                isSvgDataUrl ? 'ai-3d-raw.svg' : 'ai-3d-raw.png'
            );

            const normalizedPng = await normalize3DIconFile(rawFile, 256, {
                stripSolidWhiteBg: !isSvgDataUrl
            });

            const fileName = `3d-icons/ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`;
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, normalizedPng, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: pubData } = supabase.storage.from('products').getPublicUrl(fileName);

            const slug = cleanLabel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 28);
            const assetKey = `ai-${slug || 'item'}-${Date.now().toString(36)}`;

            const { data: savedAsset, error: insertError } = await supabase
                .from('product_3d_assets')
                .insert({
                    asset_key: assetKey,
                    label: cleanLabel,
                    category: category || 'Refills/Services',
                    description: String(description || '').trim() || `AI-generated 3D visual for ${category}`,
                    image_url: pubData.publicUrl,
                    is_builtin: false,
                    suggested_price: Number(suggestedPrice) || 0,
                    sort_order: 90,
                    is_active: true
                })
                .select()
                .single();

            if (insertError) throw insertError;

            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT_3D_ICON',
                description: `AI-generated 3D icon "${cleanLabel}" (${category})`
            });

            return savedAsset;
        },
        onSuccess: (savedAsset) => {
            queryClient.setQueryData(['product-3d-assets'], (old = BUILTIN_WRS_3D_ASSETS) => {
                const next = [...old, savedAsset];
                registerCustom3DAssetsCache(next);
                return next;
            });
        }
    });
}

export function useAssignProduct3DIcon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, assetKey }) => {
            const encodedUrl = assetKey ? `3d:${assetKey}` : null;

            const { data, error } = await supabase
                .from('products')
                .update({
                    icon_3d_key: assetKey || null,
                    image_url: encodedUrl
                })
                .eq('id', productId)
                .select()
                .single();

            if (error) {
                const fallback = await supabase
                    .from('products')
                    .update({ image_url: encodedUrl })
                    .eq('id', productId)
                    .select()
                    .single();
                if (fallback.error) throw fallback.error;
                return fallback.data;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}

export function useDeleteProduct3DAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (asset) => {
            if (!asset) throw new Error('No 3D icon selected.');

            let query = supabase.from('product_3d_assets').delete();
            if (asset.id) {
                query = query.eq('id', asset.id);
            } else {
                query = query.eq('asset_key', asset.asset_key);
            }

            const { error } = await query;
            if (error) throw error;

            if (asset.asset_key) {
                await supabase
                    .from('products')
                    .update({ icon_3d_key: null })
                    .eq('icon_3d_key', asset.asset_key);
            }

            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'DELETE',
                entity_type: 'PRODUCT_3D_ICON',
                description: `Deleted 3D icon "${asset.label || asset.asset_key}"`
            });

            return asset;
        },
        onSuccess: (deletedAsset) => {
            queryClient.setQueryData(['product-3d-assets'], (old = []) => {
                const next = old.filter((item) => item.asset_key !== deletedAsset.asset_key);
                registerCustom3DAssetsCache(next);
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}

export function useRestoreBuiltin3DAssets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const rows = BUILTIN_WRS_3D_ASSETS.map((item, idx) => ({
                asset_key: item.asset_key,
                label: item.label,
                category: item.category,
                description: item.description || null,
                image_url: null,
                is_builtin: true,
                suggested_price: Number(item.suggested_price) || 0,
                sort_order: idx + 1,
                is_active: true
            }));

            const { data, error } = await supabase
                .from('product_3d_assets')
                .upsert(rows, { onConflict: 'asset_key' })
                .select();

            if (error) throw error;

            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT_3D_ICON',
                description: 'Restored default Philippine WRS 3D icon library'
            });

            return data || rows;
        },
        onSuccess: (restoredRows) => {
            queryClient.setQueryData(['product-3d-assets'], (old = []) => {
                const customOnly = old.filter((item) => !item.is_builtin && item.image_url);
                const next = [...restoredRows, ...customOnly];
                registerCustom3DAssetsCache(next);
                return next;
            });
        }
    });
}