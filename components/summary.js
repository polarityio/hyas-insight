polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  isPhoneEntity: false,
  init() {
    if (this.get('block.entity.type') === 'custom') {
      if (this.get('block.entity.types').includes('custom.phone'))
        this.set('isPhoneEntity', true);
    }
    this._super(...arguments);
  }
});
