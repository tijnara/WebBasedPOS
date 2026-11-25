// src/pages/api/version.js
export default function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const buildId =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.VERCEL_DEPLOYMENT_ID ||
        process.env.NEXT_PUBLIC_BUILD_ID ||
        'local-dev';

    res.status(200).json({
        buildId,
        gitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    });
}