import { TimeFrames } from '../model/time-frames';

export const getStartOfCurrentDay = () => {
  const temp = new Date();
  temp.setMilliseconds(0);
  temp.setMinutes(0);
  temp.setHours(0);
  return temp;
};

export const getFirstDayOfYear = () => {
  const temp = new Date();
  temp.setMilliseconds(0);
  temp.setMinutes(0);
  temp.setHours(0);
  temp.setMonth(0);
  temp.setDate(1);
  return temp;
};

export const getStartDate = (timeFrame: string) => {
  const temp = getStartOfCurrentDay();
  switch (timeFrame) {
    case TimeFrames.currentMonth:
      temp.setDate(1);
      break;
    case TimeFrames.currentYear:
      temp.setDate(1);
      temp.setMonth(0);
      break;
    case TimeFrames.lastSevenDays:
      temp.setDate(temp.getDate() - 6);
      break;
    case TimeFrames.lastThirtyDays:
      temp.setDate(temp.getDate() - 29);
      break;
    case TimeFrames.lastMonth:
      temp.setDate(1);
      temp.setMonth(temp.getMonth() - 1);
      break;
    case TimeFrames.lastYear:
      temp.setDate(1);
      temp.setMonth(0);
      temp.setFullYear(temp.getFullYear() - 1);
      break;
  }
  return temp.getTime();
};

export const getEndDate = (timeFrame: string) => {
  const temp = getStartOfCurrentDay();
  switch (timeFrame) {
    case TimeFrames.currentMonth:
    case TimeFrames.currentYear:
    case TimeFrames.lastSevenDays:
    case TimeFrames.lastThirtyDays:
      temp.setDate(temp.getDate() + 1);
      break;
    case TimeFrames.lastMonth:
      temp.setDate(1);
      break;
    case TimeFrames.lastYear:
      temp.setDate(1);
      temp.setMonth(0);
      break;
  }
  return temp.getTime();
};

export function formatDate(date: number) {
  const d = new Date(date),
    year = d.getFullYear();
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}
