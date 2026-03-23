import React from 'react';
import OptimizedImage from './OptimizedImage';

const BackgroundImage = () => {
    return (
        <div className="fixed inset-0 -z-10">
            <OptimizedImage
                src="/seaside_bg2.png"
                alt="Seaside background"
                layout="fill"
                objectFit="cover"
                quality={100}
                priority
            />
        </div>
    );
};

export default BackgroundImage;
