export const TimeFrames: { [key: string]: number | string } = Object.freeze({
  'This Month': 'This Month',
  'This Year': 'This Year',
  'Last 7 days': 'Last 7 days',
  'Last 30 days': 'Last 30 days',
  'Last Month': 'Last Month',
  lastYear: new Date().getFullYear() - 1,
  twoYearsAgo: new Date().getFullYear() - 2,
  threeYearsAgo: new Date().getFullYear() - 3,
  yourYearsAgo: new Date().getFullYear() - 4,
  fiveYearsAgo: new Date().getFullYear() - 5,
});
