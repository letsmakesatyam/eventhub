import { useState, useEffect, useCallback } from 'react';
import { healthCheck } from '../lib/api';

export const useServerStatus = () => {
  const [status, setStatus] = useState('checking'); // checking | online | waking | offline
  const [retryCount, setRetryCount] = useState(0);

  const check = useCallback(async () => {
    try {
      await healthCheck();
      setStatus('online');
      setRetryCount(0);
    } catch (err) {
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      if (isNetwork || err.response?.status >= 500) {
        setStatus(prev => prev === 'checking' ? 'waking' : 'waking');
        setRetryCount(c => c + 1);
      } else {
        setStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (status === 'waking' && retryCount < 10) {
      const delay = Math.min(3000 * retryCount, 15000);
      const timer = setTimeout(check, delay);
      return () => clearTimeout(timer);
    }
    if (retryCount >= 10) setStatus('offline');
  }, [status, retryCount, check]);

  return { status, retryCount };
};
