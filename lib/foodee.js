const request = require('request-promise');

class Foodee {

  // memoize
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async getToken() {
    if (!this.token || !this.user_id || !this.email) {
      await this.login();
    }
    return;
  }

  login() {
    const options = {
      method: 'POST',
      url: 'https://www.food.ee/api/v2/users/sign_in',
      headers: {
        'cache-control': 'no-cache',
        'x-requested-with': 'XMLHttpRequest',
        accept: 'application/json, text/javascript',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.101 Safari/537.36',
        'accept-language': 'en-CA,en;q=0.8',
      },
      form: {
        user: {
          password: this.password,
          email: this.username,
        },
      },
    };
    return request(options).then(response => JSON.parse(response)).then(response => {
      this.token = response.token;
      this.user_id = response.user_id;
      this.email = response.email;
      return response;
    });
  }

  async getOrders() {
    await this.getToken();
    const options = {
      method: 'GET',
      url: 'https://www.food.ee/api/v2/orders',
      qs: { page: '1', per_page: '25', when: 'future' },
      json: true,
      headers: {
        'cache-control': 'no-cache',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.101 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/vnd.api+json',
        authorization: `Token token="${this.token}", email="${this.email}"`,
      },
    };
    return request(options);
  }

  async getOrder(uuid) {
    await this.getToken();
    const options = {
      method: 'GET',
      url: 'https://www.food.ee/api/v2/group_orders',
      qs: { uuid: uuid },
      json: true,
      headers: {
        'cache-control': 'no-cache',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.101 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/vnd.api+json',
        authorization: `Token token="${this.token}", email="${this.email}"`,
      },
    };
    return request(options);
  }
}

module.exports = Foodee;
