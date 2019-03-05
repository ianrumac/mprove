import { ngrxType } from '@app/ngrx/ngrx-type';

export const CANCEL_SUBSCRIPTIONS = ngrxType('CANCEL_SUBSCRIPTIONS');
export const CANCEL_SUBSCRIPTIONS_SUCCESS = ngrxType(
  'CANCEL_SUBSCRIPTIONS_SUCCESS'
);
export const CANCEL_SUBSCRIPTIONS_FAIL = ngrxType('CANCEL_SUBSCRIPTIONS_FAIL');

export const SWITCH_ANALYTICS_SUBSCRIPTION_PLAN = ngrxType(
  'SWITCH_ANALYTICS_SUBSCRIPTION_PLAN'
);
export const SWITCH_ANALYTICS_SUBSCRIPTION_PLAN_SUCCESS = ngrxType(
  'SWITCH_ANALYTICS_SUBSCRIPTION_PLAN_SUCCESS'
);
export const SWITCH_ANALYTICS_SUBSCRIPTION_PLAN_FAIL = ngrxType(
  'SWITCH_ANALYTICS_SUBSCRIPTION_PLAN_FAIL'
);