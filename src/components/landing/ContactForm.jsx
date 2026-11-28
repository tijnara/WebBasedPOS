// src/components/landing/ContactForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '../ui.js';
import AnimatedLandingIcon from './AnimatedLandingIcon';

const ContactForm = ({ settings, storeId }) => {
    const [sendTick, setSendTick] = useState(0);
    const [fbTick, setFbTick] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: '',
            message: '',
            honeypot: ''
        }
    });

    const onSubmit = async (data) => {
        if (data.honeypot) {
            return;
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: data.email,
                    message: data.message,
                    store_id: storeId || settings?.store_id || 1
                })
            });

            if (response.ok) {
                alert('Message sent successfully!');
                reset();
            } else {
                throw new Error('Failed to send message');
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Your Email Address
                </label>
                <Input
                    type="email"
                    placeholder="example@email.com"
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                        }
                    })}
                    className={`w-full bg-white h-12 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Message
                </label>
                <Textarea
                    rows={4}
                    placeholder="Write your message here..."
                    {...register('message', {
                        required: 'Message is required',
                        minLength: { value: 10, message: 'Message must be at least 10 characters' },
                        maxLength: { value: 500, message: 'Message must be less than 500 characters' }
                    })}
                    className={`w-full bg-white p-4 ${errors.message ? 'border-red-500' : ''}`}
                />
                {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200 dark:border-slate-800">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    onMouseEnter={() => setSendTick((t) => t + 1)}
                    className="w-full sm:w-auto text-white px-8 py-3 rounded-xl font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                    style={{ backgroundColor: '#8DB600' }}
                >
                    <AnimatedLandingIcon
                        name="mail"
                        size={18}
                        strokeColor="#ffffff"
                        triggerKey={sendTick}
                    />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </Button>

                <a
                    href={settings?.facebook_link || 'https://www.facebook.com/61587059323111/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setFbTick((t) => t + 1)}
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 font-bold transition-colors"
                >
                    <AnimatedLandingIcon
                        name="facebook"
                        size={22}
                        strokeColor="currentColor"
                        triggerKey={fbTick}
                    />
                    <span>Message us on Facebook</span>
                </a>
            </div>
        </form>
    );
};

export default ContactForm;