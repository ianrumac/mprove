import { createSelector } from '@ngrx/store';

import { getSelectedProjectAnalyticsPlanId } from '@app/store-selectors/get-selected-project/get-selected-project-analytics-plan-id';

export const getSelectedProjectAnalyticsPlanIsBasic = createSelector(
  getSelectedProjectAnalyticsPlanId,
  (analyticsPlanId: number) => {
    return analyticsPlanId === 533802;
  }
);