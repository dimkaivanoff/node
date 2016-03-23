/**
 * VisitationRequestsView.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
      VisitationRequestId: {
          type: 'integer',
          primaryKey: true,
          autoIncrement: true
      },

      InmateId: {
          type: 'integer'
      },

      InmateName: {
          type: 'string'
      },

      FacilityName: {
          type: 'string'
      },

      DateCreated: {
          type: 'datetime'
      },

      Status: {
          type: 'string'
      }
  }
};

