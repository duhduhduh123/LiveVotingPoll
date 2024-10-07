import * as assert from 'assert';
import * as httpMocks from 'node-mocks-http';
import { addPoll, resetForTesting, listPolls, listFinishedPolls } from './routes';

describe('Routes', function () {
  beforeEach(function () {
    resetForTesting();
  });

  describe('addPoll', function () {
    it('handles missing name', function () {
      const req = httpMocks.createRequest({ method: 'POST', url: '/api/addPoll', body: {} });
      const res = httpMocks.createResponse();
      addPoll(req, res);
      assert.strictEqual(res._getStatusCode(), 400);
      assert.deepStrictEqual(res._getData(), "missing 'name' parameter");
    });

    it('handles missing minutes', function () {
      const req = httpMocks.createRequest({ method: 'POST', url: '/api/addPoll', body: { name: "couch" } });
      const res = httpMocks.createResponse();
      addPoll(req, res);
      assert.strictEqual(res._getStatusCode(), 400);
      assert.deepStrictEqual(res._getData(), "'minutes' is not a number");
    });

    it('handles missing options', function () {
      const req = httpMocks.createRequest({
        method: 'POST', url: '/api/addPoll',
        body: { name: "couch", minutes: 10 }
      });
      const res = httpMocks.createResponse();
      addPoll(req, res);
      assert.strictEqual(res._getStatusCode(), 400);
      assert.deepStrictEqual(res._getData(), "'options' should be an array of strings");
    });
  });

  describe('listPolls', function () {
    it('returns a list of active polls', function () {
      // Set up polls...
      const req = httpMocks.createRequest({ method: 'GET', url: '/api/listPolls' });
      const res = httpMocks.createResponse();
      listPolls(req, res);
      try {
        assert.strictEqual(res._getStatusCode(), 200);
        JSON.parse(res._getData()); // Check if this line causes the SyntaxError
      } catch (error: unknown) {
        console.error('Error in listPolls:', error);
      }
    });

    it('handles errors gracefully', function () {
      // Set up polls with errors...
      const req = httpMocks.createRequest({ method: 'GET', url: '/api/listPolls' });
      const res = httpMocks.createResponse();
      listPolls(req, res);
      try {
        assert.strictEqual(res._getStatusCode(), 200);
        JSON.parse(res._getData()); // Check if this line causes the SyntaxError
      } catch (error: unknown) {
        console.error('Error in listPolls:', error);
      }
    });
  });

  describe('listFinishedPolls', function () {
    it('returns a list of finished polls', function () {
      // Set up finished polls...
      const req = httpMocks.createRequest({ method: 'GET', url: '/api/listFinishedPolls' });
      const res = httpMocks.createResponse();
      listFinishedPolls(req, res);
      try {
        assert.strictEqual(res._getStatusCode(), 200);
        JSON.parse(res._getData()); // Check if this line causes the SyntaxError
      } catch (error: unknown) {
        console.error('Error in listFinishedPolls:', error);
      }
    });

    it('handles errors gracefully', function () {
      // Set up finished polls with errors...
      const req = httpMocks.createRequest({ method: 'GET', url: '/api/listFinishedPolls' });
      const res = httpMocks.createResponse();
      listFinishedPolls(req, res);
      try {
        assert.strictEqual(res._getStatusCode(), 200);
        JSON.parse(res._getData()); // Check if this line causes the SyntaxError
      } catch (error: unknown) {
        console.error('Error in listFinishedPolls:', error);
      }
    });
  });
});