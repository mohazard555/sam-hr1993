// Use process.env for environment variables to resolve TypeScript error with ImportMeta and maintain consistency with project guidelines
const API_URL = process.env.VITE_API_URL || 'https://your-api-domain.com';

export const apiClient = async (endpoint: string, options: any = {}) => {
  const licenseKey = localStorage.getItem('SAM_LICENSE_KEY');
  
  const headers = {
    'Content-Type': 'application/json',
    'x-license-key': licenseKey || '',
    ...options.headers,
  };

  const fetchWithRetry = async (retries = 3): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API Request Failed');
      }
      
      return await response.json();
    } catch (err: any) {
      if (retries > 0 && (err.message === 'Failed to fetch' || !navigator.onLine)) {
        console.warn(`Retrying... attempts left: ${retries}`);
        await new Promise(res => setTimeout(res, 2000));
        return fetchWithRetry(retries - 1);
      }
      throw err;
    }
  };

  return fetchWithRetry();
};
