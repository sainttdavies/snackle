import test from 'node:test';
import assert from 'node:assert/strict';
import defaults from '../shared/customization.json' with {type:'json'};
import {validCustomization} from '../shared/customization.mjs';

test('published customer copy preserves dynamic order references',()=>{
  assert.equal(validCustomization(defaults),true);
  const missing=structuredClone(defaults);
  missing.ui.orderReceivedBody='We received your request.';
  assert.equal(validCustomization(missing),false);
});

test('skeleton images, dimensions and service timezone are validated',()=>{
  const unsafe=structuredClone(defaults);
  unsafe.loading.productThumbnail='javascript:alert(1)';
  assert.equal(validCustomization(unsafe),false);
  const count=structuredClone(defaults);
  count.loading.skeletonCount=100;
  assert.equal(validCustomization(count),false);
  const zone=structuredClone(defaults);
  zone.service.timezone='Invalid/Zone';
  assert.equal(validCustomization(zone),false);
});
