export const getExpirationStatus = <T extends string | null>(
  expirationDate: T,
) => {
  if (!expirationDate) return null;

  const expDate = new Date(expirationDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isExpired = expDate < now;
  const isExpiringSoon = expDate < thirtyDaysFromNow && !isExpired;

  return { isExpired, isExpiringSoon };
};
