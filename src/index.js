import * as R from 'ramda';
import Future from 'folktale/concurrency/future';

import { asDateString, asDate, now } from './utils';
import { findSchedule } from './schedule';

// scheduleMarkup :: { items, pickupDay } -> HTML String
const scheduleMarkup = R.evolve({
  items: items =>
    items
      .map(
        (item, idx) =>
          `<span class="${
            idx < items.length - 1 ? 'mr3' : ''
          }" role="img" aria-label="${item.label}">${item.icon}</span>`,
      )
      .join(''),
});

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

const scheduleForToday = scheduleType =>
  findSchedule(now(), scheduleType)
    .map(scheduleComponent)
    .orElse(Future.of);

// cssQuery :: String -> Node -> NodeList
const cssQuery = R.invoker(1, 'querySelector');

// render :: PickupDayElement -> ItemsElement -> Markup -> Element
const render = R.lift(itemsEl => pickupDayEl => data => {
  pickupDayEl.textContent = data.pickupDay;
  itemsEl.innerHTML = data.items;
});

// calendarOnChange :: Element -> void
const calendarOnChange = el => {
  const scheduleType = el.target.value;
  trashPanda(scheduleType);
};

/**
 * Trash Panda App
 */
Future.of(cssQuery('#js-calendar', document)).map(el => {
  el.onchange = calendarOnChange;
});

const trashPanda = scheduleType =>
  render(
    Future.of(cssQuery('#js-items', document)),
    Future.of(cssQuery('#js-pickup-date', document)),
    scheduleForToday(scheduleType),
  );

// Initialize
trashPanda('Thursday1');
