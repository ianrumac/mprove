import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { from, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import * as actions from '@app/store-actions/actions';
import * as actionTypes from '@app/store-actions/action-types';

@Injectable()
export class EditMemberSuccessEffect {
  @Effect() editMemberSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(actionTypes.EDIT_MEMBER_SUCCESS),
    mergeMap((action: actions.EditMemberSuccessAction) =>
      from([new actions.UpdateMembersStateAction([action.payload.member])])
    )
  );

  constructor(private actions$: Actions) {}
}
