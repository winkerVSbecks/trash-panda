import * as R from 'ramda';
import Future from 'folktale/concurrency/future';
import Result from 'folktale/result';

export const trace = R.tap(console.log);

export const traceW = fn => R.compose(trace, fn);

export const asFuture = R.o(Future.of);

export const promiseToFuture = R.o(Future.fromPromise);

export const asResult = R.o(Result.of);

export const asDate = R.constructN(1, Date);

export const now = R.constructN(0, Date);

export const asDateString = R.invoker(0, 'toDateString');

// resultToFuture :: Result -> Future
export const resultToFuture = r => r.fold(Future.rejected, Future.of);
