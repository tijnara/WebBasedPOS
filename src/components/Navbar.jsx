import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import Image from 'next/image';

const CartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
    <circle cx="9" cy="20" r="2" />
    <circle cx="15" cy="20" r="2" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
    <path d="M7 7h10v10H7z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
    <path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
    <circle cx="6" cy="8" r="2" />
    <circle cx="18" cy="8" r="2" />
  </svg>
);

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.5 5.25a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 12a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 18.75a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
  </svg>
);

const Navbar = () => {
  const router = useRouter();
  const { user, logout } = useStore(s => ({
    user: s.user,
    logout: s.logout
  }));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clientUser, setClientUser] = useState(null);

  const links = [
    { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
    { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
    { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
    { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
    { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" /> },
  ];

  useEffect(() => {
    setClientUser(user);
  }, [user]);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    router.push('/login');
  };

  const handleNavLinkClick = (path) => {
    setIsMobileMenuOpen(false);
    router.push(path);
  };

  const userInitial = clientUser?.name ? clientUser.name.charAt(0).toUpperCase() : (clientUser?.email ? clientUser.email.charAt(0).toUpperCase() : '?');

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="navbar">
      <div className="brand">
        <Image
          src="/seaside.png"
          alt="Seaside Logo"
          width={32}
          height={32}
        />
        <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
      </div>

      <nav className="hidden md:flex">
        {links.map(link => {
          const isActive = router.pathname === link.path;
          return (
            <Button
              key={link.path}
              variant="ghost"
              className={cn('btn', { 'active': isActive })}
              onClick={() => handleNavLinkClick(link.path)}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span>{link.name}</span>
            </Button>
          );
        })}
      </nav>

      <div className="meta-container">
        {clientUser && (
          <div className="user-info-text">
            Logged in as: <strong>{clientUser.name || clientUser.email}</strong>
          </div>
        )}
        <Button
          variant="ghost"
          className="btn logout-button" // Add a specific class for styling
          onClick={handleLogout}
          title="Logout"
        >
          {clientUser ? (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold" title={clientUser.name || clientUser.email}>
              {userInitial}
            </span>
          ) : (
            <span className="w-6 h-6 flex-shrink-0">?</span>
          )}
          <span className="hidden md:inline ml-2">Logout</span>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="hamburger-button md:hidden ml-2"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <HamburgerIcon />
      </Button>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-md md:hidden z-40">
          <nav className="flex flex-col p-2">
            {links.map(link => {
              const isActive = router.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  variant="ghost"
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-md hover:bg-gray-100 w-full justify-start text-gray-900 btn',
                    { 'bg-violet-100 text-primary font-semibold': isActive }
                  )}
                  onClick={() => handleNavLinkClick(link.path)}
                >
                  <span className="w-6 h-6 flex-shrink-0">{link.icon}</span>
                  <span>{link.name}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
