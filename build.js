export function prepareForProduction() {
  try {
    document.documentElement.setAttribute('data-env', 'prod');
    // Preload background video for faster start
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'video';
    preload.href = '/efe50645-3bff-48ed-8183-5cac009e4469.mp4';
    document.head.appendChild(preload);
    // Silence verbose logs in production (keep warn/error)
    const keepWarn = console.warn.bind(console);
    const keepError = console.error.bind(console);
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.warn = keepWarn;
    console.error = keepError;
  } catch (e) {
    // fail-safe
  }
}