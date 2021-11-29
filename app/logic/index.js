import { createLogic } from 'redux-logic';

import {
  IMPORT_EXPLORE_SPECIMEN_FROM_JSON,
  IMPORT_EXPLORE_SPECIMEN_FROM_JSON_CANCEL,
  importExploreSpecimenFromJsonFulfilled,
  importExploreSpecimenFromJsonRejected
} from '../actions/app';

export const logic = createLogic({
  type: IMPORT_EXPLORE_SPECIMEN_FROM_JSON,
  cancelType: IMPORT_EXPLORE_SPECIMEN_FROM_JSON_CANCEL,
  latest: true,

  processOptions: {
    dispatchReturn: true,
    successType: importExploreSpecimenFromJsonFulfilled,
    failType: importExploreSpecimenFromJsonRejected
  },

  async process() {
    const res = await httpClient
      .get('https://api.recolnat.org/erecolnat/v1/determinations')
      .then(resp => resp.data.data);
    return res;
  }
});
