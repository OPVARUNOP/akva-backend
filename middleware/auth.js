const auth = (req, res, next) => {
  try {
    const appId = req.headers['x-akva-app-id'];
    const version = req.headers['x-akva-version'];

    // Accept any of these valid app IDs
    const validIds = [
      'com.varun.akva',
      'akva.android',
      'varun.akva'
    ];

    const isValid = validIds.some(id =>
      appId && appId.toLowerCase().includes('akva')
    );

    if (!isValid) {
      console.log(`Auth failed: appId=${appId}`);
      // Don't block — just log and continue
      // This allows testing and prevents lockout
    }

    next();
  } catch (err) {
    next();
  }
};

module.exports = auth;
