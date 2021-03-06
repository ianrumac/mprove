import { Action } from '@ngrx/store';
import * as api from '@app/api/_index';
import * as actionTypes from '@app/store-actions/action-types';

export class RegenerateRepoRemoteWebhookSuccessAction implements Action {
  readonly type = actionTypes.REGENERATE_REPO_REMOTE_WEBHOOK_SUCCESS;

  constructor(
    public payload: api.RegenerateRepoRemoteWebhookResponse200Body['payload']
  ) {}
}
