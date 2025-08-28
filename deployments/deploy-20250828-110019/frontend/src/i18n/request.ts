import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    const currentLocale = locale ?? 'ru';
    const messages = (await import(`../messages/${currentLocale}.json`)).default;
    return { locale: currentLocale, messages };
}); 