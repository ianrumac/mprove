import { Action } from '@ngrx/store';
import * as api from '@app/api/_index';
import * as actionTypes from '@app/store-actions/action-types';

export class CreateFileSuccessAction implements Action {
  readonly type = actionTypes.CREATE_FILE_SUCCESS;

  constructor(public payload: api.CreateFileResponse200Body['payload']) {}
}
