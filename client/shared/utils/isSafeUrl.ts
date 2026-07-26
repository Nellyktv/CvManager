/** Only http(s) links are safe to render as a clickable link (blocks javascript: etc.). */
export const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);
