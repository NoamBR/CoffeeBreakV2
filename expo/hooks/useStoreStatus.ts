import { useState, useEffect } from 'react';
import { isStoreOpen, getStatusText } from '@/utils/storeHours';

export function useStoreStatus() {
  const [open, setOpen] = useState(isStoreOpen());
  const [statusText, setStatusText] = useState(getStatusText());

  useEffect(() => {
    const interval = setInterval(() => {
      setOpen(isStoreOpen());
      setStatusText(getStatusText());
    }, 60_000); // check every minute

    return () => clearInterval(interval);
  }, []);

  return { isOpen: open, statusText };
}
