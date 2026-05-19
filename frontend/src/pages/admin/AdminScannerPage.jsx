import { useState, useEffect, useRef } from 'react';
import { ticketsAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { QrCode, CheckCircle, XCircle, Camera, Keyboard } from 'lucide-react';

export const AdminScannerPage = () => {
  const [mode, setMode] = useState('manual'); // 'camera' | 'manual'
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const { toast } = useToast();

  const validate = async (qrData) => {
    if (!qrData.trim()) return toast.error('Enter or scan QR data');
    try {
      setScanning(true);
      setResult(null);
      const res = await ticketsAPI.validate({ qr_data: qrData.trim() });
      setResult({ ...res.data, success: true });
    } catch (err) {
      const data = err.response?.data;
      setResult({ success: false, error: data?.error || 'Validation failed', ...data });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          validate(decodedText);
          stopCamera();
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      toast.error('Camera access denied or not available');
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop();
      }
      setCameraActive(false);
    } catch {}
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const handleModeSwitch = async (newMode) => {
    if (cameraActive) await stopCamera();
    setMode(newMode);
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">QR Scanner</h1>
        <p className="text-gray-500 dark:text-slate-400">Scan or enter ticket QR data to validate check-in</p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
        {[
          { key: 'camera', icon: Camera, label: 'Camera Scan' },
          { key: 'manual', icon: Keyboard, label: 'Manual Entry' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Scanner UI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
        {mode === 'camera' ? (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
            {!cameraActive ? (
              <button onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                Stop Camera
              </button>
            )}
            <p className="text-xs text-center text-gray-400 dark:text-slate-500">Position the QR code within the camera frame</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-violet-50 dark:bg-violet-900/30 rounded-2xl mx-auto mb-2">
              <QrCode className="w-8 h-8 text-violet-500 dark:text-violet-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">QR Code Data</label>
              <textarea
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                rows={4}
                className="input-field resize-none font-mono text-xs"
                placeholder='{"ticketId":"...","eventId":"...","userId":"..."}'
              />
            </div>
            <button
              onClick={() => validate(manualInput)}
              disabled={scanning || !manualInput.trim()}
              className="btn-primary w-full"
            >
              {scanning ? 'Validating...' : 'Validate Ticket'}
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-6 animate-fade-in ${
          result.success
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              result.success ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'
            }`}>
              {result.success
                ? <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                : <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${result.success ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                {result.success ? '✓ Check-in Successful!' : '✗ Invalid Ticket'}
              </h3>
              {result.success ? (
                <div className="space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                  <p><span className="font-medium">Attendee:</span> {result.attendee?.name}</p>
                  <p><span className="font-medium">Email:</span> {result.attendee?.email}</p>
                  <p><span className="font-medium">Event:</span> {result.event?.title}</p>
                </div>
              ) : (
                <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
                  <p>{result.error}</p>
                  {result.attendee && <p><span className="font-medium">Attendee:</span> {result.attendee.name}</p>}
                  {result.checked_in_at && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      Already checked in at {new Date(result.checked_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => { setResult(null); setManualInput(''); }}
            className={`mt-4 w-full py-2 rounded-xl text-sm font-medium border border-current opacity-70 hover:opacity-100 transition-opacity ${
              result.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};
