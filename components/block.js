'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entityType: Ember.computed.alias('block.entity.type'),
  activeTab: '',
  errorMsg: '',
  initialActiveTabMap: {
    IPv4: 'passivednsip',
    IPv6: 'passivednsip',
    md5: 'sample',
    domain: 'passivedns',
    email: 'whoisemail',
    custom: 'whoisemail'
  },
  isPhoneEntity: false,
  init() {
    if (this.get('block.entity.type') === 'custom') {
      if (this.get('block.entity.types').includes('custom.phone'))
        this.set('isPhoneEntity', true);
    }
    this.set('activeTab', this.get('initialActiveTabMap')[this.get('entityType')]);
    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    }
  },
  onDetailsError(err) {
    this.set('errorMessage', err.meta.detail);
  }
});
