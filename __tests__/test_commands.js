require('should');
const fixtures = require('./__fixtures.js');

const Foodee = require('../lib/foodee.js');
const Commands = require('../lib/commands.js');
const db = require('../lib/models');

describe('commands', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeAll(async () => db.syncAll({ force: true }));
  beforeEach(() => db.destroyAll());

  beforeEach(() => {
    testContext.req = {
      body: { team_id: 1, user_id: 1 },
      log: {},
      data: db
    };
    testContext.res = {};
    testContext.commands = new Commands(testContext.req, testContext.res);
    testContext.foodee_mocks = {
      getFutureOrders: () =>
        Promise.resolve(fixtures.lib_foodee_good_get_future_orders),
      getPastOrders: () =>
        Promise.resolve(fixtures.lib_foodee_good_get_past_orders),
      getOrder: () => Promise.resolve(fixtures.lib_foodee_good_order)
    };

    testContext.commands.getFoodee = () => testContext.foodee_mocks;
  });
  describe('usage', () => {
    test('no parameters', () => {
      return testContext.commands.usage().then(function (results) {
        expect(results.response_type).toEqual('ephemeral');
        expect(results.text).toMatch(/^Usage:/);
      });
    });
    test('error message', () => {
      return testContext.commands
        .usage('Error message')
        .then(function (results) {
          expect(results.response_type).toEqual('ephemeral');
          expect(results.text).toMatch(/^\*Error message\*\nUsage:/);
        });
    });
  });
  describe('login', () => {
    test('no parameters should output usage', () => {
      return testContext.commands.login().then(function (results) {
        expect(results.response_type).toEqual('ephemeral');
        expect(results.text).toMatch(/No username provided/);
      });
    });
    test('only username should output usage', () => {
      return testContext.commands.login('username').then(function (results) {
        expect(results.response_type).toEqual('ephemeral');
        expect(results.text).toMatch(/No password provided/);
      });
    });
    test('correct username and password should login', async () => {
      testContext.foodee_mocks.login = () =>
        Promise.resolve(fixtures.lib_foodee_good_login);
      const results = await testContext.commands.login('username', 'password');
      results.should.not.have.keys('response_type');
      results.text.should.match(/Logged in/);
    });
    test('incorrect username and password shouldnt login', async () => {
      testContext.foodee_mocks.login = () =>
        Promise.reject(new Foodee.BadCredentials());
      const results = await testContext.commands.login('username', 'password');
      results.should.not.have.keys('response_type');
      results.text.should.match(/Bad Username or password/);
    });
  });
  describe('date', () => {
    test('not logged in should error', async () => {
      testContext.req.foodee_user = null;

      const results = await testContext.commands.date();
      expect(results.response_type).toEqual('ephemeral');
      expect(results.text).toMatch(/Not logged in/);
    });

    test('logged in and return so', async () => {
      testContext.foodee_mocks.getPastOrders = testContext.foodee_mocks.getFutureOrders = () =>
        Promise.resolve(fixtures.lib_foodee_bad_get_future_orders);
      testContext.req.foodee_user = {
        username: 'gavin',
        password: 'password',
        token: 'something',
        email: 'yo@yo.com'
      };

      const results = await testContext.commands.date('2015-09-19');
      expect(results).toEqual({
        response_type: 'ephemeral',
        text: 'No orders for 2015-09-19'
      });
    });

    test('logged in and an order for date', async () => {
      testContext.req.foodee_user = {
        username: 'gavin',
        password: 'password',
        token: 'something',
        email: 'yo@yo.com'
      };

      const results = await testContext.commands.date('2016-09-19');
      expect(results).toEqual(

        {
          'attachments': [
            {
              'author_name': "Finch's Teahouse",
              'fields': [
                {
                  'short': true,
                  'title': 'User 1',
                  'value': 'Cajun Burger'
                },
                {
                  'short': true,
                  'title': 'User 10',
                  'value': 'Veggie Burger'
                },
                {
                  'short': true,
                  'title': 'User 11',
                  'value': 'Chicken Tenders (Serves 2-3)\nGood Drink Mango Iced Tea'
                },
                {
                  'short': true,
                  'title': 'User 12',
                  'value': 'Cajun Burger'
                },
                {
                  'short': true,
                  'title': 'User 13',
                  'value': 'Chicken Tenders (Serves 2-3)\nCultery\nGarlic Bread\nPlates'
                },
                {
                  'short': true,
                  'title': 'User 14',
                  'value': 'Cajun Burger'
                },
                {
                  'short': true,
                  'title': 'User 15',
                  'value': 'Beef Dip'
                },
                {
                  'short': true,
                  'title': 'User 16',
                  'value': 'Maple Salmon Burger'
                },
                {
                  'short': true,
                  'title': 'User 2',
                  'value': 'Caesar Salad '
                },
                {
                  'short': true,
                  'title': 'User 3',
                  'value': 'Perogies '
                },
                {
                  'short': true,
                  'title': 'User 4',
                  'value': 'Cajun Burger'
                },
                {
                  'short': true,
                  'title': 'User 5',
                  'value': 'Pulled Pork Sandwich'
                },
                {
                  'short': true,
                  'title': 'User 6',
                  'value': '2x Good Drink Mango Iced Tea\nFish Tacos  (Serves 2-3)'
                },
                {
                  'short': true,
                  'title': 'User 7',
                  'value': 'Veggie Burger'
                },
                {
                  'short': true,
                  'title': 'User 8',
                  'value': 'Shrimp & Avocado Wrap'
                },
                {
                  'short': true,
                  'title': 'User 9',
                  'value': 'Quinoa'
                }
              ],
              'pretext': '2016-09-19',
              'thumb_url': 'https://uploads.food.ee/uploads/images/restaurants/full_Finches02.jpg',
              'ts': 1502909100
            }
          ],
          'response_type': 'in_channel'
        }
      );
    });
  });
});
