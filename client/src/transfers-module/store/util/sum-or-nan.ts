export const sumOrNaN = (
  ...values: (number | undefined)[]
): number | undefined => {
  const total = values.reduce((curr, val) => (curr! += val!), 0)!;
  return isNaN(total) ? undefined : total;
};
