import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, message, honeypot } = req.body;

  // Honeypot check
  if (honeypot) {
    return res.status(200).json({ message: 'Success' });
  }

  if (!email || !message) {
    return res.status(400).json({ message: 'Email and message are required' });
  }

  try {
    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([{ email, message }]);

    if (dbError) {
      console.error('Supabase Error:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
      });
      // Example: Sentry/Axiom integration point
      // if (process.env.NODE_ENV === 'production') {
      //   Sentry.captureException(dbError);
      // }
      return res.status(500).json({ message: 'Database error' });
    }

    // 2. Forward to FormSubmit
    const formSubmitResponse = await fetch("https://formsubmit.co/ajax/aranjitarchita@gmail.com", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        message,
        _subject: "New Message From Seaside Contact Form",
        _captcha: "false",
        _template: "table"
      })
    });

    if (!formSubmitResponse.ok) {
      const formSubmitData = await formSubmitResponse.json();
      console.error('FormSubmit Error:', {
        status: formSubmitResponse.status,
        statusText: formSubmitResponse.statusText,
        data: formSubmitData,
      });
      // Example: Sentry/Axiom integration point
      // if (process.env.NODE_ENV === 'production') {
      //   Sentry.captureMessage('FormSubmit forwarding failed', { extra: formSubmitData });
      // }
      // Even if email fails, we saved to DB, so don't send a 500 to the client
    }

    res.status(200).json({ message: 'Message sent and saved successfully' });
  } catch (error) {
    console.error('Contact API Generic Error:', error);
    // Example: Sentry/Axiom integration point
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}