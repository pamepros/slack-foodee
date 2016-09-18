const path = require('path');
const nock = require('nock');

const Commands = require('../lib/commands.js');
const db = require('../lib/models');

const nockFixtures = {
  goodSignin: () => {
    nock('https://www.food.ee')
      .post('/api/v2/users/sign_in')
      .replyWithFile(200, path.join(__dirname, 'fixtures/nock_foodee_signin_good.json'));
  },
  badSignin: () => {
    nock('https://www.food.ee')
      .post('/api/v2/users/sign_in')
      .replyWithFile(401, path.join(__dirname, 'fixtures/nock_foodee_signin_bad.json'));
  },
  goodOrders: () => {
    nock('https://www.food.ee')
      .get('/api/v2/orders')
      .query({ page: 1, per_page: 25, when: 'future' })
      .replyWithFile(200, path.join(__dirname, 'fixtures/nock_foodee_orders_good.json'), { 'Content-Type': 'application/json' });
  },
  badOrders: () => {
    nock('https://www.food.ee')
      .get('/api/v2/orders')
      .query({ page: 1, per_page: 25, when: 'future' })
      .replyWithFile(200, path.join(__dirname, 'fixtures/nock_foodee_orders_bad.json'));
  },
  goodOrder: () => {
    nock('https://www.food.ee')
      .get('/api/v2/group_orders')
      .query({ uuid: 'db079f36-8365-4c65-96fd-5f4ad27a76af' })
      .replyWithFile(200, path.join(__dirname, 'fixtures/nock_foodee_order_good.json'), { 'Content-Type': 'application/json' });
  },
};


describe('commands', function () {
  before(async () => {
    nock.disableNetConnect();
    await db.syncAll({ force: true });
  });
  beforeEach(() => db.destroyAll());
  afterEach(() => nock.cleanAll());
  after(() => {
    nock.enableNetConnect();
  });

  beforeEach(function () {
    this.req = {
      body: { team_id: 1, user_id: 1 },
      log: {},
      data: db,
    };
    this.res = { };
    this.commands = new Commands(this.req, this.res);
  });
  describe('usage', function () {
    it('no parameters', function () {
      return this.commands.usage().then(function (results) {
        results.response_type.should.eql('ephemeral');
        results.text.should.match(/^Usage:/);
      });
    });
    it('error message', function () {
      return this.commands.usage('Error message').then(function (results) {
        results.response_type.should.eql('ephemeral');
        results.text.should.match(/^\*Error message\*\nUsage:/);
      });
    });
  });
  describe('login', function () {
    it('no parameters should output usage', function () {
      return this.commands.login().then(function (results) {
        results.response_type.should.eql('ephemeral');
        results.text.should.match(/No username provided/);
      });
    });
    it('only username should output usage', function () {
      return this.commands.login('username').then(function (results) {
        results.response_type.should.eql('ephemeral');
        results.text.should.match(/No password provided/);
      });
    });
    it('correct username and password should login', function () {
      nockFixtures.goodSignin();
      return this.commands.login('username', 'password').then(function (results) {
        results.response_type.should.eql('ephemeral');
        results.text.should.match(/Logged in/);
      });
    });
    it('incorrect username and password shouldnt login', function () {
      nockFixtures.badSignin();
      return this.commands.login('username', 'password').should.be.rejected();
    });
  });
  describe('date', function () {
    it('not logged in should error', async function () {
      this.req.foodee_user = null;

      const results = await this.commands.date();
      results.response_type.should.eql('ephemeral');
      results.text.should.match(/Not logged in/);
    });

    it('logged in and return so', async function () {
      nockFixtures.goodSignin();
      nockFixtures.badOrders();
      this.req.foodee_user = { username: 'gavin', password: 'password' };

      const results = await this.commands.date('2016-09-19');
      results.should.eql({
        response_type: 'ephemeral',
        text: 'No orders for 2016-09-19',
      });
    });

    it('logged in and an order for date', async function () {
      nockFixtures.goodSignin();
      nockFixtures.goodOrders();
      nockFixtures.goodOrder();
      this.req.foodee_user = { username: 'gavin', password: 'password' };

      const results = await this.commands.date('2016-09-19');
      results.should.eql({
        response_type: 'in_channel',
        text: [
          '*2016-09-19*',
          '*Person 1*',
          '2x Rendang Beef Express (gf)',
          '2x Satay Chicken (df)',
          '*Person 2*',
          'Gulai Fish Fillet (df,gf)',
          '*Person 3*',
          'Boneless Curry Chicken (df,gf)',
          '*Person 4*',
          '2x Roti Canai (v)',
          '2x Satay Chicken (df)',
          '*Person 5.*',
          'Boneless Curry Chicken (df,gf)',
          'Roti Canai (v)',
        ].join('\n')
      });
    });
  });
});
