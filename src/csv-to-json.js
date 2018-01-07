import * as R from 'ramda';

const lowerFirstLetter = str => str.charAt(0).toLowerCase() + str.slice(1);

const objFromTable = (keys, values) => R.map(R.zipObj(keys), values);

const normalizeHeaders = R.adjust(R.map(lowerFirstLetter), 0);

// csvToJson :: CSV -> [Schedule]
export const csvToJson = R.compose(
  R.converge(objFromTable, [R.head, R.tail]),
  normalizeHeaders,
  R.map(R.split(',')),
  R.split('\n'),
);
