import { Request, Response } from 'express';
import { getConnection } from 'typeorm';
import { api } from '../../../barrels/api';
import { constants } from '../../../barrels/constants';
import { copier } from '../../../barrels/copier';
import { disk } from '../../../barrels/disk';
import { entities } from '../../../barrels/entities';
import { enums } from '../../../barrels/enums';
import { generator } from '../../../barrels/generator';
import { git } from '../../../barrels/git';
import { helper } from '../../../barrels/helper';
import { interfaces } from '../../../barrels/interfaces';
import { proc } from '../../../barrels/proc';
import { sender } from '../../../barrels/sender';
import { store } from '../../../barrels/store';
import { validator } from '../../../barrels/validator';
import { wrapper } from '../../../barrels/wrapper';
import { ServerError } from '../../server-error';

export async function createMember(req: Request, res: Response) {
  let initId = validator.getRequestInfoInitId(req);

  let payload: api.CreateMemberRequestBody['payload'] = validator.getPayload(
    req
  );

  let userId = req.user.email;

  let storeUsers = store.getUsersRepo();

  let user = await storeUsers
    .findOne(userId)
    .catch(e => helper.reThrow(e, enums.storeErrorsEnum.STORE_USERS_FIND_ONE));

  if (!user) {
    throw new ServerError({ name: enums.otherErrorsEnum.USER_NOT_FOUND });
  }

  let projectId = payload.project_id;
  let memberId = payload.member_id;

  let storeMembers = store.getMembersRepo();

  let projectMember = await storeMembers
    .findOne({
      // including deleted
      project_id: projectId,
      member_id: memberId
    })
    .catch(e =>
      helper.reThrow(e, enums.storeErrorsEnum.STORE_MEMBERS_FIND_ONE)
    );

  if (projectMember && projectMember.deleted === enums.bEnum.FALSE) {
    throw new ServerError({ name: enums.otherErrorsEnum.MEMBER_ALREADY_EXIST });
  }

  let invitedUser = await storeUsers
    .findOne(memberId) // including deleted
    .catch(e => helper.reThrow(e, enums.storeErrorsEnum.STORE_USERS_FIND_ONE));

  if (invitedUser && invitedUser.deleted === enums.bEnum.TRUE) {
    throw new ServerError({
      name: enums.otherErrorsEnum.INVITE_MEMBER_ERROR_USER_DELETED
    });
  }

  let newUser: entities.UserEntity;

  let members: entities.MemberEntity[] = [];

  let repos: entities.RepoEntity[] = [];
  let files: entities.FileEntity[] = [];

  let dashboards: entities.DashboardEntity[] = [];
  let errors: entities.ErrorEntity[] = [];
  let mconfigs: entities.MconfigEntity[] = [];
  let models: entities.ModelEntity[] = [];

  if (!invitedUser) {
    let alias = <string>(
      await proc
        .findAlias(memberId)
        .catch(e => helper.reThrow(e, enums.procErrorsEnum.PROC_FIND_ALIAS))
    );

    newUser = generator.makeUser({
      user_id: memberId,
      email_verified: enums.bEnum.FALSE,
      alias: alias
    });
  }

  let newProjectMember;

  if (projectMember && projectMember.deleted === enums.bEnum.TRUE) {
    projectMember.deleted = enums.bEnum.FALSE;
  } else if (!projectMember) {
    newProjectMember = generator.makeMember({
      user: invitedUser ? invitedUser : newUser,
      project_id: projectId,
      is_editor: enums.bEnum.FALSE,
      is_admin: enums.bEnum.FALSE
    });

    let storeRepos = store.getReposRepo();

    let projectProdRepo = await storeRepos
      .findOne({
        project_id: projectId,
        repo_id: constants.PROD_REPO_ID
      })
      .catch(e =>
        helper.reThrow(e, enums.storeErrorsEnum.STORE_REPOS_FIND_ONE)
      );

    if (!projectProdRepo) {
      throw new ServerError({ name: enums.otherErrorsEnum.REPO_NOT_FOUND });
    }

    await git
      .cloneCentralToDev({
        project_id: projectId,
        dev_repo_id: memberId
      })
      .catch(e =>
        helper.reThrow(e, enums.gitErrorsEnum.GIT_CLONE_CENTRAL_TO_DEV)
      );

    let itemProjectDevCatalog = <interfaces.ItemCatalog>await disk
      .getRepoCatalogNodesAndFiles({
        project_id: projectId,
        repo_id: memberId
      })
      .catch(e =>
        helper.reThrow(
          e,
          enums.diskErrorsEnum.DISK_GET_REPO_CATALOG_NODES_AND_FILES
        )
      );

    let projectDevRepo: entities.RepoEntity = generator.makeRepo({
      project_id: projectId,
      repo_id: memberId,
      nodes: itemProjectDevCatalog.nodes,
      struct_id: projectProdRepo.struct_id // from prod,
    });

    projectDevRepo.pdts_sorted = projectProdRepo.pdts_sorted;
    projectDevRepo.udfs_content = projectProdRepo.udfs_content;

    let itemProjectStructCopy = <interfaces.ItemStructCopy>await copier
      .copyStructFromDatabase({
        project_id: projectId,
        from_repo_id: constants.PROD_REPO_ID,
        to_repo_id: memberId
      })
      .catch(e =>
        helper.reThrow(
          e,
          enums.copierErrorsEnum.COPIER_COPY_STRUCT_FROM_DATABASE
        )
      );

    let {
      dashboards: projectDevDashboards,
      models: projectDevModels,
      errors: projectDevErrors,
      mconfigs: projectDevMconfigs
    } = itemProjectStructCopy;

    members.push(newProjectMember);
    repos.push(projectDevRepo);

    files = helper.makeNewArray(files, itemProjectDevCatalog.files);

    models = helper.makeNewArray(models, projectDevModels);
    mconfigs = helper.makeNewArray(mconfigs, projectDevMconfigs);
    dashboards = helper.makeNewArray(dashboards, projectDevDashboards);
    errors = helper.makeNewArray(errors, projectDevErrors);
  }

  // update server_ts
  let newServerTs = helper.makeTs();

  if (projectMember) {
    projectMember.server_ts = newServerTs;
  }

  if (newProjectMember) {
    newProjectMember.server_ts = newServerTs;
  }

  if (newUser) {
    newUser.server_ts = newServerTs;
  }

  members = helper.refreshServerTs(members, newServerTs);
  repos = helper.refreshServerTs(repos, newServerTs);
  files = helper.refreshServerTs(files, newServerTs);
  models = helper.refreshServerTs(models, newServerTs);
  mconfigs = helper.refreshServerTs(mconfigs, newServerTs);
  dashboards = helper.refreshServerTs(dashboards, newServerTs);
  errors = helper.refreshServerTs(errors, newServerTs);

  // save to database
  let connection = getConnection();

  await connection
    .transaction(async manager => {
      if (projectMember) {
        await store
          .save({
            manager: manager,
            records: {
              members: [projectMember]
            },
            server_ts: newServerTs,
            source_init_id: initId
          })
          .catch(e => helper.reThrow(e, enums.storeErrorsEnum.STORE_SAVE));
      } else {
        await store
          .insert({
            manager: manager,
            records: {
              users: newUser ? [newUser] : [],
              members: members,
              repos: repos,
              files: files,
              models: models,
              mconfigs: mconfigs,
              dashboards: dashboards,
              errors: errors
            },
            server_ts: newServerTs,
            source_init_id: initId
          })
          .catch(e => helper.reThrow(e, enums.storeErrorsEnum.STORE_INSERT));
      }
    })
    .catch(e => helper.reThrow(e, enums.typeormErrorsEnum.TYPEORM_TRANSACTION));

  let member = <entities.MemberEntity>(
    (newProjectMember ? newProjectMember : projectMember)
  );

  let url = process.env.BACKEND_EMAIL_APP_HOST_URL
    ? process.env.BACKEND_EMAIL_APP_HOST_URL
    : payload.url;

  let link = `${url}/project/${projectId}/team`;

  await helper.sendEmail({
    to: memberId,
    subject: `[Mprove] ${user.alias} added you to ${projectId} project team`,
    text: `Project url: ${link}`
  });

  let responsePayload: api.CreateMemberResponse200Body['payload'] = {
    member: wrapper.wrapToApiMember(member)
  };

  sender.sendClientResponse(req, res, responsePayload);
}
