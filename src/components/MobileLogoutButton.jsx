import React from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui';

export default function MobileLogoutButton() {
    const logout = useStore(s => s.logout);
    return (
        <Button
            variant="ghost"
            className="mobile-logout-btn"
            onClick={logout}
            title="Logout"
        >
            Logout
        </Button>
    );
}

