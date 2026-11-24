// src/pages/api/forgot-password.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const PH_MOBILE_REGEX = /^\+639\d{9}$/;

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

async function getConfiguredReceiver() {
    const { data: cfg } = await supabase
        .from('forgot_password_config')
        .select('receiver_user_id, receiver_name, receiver_email')
        .eq('id', 1)
        .maybeSingle();

    if (cfg?.receiver_email) {
        return {
            userId: cfg.receiver_user_id || 1,
            name: cfg.receiver_name || 'Administrator',
            email: cfg.receiver_email
        };
    }

    const { data: adminUser } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', 1)
        .maybeSingle();

    return {
        userId: adminUser?.id || 1,
        name: adminUser?.name || 'Aranjit Archita',
        email: adminUser?.email || 'aranjitarchita@gmail.com'
    };
}

async function saveToContactMessages({ senderEmail, messageText, isoManila }) {
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
        if (!error) return { saved: true, table: attempt.table };
        lastError = error;
    }
    return { saved: false, error: lastError };
}

export default async function handler(req, res) {
    // GET: Fetch active receiver
    if (req.method === 'GET') {
        try {
            const receiver = await getConfiguredReceiver();
            return res.status(200).json({ ok: true, receiver });
        } catch (err) {
            return res.status(500).json({
                ok: false,
                message: err?.message || 'Failed to load receiver configuration.'
            });
        }
    }

    // PUT: Update receiver (Admin-only from inside the POS system)
    if (req.method === 'PUT') {
        try {
            const { actorUserId, receiverUserId, receiverName, receiverEmail } = req.body || {};

            if (!actorUserId) {
                return res.status(401).json({ ok: false, message: 'Authentication required.' });
            }

            const { data: actor, error: actorErr } = await supabase
                .from('users')
                .select('id, name, email, isadmin')
                .eq('id', Number(actorUserId))
                .maybeSingle();

            const isActorAdmin =
                actor &&
                (Number(actor.id) === 1 ||
                    actor.isadmin === true ||
                    String(actor.isadmin).toLowerCase() === 'true');

            if (actorErr || !isActorAdmin) {
                return res.status(403).json({
                    ok: false,
                    message: 'Only Administrators can modify the Forgot Password receiver.'
                });
            }

            const cleanEmail = (receiverEmail || '').trim().toLowerCase();
            const cleanName = (receiverName || 'Administrator').trim();

            if (!cleanEmail || !cleanEmail.includes('@')) {
                return res.status(400).json({
                    ok: false,
                    message: 'Please provide a valid receiver email address.'
                });
            }

            const ts = getManilaTimestamp();

            const { error: upsertErr } = await supabase
                .from('forgot_password_config')
                .upsert(
                    [
                        {
                            id: 1,
                            receiver_user_id: receiverUserId ? Number(receiverUserId) : null,
                            receiver_name: cleanName,
                            receiver_email: cleanEmail,
                            updated_by: actor.id,
                            updated_at: ts.isoManila
                        }
                    ],
                    { onConflict: 'id' }
                );

            if (upsertErr) {
                return res.status(500).json({
                    ok: false,
                    message: upsertErr.message || 'Failed to save receiver configuration.'
                });
            }

            await supabase.from('activity_logs').insert([
                {
                    user_id: actor.id,
                    action: 'UPDATE_FORGOT_RECEIVER',
                    entity_type: 'SETTINGS',
                    description: `${actor.name} changed Forgot Password receiver to ${cleanName} (${cleanEmail})`
                }
            ]);

            return res.status(200).json({
                ok: true,
                receiver: {
                    userId: receiverUserId ? Number(receiverUserId) : null,
                    name: cleanName,
                    email: cleanEmail
                },
                message: `Forgot Password receiver updated to ${cleanName} (${cleanEmail}).`
            });
        } catch (err) {
            return res.status(500).json({
                ok: false,
                message: err?.message || 'Unexpected error updating receiver.'
            });
        }
    }

    // POST: Submit Forgot Password request from login form
    if (req.method === 'POST') {
        try {
            const { requesterEmail, requesterPhone, notes } = req.body || {};
            const cleanRequester = (requesterEmail || '').trim().toLowerCase();
            const cleanPhone = (requesterPhone || '').trim();

            if (!cleanRequester) {
                return res.status(400).json({
                    ok: false,
                    message: 'Please enter your account email address.'
                });
            }

            if (!cleanPhone) {
                return res.status(400).json({
                    ok: false,
                    message: 'Phone number is required and cannot be empty.'
                });
            }

            if (!PH_MOBILE_REGEX.test(cleanPhone)) {
                return res.status(400).json({
                    ok: false,
                    message: 'Invalid phone number. Use Philippine format +639XXXXXXXXX (numbers only).'
                });
            }

            const receiver = await getConfiguredReceiver();
            const targetRecipient = receiver.email;

            const { data: matchedUser } = await supabase
                .from('users')
                .select('id, name, email, phone, isadmin')
                .ilike('email', cleanRequester)
                .maybeSingle();

            const ts = getManilaTimestamp();
            const matchedLabel = matchedUser
                ? `${matchedUser.name} (User ID #${matchedUser.id})`
                : 'Unverified / Staff Account';

            const inboxMessage = [
                `[FORGOT PASSWORD REQUEST]`,
                `Account: ${cleanRequester} (${matchedLabel})`,
                `Phone: ${cleanPhone}`,
                `Assigned Receiver: ${receiver.name} (${targetRecipient})`,
                notes?.trim() ? `Note: ${notes.trim()}` : null
            ]
                .filter(Boolean)
                .join(' | ');

            const inboxResult = await saveToContactMessages({
                senderEmail: cleanRequester,
                messageText: inboxMessage,
                isoManila: ts.isoManila
            });

            await supabase.from('activity_logs').insert([
                {
                    user_id: matchedUser?.id || receiver.userId || 1,
                    action: 'FORGOT_PASSWORD_REQUEST',
                    entity_type: 'AUTH',
                    description: `Password reset requested by ${cleanRequester} (${cleanPhone}) -> routed to ${receiver.name} (${targetRecipient})`
                }
            ]);

            let emailSent = false;
            if (process.env.RESEND_API_KEY && targetRecipient) {
                const fromAddress =
                    process.env.RESEND_FROM_EMAIL || 'Seaside POS <onboarding@resend.dev>';
                const subject = `Seaside POS Password Reset Request — ${cleanRequester}`;
                const emailBody = [
                    `Hello ${receiver.name},`,
                    '',
                    `A password reset request was submitted on Seaside POS and logged to Contact Messages.`,
                    `Requester Email: ${cleanRequester}`,
                    `Phone Number: ${cleanPhone}`,
                    `Matched User: ${matchedLabel}`,
                    `Requested At: ${ts.display}`,
                    notes?.trim() ? `Notes: ${notes.trim()}` : ''
                ]
                    .filter(Boolean)
                    .join('\n');

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
                        'Could not save request to Contact Messages. Check table permissions.'
                });
            }

            return res.status(200).json({
                ok: true,
                savedToMessages: inboxResult.saved,
                emailSent,
                recipient: targetRecipient,
                message: `Password reset request sent to ${receiver.name} (${targetRecipient}) and recorded in Contact Messages.`
            });
        } catch (err) {
            return res.status(500).json({
                ok: false,
                message: err?.message || 'Unexpected error processing forgot password request.'
            });
        }
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
}