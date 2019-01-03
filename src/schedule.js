import * as R from 'ramda';
import Future from 'folktale/concurrency/future';
import Result from 'folktale/result';

import { asDate, resultToFuture, trace } from './utils';
import { csvToJson } from './csv-to-json';
import dataUrl from './data.csv';

const calendarDays = {
  MondayNight: 1,
  'Tuesday 1': 2,
  'Tuesday 2': 2,
  'Wednesday 1': 3,
  'Wednesday 2': 3,
  'Thursday 1': 4,
  'Thursday 2': 4,
  'Friday 1': 5,
  'Friday 2': 5,
};

// pickupDate :: CalendarDays -> Date -> ScheduleType -> Date
const pickupDate = (calendarDays => (date, scheduleType) => {
  const day = date.getDay();
  const idx = calendarDays[scheduleType];
  const pickupDay =
    date.getDate() + (day > idx ? 6 - day + idx + 1 : idx - day);

  return new Date(date.getFullYear(), date.getMonth(), pickupDay);
})(calendarDays);

// byTime :: Date -> Date -> Boolean
const byTime = R.curry(
  (pickupDay, weekStarting) => pickupDay.getTime() === weekStarting.getTime(),
);

// findNearestDayTo :: Date -> ScheduleType -> Schedule
const findNearestDayTo = date =>
  R.find(
    R.compose(
      byTime(date),
      R.prop('weekStarting'),
    ),
  );

// dayToBool :: Any -> Boolean
const dayToBool = R.flip(R.contains)(['M', 'T', 'W', 'R', 'F', 'S']);

// schedulesOfType :: ScheduleType -> [Schedule] -> Schedule
const schedulesOfType = scheduleType =>
  R.filter(({ calendar }) => calendar === scheduleType);

// checkSchedule :: Schedule -> Result(Schedule)
const checkSchedule = schedule =>
  schedule !== undefined
    ? Result.Ok(schedule)
    : Result.Error('🤷🏽‍ Unable to find the schedule.');

/**
 * Find schedule for given date and schedule-type
 * scheduleFor :: Date -> ScheduleType -> Result Reason Schedule
 */
const scheduleFor = (date, scheduleType) =>
  R.compose(
    checkSchedule,
    findNearestDayTo(pickupDate(date, scheduleType)),
    schedulesOfType(scheduleType),
  );

// normalizeSchedule :: RawSchedule -> Schedule
export const normalizeSchedule = R.evolve({
  christmasTree: dayToBool,
  garbage: dayToBool,
  greenBin: dayToBool,
  recycling: dayToBool,
  weekStarting: asDate,
  yardWaste: dayToBool,
});

// httpGet :: URL -> Future Response
const httpGet = url => Future.fromPromise(fetch(url));

// parse :: Response -> Future Reason CsvString
const parse = res =>
  res.status >= 200 && res.status < 300
    ? Future.fromPromise(res.text())
    : Future.rejected('⚠️ Unable to fetch schedule data');

// getText :: URL -> Future Reason String
const getText = R.composeK(
  parse,
  httpGet,
);

// findSchedule :: Date -> ScheduleType -> Future Reason Schedule
export const findSchedule = (date, scheduleType) =>
  getText(dataUrl)
    .map(csvToJson)
    .map(R.map(normalizeSchedule))
    .map(R.tap(console.log))
    .map(scheduleFor(date, scheduleType))
    .chain(resultToFuture);
