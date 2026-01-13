const isDevelopment = false;

export const measurePerformance = (name: string, fn: () => void) => {
  if (isDevelopment) {
    const start = performance.now();
    fn();
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

export const logRenderCount = (componentName: string) => {
  if (isDevelopment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCount = (window as any)[`${componentName}_renders`] || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[`${componentName}_renders`] = renderCount + 1;
    // eslint-disable-next-line no-console
    console.log(`[Render] ${componentName}: ${renderCount + 1}`);
  }
};
