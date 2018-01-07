import * as R from 'ramda';
import Future from 'folktale/concurrency/future';
import Result from 'folktale/result';

import dataUrl from './data.csv';
import { trace, asDateString, asDate, now } from './utils';
import { findSchedule } from './schedule';

// scheduleMarkup :: { items, pickupDay } -> HTML String
const scheduleMarkup = schedule => `
<h1 class="f3 f1-l mt0 mb4 mb5-ns lh-title">
  Collection Schedule <br />
  <span class="f4 f2-l">${schedule.pickupDay}</span>
</h1>
<div class="flex f1 f-subheadline-l">
  ${schedule.items
    .map(
      item =>
        `<div class="mr4" role="img" aria-label="${item.label}">${
          item.icon
        }</div>`,
    )
    .join('')}
</div>
`;

const itemDetails = {
  christmasTree: {
    icon: '🎄',
    label: 'Christmas Tree',
  },
  garbage: {
    icon: '🗑️',
    label: 'Garbage',
  },
  greenBin: {
    icon: '🥒',
    label: 'Green Bin',
  },
  recycling: {
    icon: '♻️',
    label: 'Recycling',
  },
  yardWaste: {
    icon: '🍂',
    label: 'Yard Waste',
  },
};

// pickupItemIcons :: ItemDetails -> Schedule -> [icons]
const pickupItemIcons = (icons =>
  R.compose(
    R.map(R.prop(R.__, icons)),
    R.keys,
    R.filter(R.identity),
    R.pick(['christmasTree', 'garbage', 'greenBin', 'recycling', 'yardWaste']),
  ))(itemDetails);

// humanizedWeekStarting :: Schedule -> DateString
const humanizedWeekStarting = R.compose(asDateString, R.prop('weekStarting'));

// scheduleComponent :: Schedule -> Markup
const scheduleComponent = R.compose(
  scheduleMarkup,
  R.applySpec({
    items: pickupItemIcons,
    pickupDay: humanizedWeekStarting,
  }),
);

const scheduleForToday = findSchedule(
  /* now() */ asDate('1/10/17'),
  'Thursday1',
)
  .map(scheduleComponent)
  .orElse(Future.of);

/**
 * DOM Stuff
 */
// cssQuery :: String -> Node -> NodeList
const cssQuery = R.invoker(1, 'querySelector');

// setContent :: Element -> Markup -> Element
const setContent = element => markup => {
  element.innerHTML = markup;
  return element;
};

/**
 * Trash Panda App
 */
const render = R.lift(setContent);

render(Future.of(cssQuery('#app', document)), scheduleForToday);
