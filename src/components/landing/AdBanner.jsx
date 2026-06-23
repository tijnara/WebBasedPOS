// src/components/landing/AdBanner.jsx
import React, { useEffect, useRef } from 'react';

const AdBanner = () => {
  const adContainerRef = useRef(null);

  useEffect(() => {
    if (adContainerRef.current && adContainerRef.current.children.length === 0) {
      const scriptConfig = document.createElement('script');
      scriptConfig.innerHTML = `
        atOptions = {
          'key' : 'c5677f34756199760394679363f2f373',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      adContainerRef.current.appendChild(scriptConfig);

      const scriptInvoke = document.createElement('script');
      scriptInvoke.src = "https://undergocutlery.com/c5677f34756199760394679363f2f373/invoke.js";
      scriptInvoke.async = true;
      adContainerRef.current.appendChild(scriptInvoke);
    }
  }, []);

  return (
    <div ref={adContainerRef} className="text-center my-8">
      {/* Ad will be injected here by the script */}
    </div>
  );
};

export default AdBanner;