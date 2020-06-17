'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  activeTab: 'passivedns',
  errorMsg: '',
  actions: {
    changeTab: function(tabName) {
      this.set('activeTab', tabName);
    }
  },
  onDetailsError(err) {
    this.set('errorMessage', err.meta.detail);
  }
});