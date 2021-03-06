import { Action } from '@ngrx/store';
import * as api from '@app/api/_index';
import * as actionTypes from '@app/store-actions/action-types';

export class CancelQueriesAction implements Action {
  readonly type = actionTypes.CANCEL_QUERIES;

  constructor(public payload: api.CancelQueriesRequestBody['payload']) {}
}
