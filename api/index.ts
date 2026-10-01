let appPromise: Promise<any> | null = null;

async function loadApp() {
  if (!appPromise) {
    appPromise = import('../server').then((mod) => mod.app);
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error: any) {
    console.error('[CivicFlow] Failed to initialize API handler:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'CivicFlow API failed to initialize.',
        path: req?.url || 'unknown'
      });
    }
    res.end();
  }
}
