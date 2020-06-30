'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias("block.data.details"),
  entityType: Ember.computed.alias("block.entity.type"),
  activeTab: "",
  errorMsg: "",
  initialActiveTabMap: {
    IPv4: "passivedns",
    IPv6: "deviceGeov6",
    hash: "sample",
    domain: "passivedns",
    email: "whoisemail",
  },
  init() {
    this.set(
      "activeTab",
      this.get("initialActiveTabMap")[this.get("entityType")]
    );
    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set("activeTab", tabName);
    },
  },
  onDetailsError(err) {
    this.set("errorMessage", err.meta.detail);
  },
});