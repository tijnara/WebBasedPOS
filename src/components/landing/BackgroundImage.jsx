import React from 'react';

const BackgroundImage = () => {
    return (
        <div className="fixed inset-0 -z-10">
            <img
                src="/seasideHD_.png"
                alt="Seaside background"
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default BackgroundImage;
