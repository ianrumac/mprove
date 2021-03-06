import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import * as actions from '@app/store-actions/actions';
import * as actionTypes from '@app/store-actions/action-types';
import { StateReceivedAction } from '../actions/state-received.action';

@Injectable()
export class StateReceivedEffect {
  @Effect() stateReceived$: Observable<Action> = this.actions$.pipe(
    ofType(actionTypes.STATE_RECEIVED),
    mergeMap((action: StateReceivedAction) => [
      new actions.ConfirmAction({ reply_to: action.payload.info.request_id }),
      new actions.UpdateLayoutLastWebsocketMessageTimestampAction(Date.now())
    ])
  );

  constructor(private actions$: Actions) {}
}
