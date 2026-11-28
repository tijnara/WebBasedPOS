// src/pages/api/contact.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, message, honeypot, store_id } = req.body;
  const targetStoreId = Number(store_id) || 1;

  // Honeypot check
  if (honeypot) {
    return res.status(200).json({ message: 'Success' });
  }

  if (!email || !message) {
    return res.status(400).json({ message: 'Email and message are required' });
  }

  try {
    // 1. Save to Supabase with store_id
    const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{ email, message, store_id: targetStoreId }]);

    if (dbError) {
      console.error('Supabase Error:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details
      });
      return res.status(500).json({ message: 'Database error' });
    }

    // 2. Resolve store name & recipient email for FormSubmit
    let storeName = 'Seaside';
    let recipientEmail = 'aranjitarchita@gmail.com';

    try {
      const { data: storeData } = await supabase
          .from('stores')
          .select('name, branding')
          .eq('id', targetStoreId)
          .maybeSingle();

      if (storeData?.name) storeName = storeData.name;
      if (storeData?.branding?.email) recipientEmail = storeData.branding.email;
    } catch {
      // Fall back to default storeName and recipientEmail
    }

    // 3. Forward to FormSubmit
    const formSubmitResponse = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            email,
            message,
            _subject: `New Message From ${storeName} Contact Form`,
            _captcha: 'false',
            _template: 'table'
          })
        }
    );

    if (!formSubmitResponse.ok) {
      let formSubmitData;
      try {
        formSubmitData = await formSubmitResponse.json();
      } catch {
        formSubmitData = await formSubmitResponse.text();
      }

      console.error('FormSubmit Error:', {
        status: formSubmitResponse.status,
        statusText: formSubmitResponse.statusText,
        data: formSubmitData
      });
    }

    res.status(200).json({ message: 'Message sent and saved successfully' });
  } catch (error) {
    console.error('Contact API Generic Error:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}