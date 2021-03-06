/* tslint:disable:max-line-length */
import { AmError } from '../../../src/barrels/am-error';
import { ApStruct } from '../../../src/barrels/ap-struct';
import { api } from '../../../src/barrels/api';
import { interfaces } from '../../../src/barrels/interfaces';

//

// yarn jest test/sql/06_calc_refs_calc/v16_model_calc_refs_own_calc.test.ts
jest.setTimeout(30000);
test('testName', () => {
  let query = [
    '#standardSQL',
    `CREATE TEMPORARY FUNCTION mprove_array_sum(ar ARRAY<STRING>) AS
  ((SELECT SUM(CAST(REGEXP_EXTRACT(val, \'\\\\|\\\\|(\\\\-?\\\\d+(?:.\\\\d+)?)$\') AS FLOAT64)) FROM UNNEST(ar) as val));`,
    'WITH',
    '  model_main AS (',
    '    SELECT',
    `      COALESCE(mprove_array_sum(ARRAY_AGG(DISTINCT CONCAT(CONCAT(CAST(a.dim4 + 200 AS STRING), '||'), CAST(a.dim2 + 100 AS STRING)))), 0) as mf_mea2,`,
    '      MIN((555)) as mf_mea3',
    '    FROM (',
    '      SELECT',
    '        (111) + 222 as dim2,',
    '        (333) + 444 as dim4',
    '      FROM `1`',
    '      ) as a',
    '  )',
    '',
    'SELECT',
    '  (mf_mea2 + mf_mea3) + 700 as mf_calc2',
    'FROM model_main',
    '',
    'LIMIT 500'
  ];

  expect.assertions(query.length);

  return ApStruct.rebuildStruct({
    dir: 'test/sql/06_calc_refs_calc/v16',
    weekStart: api.ProjectWeekStartEnum.Monday,
    bqProject: 'flow-1202',
    projectId: 'unkProjectId',
    structId: 'unkStructId'
  }).then((struct: interfaces.Struct) => {
    struct.dashboards[0].reports[0].bq_views[0].sql.forEach((element, i, a) => {
      expect(element).toEqual(query[i]);
    });
  });
});
