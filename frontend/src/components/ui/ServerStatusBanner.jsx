import { useServerStatus } from '../../hooks/useServerStatus';

export const ServerStatusBanner = () => {
  const { status, retryCount } = useServerStatus();

  if (status === 'online') return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium transition-all ${
      status === 'waking' ? 'bg-amber-50 border-t border-amber-200 text-amber-800' :
      status === 'offline' ? 'bg-red-50 border-t border-red-200 text-red-800' :
      'bg-blue-50 border-t border-blue-200 text-blue-800'
    }`}>
      {status === 'waking' || status === 'checking' ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Server is waking up, please wait... (attempt {retryCount}/10)
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          Server is offline. Please try again later.
        </>
      )}
    </div>
  );
};
