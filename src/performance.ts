const isDevelopment = false;

export const measurePerformance = (name: string, fn: () => void) => {
  if (isDevelopment) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

export const logRenderCount = (componentName: string) => {
  if (isDevelopment) {
    const renderCount = (window as any)[`${componentName}_renders`] || 0;
    (window as any)[`${componentName}_renders`] = renderCount + 1;
    console.log(`[Render] ${componentName}: ${renderCount + 1}`);
  }
};
