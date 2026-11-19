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

/**
 * Normalizes any uploaded 3D icon/image file into a uniform 256x256
 * transparent PNG with centered 12% optical padding so every 3D icon/image
 * is identical in size when used in Product Management and POS.
 */
export function normalize3DIconFile(file, targetSize = 256) {
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

                // Uniform 12% optical margin around the centered 3D visual
                const padding = Math.round(targetSize * 0.12);
                const maxBox = targetSize - padding * 2;
                const scale = Math.min(maxBox / img.width, maxBox / img.height);
                const drawW = Math.round(img.width * scale);
                const drawH = Math.round(img.height * scale);
                const dx = Math.round((targetSize - drawW) / 2);
                const dy = Math.round((targetSize - drawH) / 2);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, dx, dy, drawW, drawH);

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

            if (error) {
                return BUILTIN_WRS_3D_ASSETS;
            }
            return Array.isArray(data) ? data : BUILTIN_WRS_3D_ASSETS;
        },
        staleTime: 1000 * 60 * 2
    });

    // Keep Product3DVisual's lookup registry synced with custom DB image URLs
    useEffect(() => {
        if (Array.isArray(query.data)) {
            registerCustom3DAssetsCache(query.data);
        }
    }, [query.data]);

    return query;
}

export function useCreateProduct3DAsset() {
    const queryClient = useQueryClient();
    const currentUser = useStore((s) => s.user);

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

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT_3D_ICON',
                description: `Added 3D icon "${cleanLabel}" (${category})`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-3d-assets'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}

export function useDeleteProduct3DAsset() {
    const queryClient = useQueryClient();
    const currentUser = useStore((s) => s.user);

    return useMutation({
        mutationFn: async (asset) => {
            if (!asset) throw new Error('No 3D icon selected.');

            // Delete from product_3d_assets by id or asset_key
            let query = supabase.from('product_3d_assets').delete();
            if (asset.id) {
                query = query.eq('id', asset.id);
            } else {
                query = query.eq('asset_key', asset.asset_key);
            }

            const { error } = await query;
            if (error) throw error;

            // Clear references on any products using this deleted custom 3D key
            if (asset.asset_key) {
                await supabase
                    .from('products')
                    .update({ icon_3d_key: null })
                    .eq('icon_3d_key', asset.asset_key);
            }

            logActivity({
                user: currentUser,
                action: 'DELETE',
                entity_type: 'PRODUCT_3D_ICON',
                description: `Deleted 3D icon "${asset.label || asset.asset_key}"`
            });

            return asset;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-3d-assets'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}

export function useRestoreBuiltin3DAssets() {
    const queryClient = useQueryClient();
    const currentUser = useStore((s) => s.user);

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

            const { error } = await supabase
                .from('product_3d_assets')
                .upsert(rows, { onConflict: 'asset_key' });

            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT_3D_ICON',
                description: 'Restored default Philippine WRS 3D icon library'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-3d-assets'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}