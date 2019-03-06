import * as apiObjects from '../../objects/_index';

export interface MoveFileRequestBody {
  info: apiObjects.ClientRequest;
  payload: {
    project_id: string;
    repo_id: string;
    file_id: string;
    server_ts: number;
    to_path: string[];
  };
}

export interface MoveFileResponse200Body {
  info: apiObjects.ServerResponse;
  payload: {
    deleted_dev_file: apiObjects.CatalogFile;
    new_dev_file: apiObjects.CatalogFile;
    dev_struct: apiObjects.Struct;
  };
}
