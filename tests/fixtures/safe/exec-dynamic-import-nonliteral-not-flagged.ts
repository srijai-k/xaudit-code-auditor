async function loadLocale(locale) {
  const messages = await import(`./locales/${locale}.json`);
  return messages.default;
}
