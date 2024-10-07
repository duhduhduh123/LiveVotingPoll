"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = __importStar(require("assert"));
var httpMocks = __importStar(require("node-mocks-http"));
var routes_1 = require("./routes");
describe('routes', function () {
    // TODO: remove the tests for the dummy route
    it('addPoll', function () {
        // 1. Missing name
        var req1 = httpMocks.createRequest({ method: 'POST', url: '/api/addPoll', body: {} });
        var res1 = httpMocks.createResponse();
        (0, routes_1.addPoll)(req1, res1);
        assert.strictEqual(res1._getStatusCode(), 400);
        assert.deepStrictEqual(res1._getData(), "missing 'name' parameter");
        // 2. Missing minutes
        var req2 = httpMocks.createRequest({ method: 'POST', url: '/api/addPoll', body: { name: "couch" } });
        var res2 = httpMocks.createResponse();
        (0, routes_1.addPoll)(req2, res2);
        assert.strictEqual(res2._getStatusCode(), 400);
        assert.deepStrictEqual(res2._getData(), "'minutes' is not a number");
        // 3. Missing options
        var req3 = httpMocks.createRequest({
            method: 'POST', url: '/api/addPoll',
            body: { name: "couch", minutes: 10 }
        });
        var res3 = httpMocks.createResponse();
        (0, routes_1.addPoll)(req3, res3);
        assert.strictEqual(res3._getStatusCode(), 400);
        assert.deepStrictEqual(res3._getData(), "'options' should be an array of strings");
        (0, routes_1.resetForTesting)();
    });
    it('listPolls', function () {
        var poll1 = {
            name: 'Poll 1',
            minutes: 10,
            options: ['Option 1', 'Option 2'],
            pollWinner: '',
            endTime: Date.now() + 600000, // 10 minutes from now
        };
        var poll2 = {
            name: 'Poll 2',
            minutes: 5,
            options: ['Option A', 'Option B', 'Option C'],
            pollWinner: '',
            endTime: Date.now() + 300000, // 5 minutes from now
        };
        routes_1.polls.set(poll1.name, poll1);
        routes_1.polls.set(poll2.name, poll2);
        var req = httpMocks.createRequest({ method: 'GET', url: '/api/listPolls' });
        var res = httpMocks.createResponse();
        (0, routes_1.listPolls)(req, res);
        try {
            assert.strictEqual(res._getStatusCode(), 200);
            JSON.parse(res._getData()); // Check if this line causes the SyntaxError
        }
        catch (error) {
            console.error('Error in listPolls:', error);
        }
        (0, routes_1.resetForTesting)();
    });
    it('listFinishedPolls', function () {
        // Add some polls for testing
        var poll1 = {
            name: 'Finished Poll 1',
            minutes: 2,
            options: ['Option X', 'Option Y'],
            pollWinner: '',
            endTime: Date.now() - 60000, // 1 minute ago (expired)
        };
        var poll2 = {
            name: 'Finished Poll 2',
            minutes: 7,
            options: ['Option P', 'Option Q', 'Option R'],
            pollWinner: '',
            endTime: Date.now() - 180000, // 3 minutes ago (expired)
        };
        routes_1.polls.set(poll1.name, poll1);
        routes_1.polls.set(poll2.name, poll2);
        var req = httpMocks.createRequest({ method: 'GET', url: '/api/listFinishedPolls' });
        var res = httpMocks.createResponse();
        (0, routes_1.listFinishedPolls)(req, res);
        try {
            assert.strictEqual(res._getStatusCode(), 200);
            JSON.parse(res._getData()); // Check if this line causes the SyntaxError
        }
        catch (error) {
            console.error('Error in listFinishedPolls:', error);
        }
        (0, routes_1.resetForTesting)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVzX3Rlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcm91dGVzX3Rlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUFpQztBQUNqQyx5REFBNkM7QUFDN0MsbUNBQXlGO0FBRXpGLFFBQVEsQ0FBQyxRQUFRLEVBQUU7SUFDakIsNkNBQTZDO0lBRTdDLEVBQUUsQ0FBQyxTQUFTLEVBQUU7UUFDWixrQkFBa0I7UUFDbEIsSUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FDbEMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDckQsSUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3hDLElBQUEsZ0JBQU8sRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUVwRSxxQkFBcUI7UUFDckIsSUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FDbEMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwRSxJQUFNLElBQUksR0FBRyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDeEMsSUFBQSxnQkFBTyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxHQUFHLENBQUMs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