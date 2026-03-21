// src/components/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { supabase } from '../../lib/supabaseClient';
import {
    Facebook, Droplet, Heart,
    Leaf, ShieldCheck, Menu, X, MessageCircle,
    Image as ImageIcon, MapPin, Truck, GlassWater, Snowflake,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Textarea } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';
import { useStore } from '../../store/useStore';
import { useSettings } from '../../hooks/useSettings';

const ProcessSection = () => {
    const processStages = [
        { stage: '1-3', process: 'Multi-Media Sediment Filtration', description: 'Three layers of specialized media remove sand, silt, rust, and particles down to 40 microns.' },
        { stage: '4', process: 'Dual-Stage Carbon Filter (A)', description: 'High-grade activated carbon removes chlorine and chemical odors.' },
        { stage: '5', process: 'Dual-Stage Carbon Filter (B)', description: 'Second pass ensures complete removal of pesticides and volatile organic compounds (VOCs).' },
        { stage: '6', process: 'Water Softening Resin', description: 'Ion-exchange technology removes calcium and magnesium to prevent "hard water" scale.' },
        { stage: '7', process: 'Fine Sediment Polishing', description: 'A 10-micron filter catches any remaining microscopic debris from the softening stage.' },
        { stage: '8', process: 'Ultra-Fine Polishing', description: 'A 5-micron filter provides a secondary barrier for absolute clarity.' },
        { stage: '9-12', process: 'Reverse Osmosis (RO) Membrane', description: 'The heart of the system. Four high-pressure membranes force water through a 0.0001-micron barrier, removing bacteria, viruses, and heavy metals.' },
        { stage: '13', process: 'Post-Carbon Refinement', description: 'Polishes the taste of the water after RO, giving it a crisp, clean finish.' },
        { stage: '14', process: 'Mineral Enhancement', description: 'Re-introduces essential trace minerals for health and a refreshing natural taste.' },
        { stage: '15', process: 'Micro-Filtration Stage 1', description: 'A 1-micron absolute filter acts as a final physical defense.' },
        { stage: '16', process: 'Micro-Filtration Stage 2', description: 'A 0.5-micron filter ensures even the smallest cysts are removed.' },
        { stage: '17', process: 'Ultraviolet (UV) Sterilization', description: 'High-intensity UV light scrambles the DNA of any lingering microorganisms, rendering them harmless.' },
        { stage: '18', process: 'Ozone Injection', description: 'Powerful O3​ oxidation kills bacteria on contact and ensures the water remains sterile inside the bottle.' },
        { stage: '19', process: 'Final Oxygenation', description: 'Increases dissolved oxygen levels for a lighter, more refreshing mouthfeel.' },
        { stage: '20', process: 'Container Sanitization', description: 'Before filling, every bottle is rinsed with ozonated water to ensure the vessel is as clean as the product.' }
    ];

    return (
        <motion.div id="process" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                            Our 20-Stage Process
                        </h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Pure Water, Guaranteed in Labrador, Pangasinan</p>
                </div>
                <div className="relative">
                    <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-green-200 h-full rounded-full"></div>
                    <div className="space-y-12">
                        {processStages.map((item, index) => (
                            <div key={index} className="relative flex items-center" style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}>
                                <div className="w-1/2 px-4">
                                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/30">
                                        <h3 className="text-lg font-bold text-green-800">{item.process}</h3>
                                        <p className="text-sm text-slate-700">{item.description}</p>
                                    </div>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center text-green-900 font-bold border-4 border-white shadow-lg">
                                    {item.stage}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Custom component to safely load Adsterra in React/Next.js
const AdsterraBanner = () => {
    const bannerRef = React.useRef(null);

    React.useEffect(() => {
        // Check if the script is already appended to prevent duplicates on re-renders
        if (bannerRef.current && !bannerRef.current.firstChild) {
            const conf = document.createElement('script');
            conf.type = 'text/javascript';
            conf.innerHTML = `
                atOptions = {
                    'key' : 'c5677f34756199760394679363f2f373',
                    'format' : 'iframe',
                    'height' : 50,
                    'width' : 320,
                    'params' : {}
                };
            `;
            
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = "https://www.highperformanceformat.com/c5677f34756199760394679363f2f373/invoke.js";
            
            bannerRef.current.appendChild(conf);
            bannerRef.current.appendChild(script);
        }
    }, []);

    return <div ref={bannerRef} className="flex justify-center w-full min-h-[50px]"></div>;
};

const SeasideWaterLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: galleryItems = [] } = useGallery();
    const user = useStore(state => state.user);
    const { data: settings } = useSettings();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [viewCount, setViewCount] = useState(null);

    useEffect(() => {
        const initCounter = async () => {
            if (!sessionStorage.getItem('has_viewed_seaside')) {
                const { data, error } = await supabase.rpc('increment_page_view');
                if (!error && data !== null) {
                    setViewCount(data);
                    sessionStorage.setItem('has_viewed_seaside', 'true');

                    await supabase.from('page_views_log').insert([{ viewed_at: new Date().toISOString() }]);
                }
            } else {
                const { data, error } = await supabase.rpc('get_page_views');
                if (!error && data !== null) {
                    setViewCount(data);
                }
            }
        };
        initCounter();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            setShowScrollTop(scrolled > 400);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (galleryItems.length <= 1 || isLightboxOpen) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [galleryItems.length, isLightboxOpen]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="relative min-h-screen w-full font-sans text-slate-800">
            <div className="fixed inset-0 -z-10">
                <Image
                    src="/seaside_bg2.png"
                    alt="Seaside background"
                    layout="fill"
                    objectFit="cover"
                    priority
                />
            </div>
            <Head>
                {!user && <meta name="google-adsense-account" content="ca-pub-3607213315862760" />}
                <title>Seaside Purified Water Refilling Station | Labrador, Pangasinan</title>
                <meta name="description" content="Seaside offers 21-stage purified water, walk-in refills, and reliable door-to-door water delivery in Labrador, Pangasinan. Pure water, pure trust." />
                <meta name="keywords" content="water refilling station, Labrador Pangasinan, water delivery, purified water, Seaside water, ice tubes, alkaline water" />
                <meta property="og:title" content="Seaside Water Refilling Station | Labrador" />
                <meta property="og:description" content="Fast, clean, and reliable water delivery in Labrador, Pangasinan. Your family's health, flowing crystal clear." />
                <meta property="og:image" content="https://seasidepos.vercel.app/seasideHD_.png" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_PH" />
                <meta property="og:site_name" content="Seaside" />
            </Head>

            {/* Load Google AdSense and Ad Blocking Recovery if user is NOT logged in */}
            {!user && (
                <>
                    {/* 1. Main AdSense Script */}
                    <Script
                        id="adsense-init"
                        async
                        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3607213315862760"
                        crossOrigin="anonymous"
                        strategy="lazyOnload" 
                    />

                    {/* 2. Ad Blocking Recovery Tag */}
                    <Script
                        id="fundingchoices-messages"
                        async
                        src="https://fundingchoicesmessages.google.com/i/pub-3607213315862760?ers=1"
                        strategy="lazyOnload"
                    />
                    
                    {/* 3. Ad Blocking Signal Script */}
                    <Script
                        id="fundingchoices-signal"
                        strategy="lazyOnload"
                        dangerouslySetInnerHTML={{
                            __html: `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`
                        }}
                    />

                    {/* 4. Optional Error Protection Message */}
                    <Script
                        id="fundingchoices-error-protection"
                        strategy="lazyOnload"
                        dangerouslySetInnerHTML={{
                            __html: `(function(){'use strict';function aa(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}var ba=typeof Object.defineProperties=="function"?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;a[b]=c.value;return a};function ca(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");}var da=ca(this);function l(a,b){if(b)a:{var c=da;a=a.split(".");for(var d=0;d<a.length-1;d++){var e=a[d];if(!(e in c))break a;c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&b!=null&&ba(c,a,{configurable:!0,writable:!0,value:b})}}function ea(a){return a.raw=a}function n(a){var b=typeof Symbol!="undefined"&&Symbol.iterator&&a[Symbol.iterator];if(b)return b.call(a);if(typeof a.length=="number")return{next:aa(a)};throw Error(String(a)+" is not an iterable or ArrayLike");}function fa(a){for(var b,c=[];!(b=a.next()).done;)c.push(b.value);return c}var ha=typeof Object.create=="function"?Object.create:function(a){function b(){}b.prototype=a;return new b},p;if(typeof Object.setPrototypeOf=="function")p=Object.setPrototypeOf;else{var q;a:{var ja={a:!0},ka={};try{ka.__proto__=ja;q=ka.a;break a}catch(a){}q=!1}p=q?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var la=p;function t(a,b){a.prototype=ha(b.prototype);a.prototype.constructor=a;if(la)la(a,b);else for(var c in b)if(c!="prototype")if(Object.defineProperties){var d=Object.getOwnPropertyDescriptor(b,c);d&&Object.defineProperty(a,c,d)}else a[c]=b[c];a.A=b.prototype}function ma(){for(var a=Number(this),b=[],c=a;c<arguments.length;c++)b[c-a]=arguments[c];return b}l("Object.is",function(a){return a?a:function(b,c){return b===c?b!==0||1/b===1/c:b!==b&&c!==c}});l("Array.prototype.includes",function(a){return a?a:function(b,c){var d=this;d instanceof String&&(d=String(d));var e=d.length;c=c||0;for(c<0&&(c=Math.max(c+e,0));c<e;c++){var f=d[c];if(f===b||Object.is(f,b))return!0}return!1}});l("String.prototype.includes",function(a){return a?a:function(b,c){if(this==null)throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");return this.indexOf(b,c||0)!==-1}});l("Number.MAX_SAFE_INTEGER",function(){return 9007199254740991});l("Number.isFinite",function(a){return a?a:function(b){return typeof b!=="number"?!1:!isNaN(b)&&b!==Infinity&&b!==-Infinity}});l("Number.isInteger",function(a){return a?a:function(b){return Number.isFinite(b)?b===Math.floor(b):!1}});l("Number.isSafeInteger",function(a){return a?a:function(b){return Number.isInteger(b)&&Math.abs(b)<=Number.MAX_SAFE_INTEGER}});l("Math.trunc",function(a){return a?a:function(b){b=Number(b);if(isNaN(b)||b===Infinity||b===-Infinity||b===0)return b;var c=Math.floor(Math.abs(b));return b<0?-c:c}});var u=this||self;function v(a,b){a:{var c=["CLOSURE_FLAGS"];for(var d=u,e=0;e<c.length;e++)if(d=d[c[e]],d==null){c=null;break a}c=d}a=c&&c[a];return a!=null?a:b}function w(a){return a};function na(a){u.setTimeout(function(){throw a;},0)};var oa=v(610401301,!1),pa=v(188588736,!0),qa=v(645172343,v(1,!0));var x,ra=u.navigator;x=ra?ra.userAgentData||null:null;function z(a){return oa?x?x.brands.some(function(b){return(b=b.brand)&&b.indexOf(a)!=-1}):!1:!1}function A(a){var b;a:{if(b=u.navigator)if(b=b.userAgent)break a;b=""}return b.indexOf(a)!=-1};function B(){return oa?!!x&&x.brands.length>0:!1}function C(){return B()?z("Chromium"):(A("Chrome")||A("CriOS"))&&!(B()?0:A("Edge"))||A("Silk")};var sa=B()?!1:A("Trident")||A("MSIE");!A("Android")||C();C();A("Safari")&&(C()||(B()?0:A("Coast"))||(B()?0:A("Opera"))||(B()?0:A("Edge"))||(B()?z("Microsoft Edge"):A("Edg/"))||B()&&z("Opera"));var ta={},D=null;var ua=typeof Uint8Array!=="undefined",va=!sa&&typeof btoa==="function";var wa;function E(){return typeof BigInt==="function"};var F=typeof Symbol==="function"&&typeof Symbol()==="symbol";function xa(a){return typeof Symbol==="function"&&typeof Symbol()==="symbol"?Symbol():a}var G=xa(),ya=xa("2ex");var za=F?function(a,b){a[G]|=b}:function(a,b){a.g!==void 0?a.g|=b:Object.defineProperties(a,{g:{value:b,configurable:!0,writable:!0,enumerable:!1}})},H=F?function(a){return a[G]|0}:function(a){return a.g|0},I=F?function(a){return a[G]}:function(a){return a.g},J=F?function(a,b){a[G]=b}:function(a,b){a.g!==void 0?a.g=b:Object.defineProperties(a,{g:{value:b,configurable:!0,writable:!0,enumerable:!1}})};function Aa(a,b){J(b,(a|0)&-14591)}function Ba(a,b){J(b,(a|34)&-14557)};var K={},Ca={};function Da(a){return!(!a||typeof a!=="object"||a.g!==Ca)}function Ea(a){return a!==null&&typeof a==="object"&&!Array.isArray(a)&&a.constructor===Object}function L(a,b,c){if(!Array.isArray(a)||a.length)return!1;var d=H(a);if(d&1)return!0;if(!(b&&(Array.isArray(b)?b.includes(c):b.has(c))))return!1;J(a,d|1);return!0};var M=0,N=0;function Fa(a){var b=a>>>0;M=b;N=(a-b)/4294967296>>>0}function Ga(a){if(a<0){Fa(-a);var b=n(Ha(M,N));a=b.next().value;b=b.next().value;M=a>>>0;N=b>>>0}else Fa(a)}function Ia(a,b){b>>>=0;a>>>=0;if(b<=2097151)var c=""+(4294967296*b+a);else E()?c=""+(BigInt(b)<<BigInt(32)|BigInt(a)):(c=(a>>>24|b<<8)&16777215,b=b>>16&65535,a=(a&16777215)+c*6777216+b*6710656,c+=b*8147497,b*=2,a>=1E7&&(c+=a/1E7>>>0,a%=1E7),c>=1E7&&(b+=c/1E7>>>0,c%=1E7),c=b+Ja(c)+Ja(a));return c}function Ja(a){a=String(a);return"0000000".slice(a.length)+a}function Ha(a,b){b=~b;a?a=~a+1:b+=1;return[a,b]};var Ka=/^-?([1-9][0-9]*|0)(\\.[0-9]+)?$/;var O;function La(a,b){O=b;a=new a(b);O=void 0;return a}function P(a,b,c){a==null&&(a=O);O=void 0;if(a==null){var d=96;c?(a=[c],d|=512):a=[];b&&(d=d&-16760833|(b&1023)<<14)}else{if(!Array.isArray(a))throw Error("narr");d=H(a);if(d&2048)throw Error("farr");if(d&64)return a;d|=64;if(c&&(d|=512,c!==a[0]))throw Error("mid");a:{c=a;var e=c.length;if(e){var f=e-1;if(Ea(c[f])){d|=256;b=f-(+!!(d&512)-1);if(b>=1024)throw Error("pvtlmt");d=d&-16760833|(b&1023)<<14;break a}}if(b){b=Math.max(b,e-(+!!(d&512)-1));if(b>1024)throw Error("spvt");d=d&-16760833|(b&1023)<<14}}}J(a,d);return a};function Ma(a){switch(typeof a){case "number":return isFinite(a)?a:String(a);case "boolean":return a?1:0;case "object":if(a)if(Array.isArray(a)){if(L(a,void 0,0))return}else if(ua&&a!=null&&a instanceof Uint8Array){if(va){for(var b="",c=0,d=a.length-10240;c<d;)b+=String.fromCharCode.apply(null,a.subarray(c,c+=10240));b+=String.fromCharCode.apply(null,c?a.subarray(c):a);a=btoa(b)}else{b===void 0&&(b=0);if(!D){D={};c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");d=["+/=","+/","-_=","-_.","-_"];for(var e=0;e<5;e++){var f=c.concat(d[e].split(""));ta[e]=f;for(var g=0;g<f.length;g++){var h=f[g];D[h]===void 0&&(D[h]=g)}}}b=ta[b];c=Array(Math.floor(a.length/3));d=b[64]||"";for(e=f=0;f<a.length-2;f+=3){var k=a[f],m=a[f+1];h=a[f+2];g=b[k>>2];k=b[(k&3)<<4|m>>4];m=b[(m&15)<<2|h>>6];h=b[h&63];c[e++]=g+k+m+h}g=0;h=d;switch(a.length-f){case 2:g=a[f+1],h=b[(g&15)<<2]||d;case 1:a=a[f],c[e]=b[a>>2]+b[(a&3)<<4|g>>4]+h+d}a=c.join("")}return a}}return a};function Na(a,b,c){a=Array.prototype.slice.call(a);var d=a.length,e=b&256?a[d-1]:void 0;d+=e?-1:0;for(b=b&512?1:0;b<d;b++)a[b]=c(a[b]);if(e){b=a[b]={};for(var f in e)Object.prototype.hasOwnProperty.call(e,f)&&(b[f]=c(e[f]))}return a}function Oa(a,b,c,d,e){if(a!=null){if(Array.isArray(a))a=L(a,void 0,0)?void 0:e&&H(a)&2?a:Pa(a,b,c,d!==void 0,e);else if(Ea(a)){var f={},g;for(g in a)Object.prototype.hasOwnProperty.call(a,g)&&(f[g]=Oa(a[g],b,c,d,e));a=f}else a=b(a,d);return a}}function Pa(a,b,c,d,e){var f=d||c?H(a):0;d=d?!!(f&32):void 0;a=Array.prototype.slice.call(a);for(var g=0;g<a.length;g++)a[g]=Oa(a[g],b,c,d,e);c&&c(f,a);return a}function Qa(a){return a.s===K?a.toJSON():Ma(a)};function Ra(a,b,c){c=c===void 0?Ba:c;if(a!=null){if(ua&&a instanceof Uint8Array)return b?a:new Uint8Array(a);if(Array.isArray(a)){var d=H(a);if(d&2)return a;b&&(b=d===0||!!(d&32)&&!(d&64||!(d&16)));return b?(J(a,(d|34)&-12293),a):Pa(a,Ra,d&4?Ba:c,!0,!0)}a.s===K&&(c=a.h,d=I(c),a=d&2?a:La(a.constructor,Sa(c,d,!0)));return a}}function Sa(a,b,c){var d=c||b&2?Ba:Aa,e=!!(b&32);a=Na(a,b,function(f){return Ra(f,e,d)});za(a,32|(c?2:0));return a};function Ta(a,b){a=a.h;return Ua(a,I(a),b)}function Va(a,b,c,d){b=d+(+!!(b&512)-1);if(!(b<0||b>=a.length||b>=c))return a[b]}function Ua(a,b,c,d){if(c===-1)return null;var e=b>>14&1023||536870912;if(c>=e){if(b&256)return a[a.length-1][c]}else{var f=a.length;if(d&&b&256&&(d=a[f-1][c],d!=null)){if(Va(a,b,e,c)&&ya!=null){var g;a=(g=wa)!=null?g:wa={};g=a[ya]||0;g>=4||(a[ya]=g+1,g=Error(),g.__closure__error__context__984382||(g.__closure__error__context__984382={}),g.__closure__error__context__984382.severity="incident",na(g))}return d}return Va(a,b,e,c)}}function Wa(a,b,c,d,e){var f=b>>14&1023||536870912;if(c>=f||e&&!qa){var g=b;if(b&256)e=a[a.length-1];else{if(d==null)return;e=a[f+(+!!(b&512)-1)]={};g|=256}e[c]=d;c<f&&(a[c+(+!!(b&512)-1)]=void 0);g!==b&&J(a,g)}else a[c+(+!!(b&512)-1)]=d,b&256&&(a=a[a.length-1],c in a&&delete a[c])}function Xa(a,b){var c=Ya;var d=d===void 0?!1:d;var e=a.h;var f=I(e),g=Ua(e,f,b,d);if(g!=null&&typeof g==="object"&&g.s===K)c=g;else if(Array.isArray(g)){var h=H(g),k=h;k===0&&(k|=f&32);k|=f&2;k!==h&&J(g,k);c=new c(g)}else c=void 0;c!==g&&c!=null&&Wa(e,f,b,c,d);e=c;if(e==null)return e;a=a.h;f=I(a);f&2||(g=e,c=g.h,h=I(c),g=h&2?La(g.constructor,Sa(c,h,!1)):g,g!==e&&(e=g,Wa(a,f,b,e,d)));return e}function Za(a,b){a=Ta(a,b);return a==null||typeof a==="string"?a:void 0}function $a(a,b){var c=c===void 0?0:c;a=Ta(a,b);if(a!=null)if(b=typeof a,b==="number"?Number.isFinite(a):b!=="string"?0:Ka.test(a))if(typeof a==="number"){if(a=Math.trunc(a),!Number.isSafeInteger(a)){Ga(a);b=M;var d=N;if(a=d&2147483648)b=~b+1>>>0,d=~d>>>0,b==0&&(d=d+1>>>0);b=d*4294967296+(b>>>0);a=a?-b:b}}else if(b=Math.trunc(Number(a)),Number.isSafeInteger(b))a=String(b);else{if(b=a.indexOf("."),b!==-1&&(a=a.substring(0,b)),!(a[0]==="-"?a.length<20||a.length===20&&Number(a.substring(0,7))>-922337:a.length<19||a.length===19&&Number(a.substring(0,6))<922337)){if(a.length<16)Ga(Number(a));else if(E())a=BigInt(a),M=Number(a&BigInt(4294967295))>>>0,N=Number(a>>BigInt(32)&BigInt(4294967295));else{b=+(a[0]==="-");N=M=0;d=a.length;for(var e=b,f=(d-b)%6+b;f<=d;e=f,f+=6)e=Number(a.slice(e,f)),N*=1E6,M=M*1E6+e,M>=4294967296&&(N+=Math.trunc(M/4294967296),N>>>=0,M>>>=0);b&&(b=n(Ha(M,N)),a=b.next().value,b=b.next().value,M=a,N=b)}a=M;b=N;b&2147483648?E()?a=""+(BigInt(b|0)<<BigInt(32)|BigInt(a>>>0)):(b=n(Ha(a,b)),a=b.next().value,b=b.next().value,a="-"+Ia(a,b)):a=Ia(a,b)}}else a=void 0;return a!=null?a:c}function R(a,b){var c=c===void 0?"":c;a=Za(a,b);return a!=null?a:c};var S;function T(a,b,c){this.h=P(a,b,c)}T.prototype.toJSON=function(){return ab(this)};T.prototype.s=K;T.prototype.toString=function(){try{return S=!0,ab(this).toString()}finally{S=!1}};function ab(a){var b=S?a.h:Pa(a.h,Qa,void 0,void 0,!1);var c=!S;var d=pa?void 0:a.constructor.v;var e=I(c?a.h:b);if(a=b.length){var f=b[a-1],g=Ea(f);g?a--:f=void 0;e=+!!(e&512)-1;var h=b;if(g){b:{var k=f;var m={};g=!1;if(k)for(var r in k)if(Object.prototype.hasOwnProperty.call(k,r))if(isNaN(+r))m[r]=k[r];else{var y=k[r];Array.isArray(y)&&(L(y,d,+r)||Da(y)&&y.size===0)&&(y=null);y==null&&(g=!0);y!=null&&(m[r]=y)}if(g){for(var Q in m)break b;m=null}else m=k}k=m==null?f!=null:m!==f}for(var ia;a>0;a--){Q=a-1;r=h[Q];Q-=e;if(!(r==null||L(r,d,Q)||Da(r)&&r.size===0))break;ia=!0}if(h!==b||k||ia){if(!c)h=Array.prototype.slice.call(h,0,a);else if(ia||k||m)h.length=a;m&&h.push(m)}b=h}return b};function bb(a){return function(b){if(b==null||b=="")b=new a;else{b=JSON.parse(b);if(!Array.isArray(b))throw Error("dnarr");za(b,32);b=La(a,b)}return b}};function cb(a){this.h=P(a)}t(cb,T);var db=bb(cb);var U;function V(a){this.g=a}V.prototype.toString=function(){return this.g+""};var eb={};function fb(a){if(U===void 0){var b=null;var c=u.trustedTypes;if(c&&c.createPolicy){try{b=c.createPolicy("goog#html",{createHTML:w,createScript:w,createScriptURL:w})}catch(d){u.console&&u.console.error(d.message)}U=b}else U=b}a=(b=U)?b.createScriptURL(a):a;return new V(a,eb)};function gb(a){var b=ma.apply(1,arguments);if(b.length===0)return fb(a[0]);for(var c=a[0],d=0;d<b.length;d++)c+=encodeURIComponent(b[d])+a[d+1];return fb(c)};function hb(a,b){a.src=b instanceof V&&b.constructor===V?b.g:"type_error:TrustedResourceUrl";var c,d;(c=(b=(d=(c=(a.ownerDocument&&a.ownerDocument.defaultView||window).document).querySelector)==null?void 0:d.call(c,"script[nonce]"))?b.nonce||b.getAttribute("nonce")||"":"")&&a.setAttribute("nonce",c)};function ib(){return Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)};function jb(a,b){b=String(b);a.contentType==="application/xhtml+xml"&&(b=b.toLowerCase());return a.createElement(b)}function kb(a){this.g=a||u.document||document};function lb(a){a=a===void 0?document:a;return a.createElement("script")};function mb(a,b,c,d,e,f){try{var g=a.g,h=lb(g);h.async=!0;hb(h,b);g.head.appendChild(h);h.addEventListener("load",function(){e();d&&g.head.removeChild(h)});h.addEventListener("error",function(){c>0?mb(a,b,c-1,d,e,f):(d&&g.head.removeChild(h),f())})}catch(k){f()}};var nb=u.atob("aHR0cHM6Ly93d3cuZ3N0YXRpYy5jb20vaW1hZ2VzL2ljb25zL21hdGVyaWFsL3N5c3RlbS8xeC93YXJuaW5nX2FtYmVyXzI0ZHAucG5n"),ob=u.atob("WW91IGFyZSBzZWVpbmcgdGhpcyBtZXNzYWdlIGJlY2F1c2UgYWQgb3Igc2NyaXB0IGJsb2NraW5nIHNvZnR3YXJlIGlzIGludGVyZmVyaW5nIHdpdGggdGhpcyBwYWdlLg=="),pb=u.atob("RGlzYWJsZSBhbnkgYWQgb3Igc2NyaXB0IGJsb2NraW5nIHNvZnR3YXJlLCB0aGVuIHJlbG9hZCB0aGlzIHBhZ2Uu");function qb(a,b,c){this.i=a;this.u=b;this.o=c;this.g=null;this.j=[];this.m=!1;this.l=new kb(this.i)}function rb(a){if(a.i.body&&!a.m){var b=function(){sb(a);u.setTimeout(function(){tb(a,3)},50)};mb(a.l,a.u,2,!0,function(){u[a.o]||b()},b);a.m=!0}}function sb(a){for(var b=W(1,5),c=0;c<b;c++){var d=X(a);a.i.body.appendChild(d);a.j.push(d)}b=X(a);b.style.bottom="0";b.style.left="0";b.style.position="fixed";b.style.width=W(100,110).toString()+"%";b.style.zIndex=W(2147483544,2147483644).toString();b.style.backgroundColor=ub(249,259,242,252,219,229);b.style.boxShadow="0 0 12px #888";b.style.color=ub(0,10,0,10,0,10);b.style.display="flex";b.style.justifyContent="center";b.style.fontFamily="Roboto, Arial";c=X(a);c.style.width=W(80,85).toString()+"%";c.style.maxWidth=W(750,775).toString()+"px";c.style.margin="24px";c.style.display="flex";c.style.alignItems="flex-start";c.style.justifyContent="center";d=jb(a.l.g,"IMG");d.className=ib();d.src=nb;d.alt="Warning icon";d.style.height="24px";d.style.width="24px";d.style.paddingRight="16px";var e=X(a),f=X(a);f.style.fontWeight="bold";f.textContent=ob;var g=X(a);g.textContent=pb;Y(a,e,f);Y(a,e,g);Y(a,c,d);Y(a,c,e);Y(a,b,c);a.g=b;a.i.body.appendChild(a.g);b=W(1,5);for(c=0;c<b;c++)d=X(a),a.i.body.appendChild(d),a.j.push(d)}function Y(a,b,c){for(var d=W(1,5),e=0;e<d;e++){var f=X(a);b.appendChild(f)}b.appendChild(c);c=W(1,5);for(d=0;d<c;d++)e=X(a),b.appendChild(e)}function W(a,b){return Math.floor(a+Math.random()*(b-a))}function ub(a,b,c,d,e,f){return"rgb("+W(Math.max(a,0),Math.min(b,255)).toString()+","+W(Math.max(c,0),Math.min(d,255)).toString()+","+W(Math.max(e,0),Math.min(f,255)).toString()+")"}function X(a){a=jb(a.l.g,"DIV");a.className=ib();return a}function tb(a,b){b<=0||a.g!=null&&a.g.offsetHeight!==0&&a.g.offsetWidth!==0||(vb(a),sb(a),u.setTimeout(function(){tb(a,b-1)},50))}function vb(a){for(var b=n(a.j),c=b.next();!c.done;c=b.next())(c=c.value)&&c.parentNode&&c.parentNode.removeChild(c);a.j=[];(b=a.g)&&b.parentNode&&b.parentNode.removeChild(b);a.g=null};function wb(a,b,c,d,e){function f(k){document.body?g(document.body):k>0?u.setTimeout(function(){f(k-1)},e):b()}function g(k){k.appendChild(h);u.setTimeout(function(){h?(h.offsetHeight!==0&&h.offsetWidth!==0?b():a(),h.parentNode&&h.parentNode.removeChild(h)):a()},d)}var h=xb(c);f(3)}function xb(a){var b=document.createElement("div");b.className=a;b.style.width="1px";b.style.height="1px";b.style.position="absolute";b.style.left="-10000px";b.style.top="-10000px";b.style.zIndex="-10000";return b};function Ya(a){this.h=P(a)}t(Ya,T);function yb(a){this.h=P(a)}t(yb,T);var zb=bb(yb);function Ab(a){if(!a)return null;a=Za(a,4);var b;a===null||a===void 0?b=null:b=fb(a);return b};var Bb=ea([""]),Cb=ea([""]);function Db(a,b){this.m=a;this.o=new kb(a.document);this.g=b;this.j=R(this.g,1);this.u=Ab(Xa(this.g,2))||gb(Bb);this.i=!1;b=Ab(Xa(this.g,13))||gb(Cb);this.l=new qb(a.document,b,R(this.g,12))}Db.prototype.start=function(){Eb(this)};function Eb(a){Fb(a);mb(a.o,a.u,3,!1,function(){a:{var b=a.j;var c=u.btoa(b);if(c=u[c]){try{var d=db(u.atob(c))}catch(e){b=!1;break a}b=b===Za(d,1)}else b=!1}b?Z(a,R(a.g,14)):(Z(a,R(a.g,8)),rb(a.l))},function(){wb(function(){Z(a,R(a.g,7));rb(a.l)},function(){return Z(a,R(a.g,6))},R(a.g,9),$a(a.g,10),$a(a.g,11))})}function Z(a,b){a.i||(a.i=!0,a=new a.m.XMLHttpRequest,a.open("GET",b,!0),a.send())}function Fb(a){var b=u.btoa(a.j);a.m[b]&&Z(a,R(a.g,5))};(function(a,b){u[a]=function(){var c=ma.apply(0,arguments);u[a]=function(){};b.call.apply(b,[null].concat(c instanceof Array?c:fa(n(c))))}})("__h82AlnkH6D91__",function(a){typeof window.atob==="function"&&(new Db(window,zb(window.atob(a)))).start()});}).call(this);window.__h82AlnkH6D91__("WyJwdWItMzYwNzIxMzMxNTg2Mjc2MCIsW251bGwsbnVsbCxudWxsLCJodHRwczovL2Z1bmRpbmdjaG9pY2VzbWVzc2FnZXMuZ29vZ2xlLmNvbS9iL3B1Yi0zNjA3MjEzMzE1ODYyNzYwIl0sbnVsbCxudWxsLCJodHRwczovL2Z1bmRpbmdjaG9pY2VzbWVzc2FnZXMuZ29vZ2xlLmNvbS9lbC9BR1NLV3hVVkxBMGI1ZldaUUFQai0wMm9DRlJMRjZlWFFaVGhBWnhLRjkybU9tVWczRm1XWnpFUl82MUF0LU1pZGY0N3NwWnpkSVNibVYtQmpEcEFsNXU2M2x0MmhBXHUwMDNkXHUwMDNkP3RlXHUwMDNkVE9LRU5fRVhQT1NFRCIsImh0dHBzOi8vZnVuZGluZ2Nob2ljZXNtZXNzYWdlcy5nb29nbGUuY29tL2VsL0FHU0tXeFVsdDI2SGRVRU02eXFqUThTNkcxZzlPdERCZ3U4R2lOa2dwVnBDcTBHS0J0c1AtQmdxV0hwaDR0WTJnS2EwWHQ1M3hRV2R2S0xuVkpKUDJjUmZ2MHF6dXdcdTAwM2RcdTAwM2Q/YWJcdTAwM2QxXHUwMDI2c2JmXHUwMDNkMSIsImh0dHBzOi8vZnVuZGluZ2Nob2ljZXNtZXNzYWdlcy5nb29nbGUuY29tL2VsL0FHU0tXeFY1SmtlNUJsQW9SaWtyaDJvVFctcG5NMzZXSWJnVWZya0lINC1LRWgtci1SNGJKOWY5bzUweDlwVHZab0lsQnkzRkNmdVJjM0tzcGFYYjU3Vjg0OHFTa3dcdTAwM2RcdTAwM2Q/YWJcdTAwM2QyXHUwMDI2c2JmXHUwMDNkMSIsImh0dHBzOi8vZnVuZGluZ2Nob2ljZXNtZXNzYWdlcy5nb29nbGUuY29tL2VsL0FHU0tXeFZnLXBucHVLelhPTVY1MzBkVktULVE2TGR2YXF5bUwwTlM4YlhfUy1vNkVaN0luQWhjdlQ1Y2JOV01tNG9LRUY4VFJNaFQwc1VSbnVtZWJsc25SUDQ5elFcdTAwM2RcdTAwM2Q/c2JmXHUwMDNkMiIsImRpdi1ncHQtYWQiLDIwLDEwMCwiY0hWaUxUTTJNRGN5TVRNek1UVTROakkzTmpBXHUwMDNkIixbbnVsbCxudWxsLG51bGwsImh0dHBzOi8vd3d3LmdzdGF0aWMuY29tLzBlbW4vZi9wL3B1Yi0zNjA3MjEzMzE1ODYyNzYwLmpzP3VzcXBcdTAwM2RDQUUiXSwiaHR0cHM6Ly9mdW5kaW5nY2hvaWNlc21lc3NhZ2VzLmdvb2dsZS5jb20vZWwvQUdTS1d4WGo0LUJrN1dscE1jaUJ1LXR2Z3lmVUFsUUtyN3NYUzRScUpCYWlLVm9Yekh5aTRQczRVQXZqenZhbEtCWUl0Mml0bm1uWlgwbnZBZXZMUklQM2Y1em5Pd1x1MDAzZFx1MDAzZCJd");`
                        }}
                    />
                </>
            )}

            <Script
                id="local-business-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WaterRefillingStation",
                        "name": "Seaside Purified Water Refilling Station",
                        "image": "https://seasidepos.vercel.app/seasidelogo_.png",
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": "Loois",
                            "addressLocality": "Labrador",
                            "addressRegion": "Pangasinan",
                            "addressCountry": "PH"
                        },
                        "telephone": "09686786072",
                        "url": "https://seasidepos.vercel.app",
                        "priceRange": "₱",
                        "sameAs": [
                            "https://www.facebook.com/61587059323111/"
                        ]
                    })
                }}
            />
            <Script
                id="website-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Seaside",
                        "alternateName": "Seaside Purified Water Refilling Station",
                        "url": "https://seasidepos.vercel.app/"
                    })
                }}
            />

            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="px-6 py-2 relative z-50 sticky top-0 backdrop-blur-sm border-b border-white/20 shadow-sm w-full" style={{ backgroundColor: '#FFFFFF80' }}>
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl shadow-sm border border-green-100" style={{ backgroundColor: '#FFFFFF80' }}>
                                <Image
                                    src={settings?.logo_url || "/seasidelogo_.png"}
                                    alt="SEASIDE Logo"
                                    width={100}
                                    height={100}
                                    className="object-contain w-[100px] h-[100px]"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-7xl font-extrabold tracking-wider leading-none mb-1 text-green-950">
                                    {settings?.business_name ? settings.business_name.split(' ')[0] : 'SEASIDE'}
                                </span>
                                <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">
                                    {settings?.business_name ? settings.business_name.substring(settings.business_name.indexOf(' ') + 1) : 'Water Refilling Station'}
                                </span>
                                <span className="text-[9px] font-semibold tracking-wide text-green-700 mt-0.5">Proudly hydrating Labrador, Pangasinan</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="hidden md:flex justify-end items-center text-[10px] sm:text-xs mb-4">
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
                                    {user ? (
                                        <Link href="/pos" passHref>
                                            <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                                Continue to Office
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href="/login" passHref>
                                            <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                                Staff Login
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <nav className="hidden md:flex flex-wrap items-center justify-center lg:justify-end gap-x-1 gap-y-2 text-[12px] font-bold tracking-wide">
                                <Link href="/" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">HOME</Link>
                                <Link href="#services" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">SERVICES</Link>
                                <Link href="#process" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">PROCESS</Link>
                                <Link href="#gallery" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">LOCATION</Link>
                                <Link href="#contact" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">CONTACT</Link>
                                <Link href="/resources" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">RESOURCES</Link>
                            </nav>
                            <div className="md:hidden">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                                    aria-expanded={isMenuOpen}
                                >
                                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {isMenuOpen && (
                        <div className="md:hidden mt-4">
                            <nav className="flex flex-col items-center gap-y-4 text-[12px] font-bold tracking-wide">
                                <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">HOME</Link>
                                <Link href="#services" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">SERVICES</Link>
                                <Link href="#process" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">PROCESS</Link>
                                <Link href="#gallery" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
                                <Link href="#contact" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">CONTACT</Link>
                                <Link href="/resources" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">RESOURCES</Link>
                                {user ? (
                                    <Link href="/pos" passHref>
                                        <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                            Continue to Office
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/login" passHref>
                                        <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                            Staff Login
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                </header>

                <div className="container mx-auto flex flex-col flex-grow relative backdrop-blur-sm shadow-lg border border-white/20" style={{ backgroundColor: '#FFFFFF80' }}>

                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow">
                        <div className="px-6 mt-16 md:mt-24 relative z-20">
                            <div className="max-w-3xl">
                                <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-6 text-slate-900">
                                    Your Family’s Health in Labrador, Pangasinan,<br/> <span className="font-extrabold text-green-700">Flowing Crystal Clear from Seaside.</span>
                                </h1>

                                <p className="mb-8 text-base md:text-lg text-slate-800 max-w-2xl font-medium leading-relaxed p-5 rounded-xl border shadow-sm" style={{ backgroundColor: '#FFFFFF80' }}>
                                    Proudly serving the families of Labrador, Pangasinan. At Seaside, we believe our community deserves world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with the warm, local service you know and trust.
                                </p>

                                <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Advanced 21-stage reverse osmosis filtration system</li>
                                    <li className="flex items-center"><Heart className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Carefully remineralized to deliver crisp, healthy hydration for your whole family</li>
                                    <li className="flex items-center"><Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Eco-friendly station—bring your jugs and save the planet</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                            <div className="mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                        Why Choose Seaside?
                                    </h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust in Labrador, Pangasinan.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Droplet className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Zero Doubts, Just Pure Water</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">We don't cut corners. Our advanced 21-stage filtration system strips away 99.9% of impurities, heavy metals, and bacteria, leaving you with water that is as safe as it is refreshing.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Heart className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Gentle on Tummies, Great for Health</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">From mixing your baby’s formula to brewing your morning coffee, our water is crafted for family life. We ensure a healthy balance of natural minerals, making every glass safe, nourishing, and deeply refreshing.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Leaf className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Eco-Friendly</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div id="services" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                        Our Services
                                    </h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Convenience and Quality, Delivered in Labrador, Pangasinan.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Leaf className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Walk-In Refills</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Experience fast, friendly, and clean service right at our station in Labrador, Pangasinan. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.</p>
                                </div>

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Truck className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Door-to-Door Delivery</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador, Pangasinan and neighboring municipalities. Just send us a message, and we'll do the heavy lifting for you.</p>
                                </div>

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><GlassWater className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ready-to-Drink PET Bottles</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, family parties, corporate events, or simply stocking up your fridge.</p>
                                </div>

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Snowflake className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Purified Ice Tubes & Cubes</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting—perfect for parties, businesses, and everyday use.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <ProcessSection />

                    <motion.div id="gallery" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-5xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-200 mb-4 border border-lime-300 shadow-sm">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Gallery</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">A glimpse of our station and services in Labrador, Pangasinan</p>
                            </div>

                            {galleryItems.length > 0 ? (
                                <div
                                    className="relative w-full rounded-[2rem] shadow-2xl border-4 border-white bg-slate-900 group overflow-hidden"
                                    style={{ height: '450px' }}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute inset-0 w-full h-full"
                                        >
                                            <Image
                                                src={galleryItems[currentIndex]?.image_url}
                                                alt={galleryItems[currentIndex]?.title || 'Gallery'}
                                                width={800}
                                                height={450}
                                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-700"
                                                onClick={() => setIsLightboxOpen(true)}
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent p-6 md:p-8 text-black z-20 pointer-events-none">
                                                <h3 className="text-2xl md:text-3xl font-bold drop-shadow-md">
                                                    {galleryItems[currentIndex]?.title}
                                                </h3>
                                                {galleryItems[currentIndex]?.description && (
                                                    <p className="text-sm md:text-base text-gray-800 mt-2 max-w-3xl drop-shadow">
                                                        {galleryItems[currentIndex]?.description}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {galleryItems.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevSlide}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#FFFFFF00] hover:bg-white/40 text-black rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/50 md:opacity-0 group-hover:opacity-100"
                                                aria-label="Previous image"
                                            >
                                                <span className="text-xl md:text-2xl font-bold leading-none -mt-1">❮</span>
                                            </button>

                                            <button
                                                onClick={nextSlide}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#FFFFFF00] hover:bg-white/40 text-black rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/50 md:opacity-0 group-hover:opacity-100"
                                                aria-label="Next image"
                                            >
                                                <span className="text-xl md:text-2xl font-bold leading-none -mt-1">❯</span>
                                            </button>

                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/30 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                                                {galleryItems.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentIndex(idx)}
                                                        aria-label={`Go to slide ${idx + 1}`}
                                                        aria-current={idx === currentIndex ? "true" : "false"}
                                                        className={`h-2.5 rounded-full transition-all duration-300 ${
                                                            idx === currentIndex ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-2.5 bg-white/50 hover:bg-white/90'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 rounded-3xl border border-dashed border-slate-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                    <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">No gallery items yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div id="location" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                            <div className="mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Location</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">Navigate to Purity in Labrador, Pangasinan – See Us on the Map!</p>
                            </div>
                            <div className="w-full relative z-30">
                                <iframe title="Seaside Water Refilling Station Location Map" src={settings?.location_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.427589470715!2d120.1322205!3d16.043286199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1771921863348!5m2!1sen!2sph"} width="100%" height="450" style={{ border: 0, borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div id="contact" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-4xl mx-auto text-center">
                            <div className="mb-12">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border border-lime-300 shadow-sm">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Contact Us</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">We'd love to hear from you</p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border shadow-sm text-left">
                                <div className="mb-6 text-center">
                                    <p className="text-lg font-semibold text-gray-800">Business Hours:</p>
                                    <p className="text-gray-700">Monday - Saturday: 8:00 AM - 5:00 PM</p>
                                    <p className="mt-4 text-lg font-semibold text-gray-800">Our Address:</p>
                                    <p className="text-gray-700">Laois, Labrador, Pangasinan</p>
                                </div>
                                <form action="mailto:aranjitarchit@gmail.com" method="POST" encType="text/plain" className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email Address</label>
                                        <Input
                                            type="email"
                                            name="Sender Email"
                                            placeholder="example@email.com"
                                            required
                                            className="w-full bg-white h-12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                        <Textarea
                                            name="Message Body"
                                            rows={6}
                                            placeholder="Write your message here..."
                                            required
                                            className="w-full bg-white p-4"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200">
                                        <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-black px-10 py-3 rounded-xl font-bold shadow-md">
                                            Send Message
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
                            </div>
                        </div>
                    </motion.div>

                    {/* ADSTERRA BANNER SECTION */}
                    {!user && (
                        <div className="bg-transparent relative z-20 border-t py-10 flex justify-center items-center">
                            <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">Advertisement</span>
                                
                                {/* Safely load Adsterra using our custom component */}
                                <AdsterraBanner />

                            </div>
                        </div>
                    )}
                    {/* END ADSTERRA BANNER SECTION */}

                    <footer className="bg-slate-900 text-slate-400 py-12">
                        <div className="container mx-auto px-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                                <div>
                                    <h3 className="text-cyan-400 text-lg font-bold mb-4">Our Labrador, Pangasinan Roots</h3>
                                    <p className="text-sm leading-relaxed">
                                        Founded on 2020, our station was born from a desire for local
                                        self-reliance in Labrador, Pangasinan. We provide the community with
                                        state-of-the-art 20-stage purification, ensuring every neighbor from the
                                        poblacion to the barangays has access to the highest quality hydration.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-cyan-400 text-lg font-bold mb-4">Quick Links</h3>
                                    <ul className="text-sm space-y-2">
                                        <li><Link href="#process" className="inline-block py-2 hover:text-cyan-300 transition">Our 20-Stage Process</Link></li>
                                        <li><Link href="#location" className="inline-block py-2 hover:text-cyan-300 transition">Delivery Areas</Link></li>
                                        <li><Link href="/contact" className="inline-block py-2 hover:text-cyan-300 transition">Contact Support</Link></li>
                                        <li><Link href="/terms" className="inline-block py-2 hover:text-cyan-300 transition">Terms of Service</Link></li>
                                        <li><Link href="/privacy" className="inline-block py-2 hover:text-cyan-300 transition">Privacy Policy</Link></li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-cyan-400 text-lg font-bold mb-4">Resources & Health</h3>
                                    <ul className="text-sm space-y-3">
                                        <li>
                                            <Link href="/resources/benefits-of-21-stage-purified-water" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                <span className="font-bold">The Science of 20 Stages</span>
                                                <span className="text-xs text-slate-500">Why standard filtration isn't enough.</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/resources/staying-hydrated-in-labrador-summer-tips" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                <span className="font-bold">Beating the Labrador Heat</span>
                                                <span className="text-xs text-slate-500">Hydration tips for the tropical climate.</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/resources/maintaining-your-water-containers-at-home" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                <span className="font-bold">Dispenser Maintenance 101</span>
                                                <span className="text-xs text-slate-500">Keep your water pure at home.</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
                                <p>© {new Date().getFullYear()} Seaside Purified Water. DOH Certified. All Rights Reserved.</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-[999] p-4 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 active:scale-90 transition-all cursor-pointer flex items-center justify-center border-2 border-white/20"
                        aria-label="Back to top"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6"/>
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all z-[110]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLightboxOpen(false);
                            }}
                        >
                            <X size={32} />
                        </button>

                        <motion.img
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            src={galleryItems[currentIndex]?.image_url}
                            alt={galleryItems[currentIndex]?.title || 'Enlarged Image'}
                            width={1200}
                            height={800}
                            className="w-full max-w-5xl max-h-[85vh] object-contain cursor-default drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-[2rem] bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SeasideWaterLanding;
