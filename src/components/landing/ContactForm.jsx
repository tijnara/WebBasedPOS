import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '../ui.js';
import { Facebook } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const ContactForm = ({ settings }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
        mode: 'onBlur',
    });

    const onSubmit = async (data) => {
        // Honeypot check to prevent spam bots
        if (data.honeypot) {
            return;
        }

        try {
            // 1. Save the message to the Supabase database FIRST
            const { error: dbError } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        email: data.email,
                        message: data.message
                    }
                ]);

            // If there's a database error, stop and show it
            if (dbError) {
                console.error('Supabase Database Error:', dbError);
                alert(`Database Error: ${dbError.message}`);
                return; // Stop execution so it doesn't send the email if DB fails
            }

            // 2. If DB save is successful, send the email using FormSubmit
            const response = await fetch("https://formsubmit.co/ajax/aranjitarchita@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: data.email,
                    message: data.message,
                    _subject: "New Message From Seaside Contact Form",
                    _captcha: "false", // Disables the visual captcha challenge
                    _template: "table" // Formats the email nicely
                })
            });

            if (response.ok) {
                alert('Message sent and saved to database successfully!');
                reset();
            } else {
                throw new Error("Failed to send email via FormSubmit");
            }
        } catch (error) {
            console.error(error);
            alert('Failed to send message. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 responsive-page">
            {/* Honeypot field */}
            <div className="hidden">
                <label htmlFor="honeypot">Do not fill this out</label>
                <input type="text" id="honeypot" name="honeypot" {...register('honeypot')} />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email Address</label>
                <Input
                    type="email"
                    placeholder="example@email.com"
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                        },
                    })}
                    className={`w-full bg-white h-12 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <Textarea
                    rows={6}
                    placeholder="Write your message here..."
                    {...register('message', {
                        required: 'Message is required',
                        minLength: { value: 10, message: 'Message must be at least 10 characters' },
                        maxLength: { value: 500, message: 'Message must be less than 500 characters' },
                    })}
                    className={`w-full bg-white p-4 ${errors.message ? 'border-red-500' : ''}`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-white px-10 py-3 rounded-xl font-bold shadow-md" style={{ backgroundColor: '#4CAF50' }}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
                <a
                    href={settings?.facebook_link || "https://www.facebook.com/61587059323111/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                    <Facebook className="w-6 h-6 mr-2" />
                    Message us on Facebook
                </a>
            </div>
        </form>
    );
};

export default ContactForm;