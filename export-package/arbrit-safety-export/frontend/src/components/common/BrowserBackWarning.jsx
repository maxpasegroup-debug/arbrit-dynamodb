import { useEffect } from 'react';

const BrowserBackWarning = () => {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if navigating away from the dashboard
      if (window.location.pathname.includes('/dashboard/')) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to exit the dashboard?';
        return 'Are you sure you want to exit the dashboard?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
};

export default BrowserBackWarning;
