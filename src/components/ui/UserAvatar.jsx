import React from 'react';

const UserAvatar = ({ src, fallback }) => (
    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-white shadow-sm flex items-center justify-center overflow-hidden">
        {src ? <img src={src} alt="User" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-indigo-700">{fallback}</span>}
    </div>
);

export default UserAvatar;
