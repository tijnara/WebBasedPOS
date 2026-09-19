// src/config/constants.js

export const DEBOUNCE_DELAY_MS = 300;
export const DEFAULT_ITEMS_PER_PAGE = 20;
export const CUSTOMER_SEARCH_LIMIT = 10;
export const SALE_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export const FILTER_CONFIG = [
    { id: '10_micron', name: '10 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 57, containersText: '1,000', purpose: 'Traps large rust, dirt, and sand', pcs: 1 },
    { id: '5_micron', name: '5 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 61, containersText: '1,000', purpose: 'Traps medium silt and suspended particles', pcs: 1 },
    { id: '1_micron', name: '1 Micron Sediment', lifespanDays: 28, lifespanWeeks: 4, containerLimit: 1000, cost: 57, containersText: '1,000', purpose: 'Catches ultra-fine particles right before treatment', pcs: 2 },
    { id: 'carbon_block', name: 'Carbon Block (CTO)', lifespanDays: 60, lifespanWeeks: 8, containerLimit: 1500, cost: 243, containersText: '1,500', purpose: 'Absorbs chlorine, bad odors, and improves taste', pcs: 2 }
];
