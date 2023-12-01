polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  isPhoneEntity: Ember.computed('block.entity.types.[]', function () {
    return this.get('block.entity.types').includes('custom.phone');
  })
});
