export const tokenAmountFormatter = (digits: number) => {
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatTokenAmount = (value: number, digits: number) => {
  return tokenAmountFormatter(digits).format(value);
};

export const valueFormatter = new Intl.NumberFormat(
  navigator.language || 'en-US',
  {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
);

export const formatValue = (value: number | undefined) => {
  if (value === undefined || isNaN(value)) {
    return '-';
  }
  return valueFormatter.format(value);
};

export const currencyFormatter = (currency: string | undefined) =>
  new Intl.NumberFormat(navigator?.language || 'en-US', {
    style: 'currency',
    currency: currency!.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol',
  });

export const formatCurrency = (value: number, currency: string) => {
  if (value === undefined || isNaN(value)) {
    return '-';
  }
  return currencyFormatter(currency).format(value);
};
