import { module, test } from 'qunit';

import DS from 'ember-data';
import moduleForIntegration from '../../helpers/module-for-pouch-acceptance';

import Ember from 'ember';

import config from 'dummy/config/environment';

/*
 * Tests basic CRUD behavior for an app using the ember-pouch adapter.
 */

		
moduleForIntegration('Integration | Adapter | Basic CRUD Ops', {}, function() {

let allTests = function() {
	
test('can find all', function (assert) {
  assert.expect(3);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().bulkDocs([
      { _id: 'tacoSoup_2_A', data: { flavor: 'al pastor' } },
      { _id: 'tacoSoup_2_B', data: { flavor: 'black bean' } },
      { _id: 'burritoShake_2_X', data: { consistency: 'smooth' } }
    ]);
  }).then(() => {
    return this.store().findAll('taco-soup');
  }).then((found) => {
    assert.equal(found.get('length'), 2, 'should have found the two taco soup items only');
    assert.deepEqual(found.mapBy('id'), ['A', 'B'],
      'should have extracted the IDs correctly');
    assert.deepEqual(found.mapBy('flavor'), ['al pastor', 'black bean'],
      'should have extracted the attributes also');
  }).finally(done);
});

test('can find one', function (assert) {
  assert.expect(2);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().bulkDocs([
      { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor' } },
      { _id: 'tacoSoup_2_D', data: { flavor: 'black bean' } },
    ]);
  }).then(() => {
    return this.store().find('taco-soup', 'D');
  }).then((found) => {
    assert.equal(found.get('id'), 'D',
      'should have found the requested item');
    assert.deepEqual(found.get('flavor'), 'black bean',
      'should have extracted the attributes also');
  }).finally(done);
});

test('can query with sort', function (assert) {
  assert.expect(3);
  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().createIndex({ index: {
      fields: ['data.name'] }
    }).then(() => {
      return this.db().bulkDocs([
        { _id: 'smasher_2_mario', data: { name: 'Mario', series: 'Mario', debut: 1981 }},
        { _id: 'smasher_2_puff', data: { name: 'Jigglypuff', series: 'Pokemon', debut: 1996 }},
        { _id: 'smasher_2_link', data: { name: 'Link', series: 'Zelda', debut: 1986 }},
        { _id: 'smasher_2_dk', data: { name: 'Donkey Kong', series: 'Mario', debut: 1981 }},
        { _id: 'smasher_2_pika', data: { name: 'Pikachu', series: 'Pokemon', _id: 'pikachu', debut: 1996 }}
      ]);
    });
  }).then(() => {
    return this.store().query('smasher', {
      filter: {name: {$gt: ''}},
      sort: ['name']
    });
  }).then((found) => {
    assert.equal(found.get('length'), 5, 'should returns all the smashers ');
    assert.deepEqual(found.mapBy('id'), ['dk','puff','link','mario','pika'],
      'should have extracted the IDs correctly');
    assert.deepEqual(found.mapBy('name'), ['Donkey Kong', 'Jigglypuff', 'Link', 'Mario','Pikachu'],
      'should have extracted the attributes also');
  }).finally(done);
});

test('can query multi-field queries', function (assert) {
  assert.expect(3);
  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().createIndex({ index: {
      fields: ['data.series', 'data.debut'] }
    }).then(() => {
      return this.db().bulkDocs([
        { _id: 'smasher_2_mario', data: { name: 'Mario', series: 'Mario', debut: 1981 }},
        { _id: 'smasher_2_puff', data: { name: 'Jigglypuff', series: 'Pokemon', debut: 1996 }},
        { _id: 'smasher_2_link', data: { name: 'Link', series: 'Zelda', debut: 1986 }},
        { _id: 'smasher_2_dk', data: { name: 'Donkey Kong', series: 'Mario', debut: 1981 }},
        { _id: 'smasher_2_pika', data: { name: 'Pikachu', series: 'Pokemon', _id: 'pikachu', debut: 1996 }}
      ]);
    });
  }).then(() => {
    return this.store().query('smasher', {
      filter: {series: 'Mario' },
      sort: [
        {series: 'desc'},
        {debut: 'desc'}]
    });
  }).then((found) => {
    assert.equal(found.get('length'), 2, 'should have found the two smashers');
    assert.deepEqual(found.mapBy('id'), ['mario', 'dk'],
      'should have extracted the IDs correctly');
    assert.deepEqual(found.mapBy('name'), ['Mario', 'Donkey Kong'],
      'should have extracted the attributes also');
  }).finally(done);
});

test('queryRecord returns null when no record is found', function (assert) {
  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().createIndex({ index: {
      fields: ['data.flavor'] }
    }).then(() => {
      return this.db().bulkDocs([
        { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor', ingredients: ['X', 'Y'] } },
        { _id: 'tacoSoup_2_D', data: { flavor: 'black bean', ingredients: ['Z'] } },
        { _id: 'foodItem_2_X', data: { name: 'pineapple' }},
        { _id: 'foodItem_2_Y', data: { name: 'pork loin' }},
        { _id: 'foodItem_2_Z', data: { name: 'black beans' }}
      ]);
    });
  }).then(() => {
    return this.store().queryRecord('taco-soup', {
      filter: {flavor: 'all pastor' }
    });
  }).then((found) => {
    assert.equal(found, null, 'should be null');
    done();
  }).catch((error) => {
    console.error('error in test', error);
    assert.ok(false, 'error in test:' + error);
    done();
  });
});

function savingHasMany() {
	return !config.emberpouch.dontsavehasmany;
}

function getDocsForRelations() {
	let result = [];
	
	let c = { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor' } };
	if (savingHasMany()) { c.data.ingredients = ['X', 'Y']; }
	result.push(c);
	
	let d = { _id: 'tacoSoup_2_D', data: { flavor: 'black bean' } };
	if (savingHasMany()) { d.data.ingredients = ['Z']; }
	result.push(d);
	
	result.push({ _id: 'foodItem_2_X', data: { name: 'pineapple', soup: 'C' }});
	result.push({ _id: 'foodItem_2_Y', data: { name: 'pork loin', soup: 'C' }});
	result.push({ _id: 'foodItem_2_Z', data: { name: 'black beans', soup: 'D' }});
    
    return result;
}

test('can query one record', function (assert) {
  assert.expect(1);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().createIndex({ index: {
      fields: ['data.flavor'] }
    }).then(() => {
      return this.db().bulkDocs(getDocsForRelations());
    });
  }).then(() => {
    return this.store().queryRecord('taco-soup', {
      filter: {flavor: 'al pastor' }
    });
  }).then((found) => {
    assert.equal(found.get('flavor'), 'al pastor',
      'should have found the requested item');
  }).finally(done);
});

test('can query one associated records', function (assert) {
  assert.expect(3);
  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().createIndex({ index: {
      fields: ['data.flavor'] }
    }).then(() => {
      return this.db().bulkDocs(getDocsForRelations());
    });
  }).then(() => {
    return this.store().queryRecord('taco-soup', {
      filter: {flavor: 'al pastor' }});
  }).then((found) => {
    assert.equal(found.get('flavor'), 'al pastor',
      'should have found the requested item');
    return found.get('ingredients');
  }).then((foundIngredients) => {
    assert.deepEqual(foundIngredients.mapBy('id'), ['X', 'Y'],
      'should have found both associated items');
    assert.deepEqual(foundIngredients.mapBy('name'), ['pineapple', 'pork loin'],
      'should have fully loaded the associated items');
  }).finally(done);
});

test('can find associated records', function (assert) {
  assert.expect(3);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().bulkDocs(getDocsForRelations());
  }).then(() => {
    return this.store().find('taco-soup', 'C');
  }).then((found) => {
    assert.equal(found.get('id'), 'C',
      'should have found the requested item');
    return found.get('ingredients');
  }).then((foundIngredients) => {
    assert.deepEqual(foundIngredients.mapBy('id'), ['X', 'Y'],
      'should have found both associated items');
    assert.deepEqual(foundIngredients.mapBy('name'), ['pineapple', 'pork loin'],
      'should have fully loaded the associated items');
  }).finally(done);
});

test('create a new record', function (assert) {
  assert.expect(2);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    var newSoup = this.store().createRecord('taco-soup', { id: 'E', flavor: 'balsamic' });
    return newSoup.save();
  }).then(() => {
    return this.db().get('tacoSoup_2_E');
  }).then((newDoc) => {
    assert.equal(newDoc.data.flavor, 'balsamic', 'should have saved the attribute');

    var recordInStore = this.store().peekRecord('tacoSoup', 'E');
    assert.equal(newDoc._rev, recordInStore.get('rev'),
      'should have associated the ember-data record with the rev for the new record');

  }).finally(done);
});

test('creating an associated record stores a reference to it in the parent', function (assert) {
  assert.expect(1);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
  	var s = { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor'} };
  	if (savingHasMany()) {
  		s.data.ingredients = [];
  	}
    return this.db().bulkDocs([
      s
    ]);
  }).then(() => {
    return this.store().findRecord('taco-soup', 'C');
  }).then(tacoSoup => {
    var newIngredient = this.store().createRecord('food-item', {
      name: 'pineapple',
      soup: tacoSoup
    });
	
	//tacoSoup.save() actually not needed in !savingHasmany mode, but should still work
    return newIngredient.save().then(() => savingHasMany() ? tacoSoup.save() : tacoSoup);
  }).then(() => {
  	this.store().unloadAll();
  	
    return this.store().findRecord('taco-soup', 'C');
  }).then(tacoSoup => {
    return tacoSoup.get('ingredients');
  }).then(foundIngredients => {
    assert.deepEqual(foundIngredients.mapBy('name'), ['pineapple'],
      'should have fully loaded the associated items');
  }).finally(done);
});

// This test fails due to a bug in ember data
// (https://github.com/emberjs/data/issues/3736)
// starting with ED v2.0.0-beta.1. It works again with ED v2.1.0.
if (!DS.VERSION.match(/^2\.0/)) {
  test('update an existing record', function (assert) {
    assert.expect(2);

    var done = assert.async();
    Ember.RSVP.Promise.resolve().then(() => {
      return this.db().bulkDocs([
        { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor' } },
        { _id: 'tacoSoup_2_D', data: { flavor: 'black bean' } },
      ]);
    }).then(() => {
      return this.store().find('taco-soup', 'C');
    }).then((found) => {
      found.set('flavor', 'pork');
      return found.save();
    }).then(() => {
      return this.db().get('tacoSoup_2_C');
    }).then((updatedDoc) => {
      assert.equal(updatedDoc.data.flavor, 'pork', 'should have updated the attribute');

      var recordInStore = this.store().peekRecord('tacoSoup', 'C');
      assert.equal(updatedDoc._rev, recordInStore.get('rev'),
        'should have associated the ember-data record with the updated rev');

    }).finally(done);
  });
}

test('delete an existing record', function (assert) {
  assert.expect(1);

  var done = assert.async();
  Ember.RSVP.Promise.resolve().then(() => {
    return this.db().bulkDocs([
      { _id: 'tacoSoup_2_C', data: { flavor: 'al pastor' } },
      { _id: 'tacoSoup_2_D', data: { flavor: 'black bean' } },
    ]);
  }).then(() => {
    return this.store().find('taco-soup', 'C');
  }).then((found) => {
    return found.destroyRecord();
  }).then(() => {
    return this.db().get('tacoSoup_2_C');
  }).then((doc) => {
    assert.ok(!doc, 'document should no longer exist');
  }, (result) => {
    assert.equal(result.status, 404, 'document should no longer exist');
  }).finally(done);
});

};

	let syncAsync = function() {
		module('async', {
			beforeEach: function() {
				config.emberpouch.async = true;
			}
		}, allTests);
		module('sync', {
			beforeEach: function() {
				config.emberpouch.async = false;
			}
		}, allTests);
	};
	
	module('dont save hasMany', {
		beforeEach: function() {
			config.emberpouch.dontsavehasmany = true;
		}
	}, syncAsync);
	
	module('save hasMany', {
		beforeEach: function() {
			config.emberpouch.dontsavehasmany = false;
		}
	}, syncAsync);
});
