const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL
 * @param {string} data - Data to encode in QR
 * @returns {Promise<string>} - base64 data URL
 */
const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      },
      width: 300
    });
    return qrDataURL;
  } catch (err) {
    throw new Error('QR code generation failed: ' + err.message);
  }
};

/**
 * Build the ticket QR payload
 */
const buildTicketPayload = (ticketId, eventId, userId) => {
  return JSON.stringify({
    ticketId,
    eventId,
    userId,
    issued: Date.now()
  });
};

module.exports = { generateQRCode, buildTicketPayload };
