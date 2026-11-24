// src/pages/api/forgot-password.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function getManilaTimestamp() {
    const now = new Date();
    const manilaDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const manilaTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    // Build Manila-aligned ISO timestamp (+08:00)
    const manilaParts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })
        .format(now)
        .replace(' ', 'T');

    const isoManila = new Date(`${manilaParts}+08:00`).toISOString();
    return { display: `${manilaDate}, ${manilaTime} (PHT)`, isoManila };
}

async function saveToContactMessages({ senderEmail, messageText, isoManila }) {
    // Try common table/column combinations used by Contact Messages
    const attempts = [
        {
            table: 'contact_messages',
            payload: { email: senderEmail, message: messageText, created_at: isoManila }
        },
        {
            table: 'contact_messages',
            payload: { sender_email: senderEmail, message: messageText, created_at: isoManila }
        },
        {
            table: 'messages',
            payload: { email: senderEmail, message: messageText, created_at: isoManila }
        },
        {
            table: 'messages',
            payload: { sender_email: senderEmail, message: messageText, created_at: isoManila }
        }
    ];

    let lastError = null;
    for (const attempt of attempts) {
        const { error } = await supabase.from(attempt.table).insert([attempt.payload]);
        if (!error) {
            return { saved: true, table: attempt.table };
        }
        lastError = error;
    }

    return { saved: false, error: lastError };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, message: 'Method not allowed.' });
    }

    try {
        const { requesterEmail, notes, recipientEmailOverride } = req.body || {};
        const cleanRequester = (requesterEmail || '').trim().toLowerCase();

        if (!cleanRequester) {
            return res.status(400).json({
                ok: false,
                message: 'Please enter the account email or username that needs a reset.'
            });
        }

        // 1. Fetch Admin user id = 1 from public.users
        const { data: adminUser } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', 1)
            .maybeSingle();

        const defaultAdminEmail = adminUser?.email || 'aranjitarchita@gmail.com';
        const targetRecipient = (recipientEmailOverride || defaultAdminEmail).trim();

        // 2. Check if requester matches an account in public.users
        const { data: matchedUser } = await supabase
            .from('users')
            .select('id, name, email, isadmin')
            .ilike('email', cleanRequester)
            .maybeSingle();

        const ts = getManilaTimestamp();
        const matchedLabel = matchedUser
            ? `${matchedUser.name} (User ID #${matchedUser.id})`
            : 'Unverified / Staff Account';

        // Format clean message for the Contact Messages table in Seaside POS
        const inboxMessage = [
            `[FORGOT PASSWORD REQUEST]`,
            `Account: ${cleanRequester} (${matchedLabel})`,
            `Assigned Receiver: ${targetRecipient}`,
            notes?.trim() ? `Note: ${notes.trim()}` : null
        ]
            .filter(Boolean)
            .join(' | ');

        // 3. Save directly to Contact Messages table so it displays in /Messages
        const inboxResult = await saveToContactMessages({
            senderEmail: cleanRequester,
            messageText: inboxMessage,
            isoManila: ts.isoManila
        });

        // 4. Record in activity_logs
        await supabase.from('activity_logs').insert([
            {
                user_id: matchedUser?.id || adminUser?.id || 1,
                action: 'FORGOT_PASSWORD_REQUEST',
                entity_type: 'AUTH',
                description: `Password reset requested by ${cleanRequester} -> sent to ${targetRecipient} & Contact Messages`
            }
        ]);

        // 5. Optional automated email via Resend if RESEND_API_KEY is configured
        const subject = `Seaside POS Password Reset Request — ${cleanRequester}`;
        const emailBody = [
            `Hello ${adminUser?.name || 'Admin'},`,
            '',
            `A password reset request was submitted on Seaside POS and logged to Contact Messages.`,
            `Requester Email: ${cleanRequester}`,
            `Matched User: ${matchedLabel}`,
            `Receiver: ${targetRecipient}`,
            `Requested At: ${ts.display}`,
            notes?.trim() ? `Notes: ${notes.trim()}` : ''
        ]
            .filter(Boolean)
            .join('\n');

        let emailSent = false;
        if (process.env.RESEND_API_KEY && targetRecipient) {
            const fromAddress =
                process.env.RESEND_FROM_EMAIL || 'Seaside POS <onboarding@resend.dev>';
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [targetRecipient],
                    reply_to: cleanRequester,
                    subject,
                    text: emailBody
                })
            });
            emailSent = emailRes.ok;
        }

        if (!inboxResult.saved && !emailSent) {
            return res.status(500).json({
                ok: false,
                message:
                    inboxResult.error?.message ||
                    'Could not save request to Contact Messages. Check table name/grants.'
            });
        }

        return res.status(200).json({
            ok: true,
            savedToMessages: inboxResult.saved,
            emailSent,
            recipient: targetRecipient,
            message: inboxResult.saved
                ? `Password reset request sent! It is now visible in Admin Contact Messages (Receiver: ${targetRecipient}).`
                : `Password reset request emailed to ${targetRecipient}.`
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            message: err?.message || 'Unexpected error processing forgot password request.'
        });
    }
}