import React from 'react';

// Bulletproof Bottom Banner (320x50)
export const AdsterraBanner = () => {
    return (
        <div className="flex justify-center w-[320px] h-[50px] mx-auto overflow-hidden">
            <iframe
                src="/ad-bottom.html"
                width="320"
                height="50"
                className="border-none overflow-hidden"
                scrolling="no"
                title="Bottom Advertisement"
            ></iframe>
        </div>
    );
};

// Bulletproof Sidebar Banner (160x600)
export const AdsterraVerticalBanner = () => {
    return (
        <div className="flex justify-center w-[160px] h-[600px] overflow-hidden">
            <iframe
                src="/ad-sidebar.html"
                width="160"
                height="600"
                className="border-none overflow-hidden"
                scrolling="no"
                title="Sidebar Advertisement"
            ></iframe>
        </div>
    );
};
