"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteInPoll = exports.addPoll = exports.listFinishedPolls = exports.listPolls = exports.resetForTesting = exports.polls = void 0;
// Map from name to poll details.
/** A map to store information about polls. */
exports.polls = new Map();
/**
 * Testing function to remove all the added polls.
 * @function
 */
var resetForTesting = function () {
    exports.polls.clear();
};
exports.resetForTesting = resetForTesting;
var comparePollTime = function (a, b) {
    var now = Date.now();
    var endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
    var endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
    return endA - endB;
};
/**
 * Returns a list of all the polls, sorted by the time remaining.
 * @function
 * @param {_req: SafeRequest} _req - The request object (unused).
 * @param {SafeResponse} res - The response object to send the sorted polls.
 * @returns {void}
 */
var listPolls = function (_req, res) {
    var vals = Array.from(exports.polls.values());
    vals.sort(comparePollTime);
    res.send({ polls: vals });
};
exports.listPolls = listPolls;
/**
 * Returns a list of closed polls with their closed duration.
 * @function
 * @param {_req: SafeRequest} _req - The request object (unused).
 * @param {SafeResponse} res - The response object to send the closed polls.
 * @returns {void}
 */
var listFinishedPolls = function (_req, res) {
    var e_1, _a;
    var now = Date.now();
    var finishedPolls = Array.from(exports.polls.values()).filter(function (poll) { return !!poll.endTime && poll.endTime <= now; });
    var closedPolls = [];
    try {
        for (var finishedPolls_1 = __values(finishedPolls), finishedPolls_1_1 = finishedPolls_1.next(); !finishedPolls_1_1.done; finishedPolls_1_1 = finishedPolls_1.next()) {
            var poll = finishedPolls_1_1.value;
            var closedDuration = now - poll.endTime;
            closedPolls.push({
                name: poll.name,
                closedDuration: closedDuration,
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (finishedPolls_1_1 && !finishedPolls_1_1.done && (_a = finishedPolls_1.return)) _a.call(finishedPolls_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    res.send({ closedPolls: closedPolls });
};
exports.listFinishedPolls = listFinishedPolls;
/**
 * Adds a new poll to the list.
 * @function
 * @param {SafeRequest} req - The request object containing poll details.
 * @param {SafeResponse} res - The response object to send the added poll.
 * @returns {void}
 */
var addPoll = function (req, res) {
    var name = req.body.name;
    if (typeof name !== "string") {
        res.status(400).send("missing 'name' parameter");
        return;
    }
    var minutes = req.body.minutes;
    if (typeof minutes !== "number") {
        res.status(400).send("'minutes' is not a number");
        return;
    }
    else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
        res.status(400).send("'minutes' is not a positive integer: ".concat(minutes));
        return;
    }
    var options = req.body.options;
    if (!Array.isArray(options) || !options.every(function (option) { return typeof option === "string"; })) {
        res.status(400).send("'options' should be an array of strings");
        return;
    }
    if (exports.polls.has(name)) {
        res.status(400).send("poll for '".concat(name, "' already exists"));
        return;
    }
    var poll = {
        name: name,
        minutes: minutes,
        options: options,
        pollWinner: "",
        endTime: Date.now() + minutes * 60 * 1000,
    };
    exports.polls.set(poll.name, poll);
    res.send({ poll: poll });
};
exports.addPoll = addPoll;
/**
 * Allows a user to vote in a poll by selecting an option.
 * @function
 * @param {SafeRequest} req - The request object containing vote details.
 * @param {SafeResponse} res - The response object to send the updated poll state.
 * @returns {void}
 */
var voteInPoll = function (req, res) {
    var voter = req.body.voter;
    if (typeof voter !== "string") {
        res.status(400).send("missing or invalid 'voter' parameter");
        return;
    }
    var name = req.body.name;
    if (typeof name !== "string") {
        res.status(400).send("missing or invalid 'name' parameter");
        return;
    }
    var poll = exports.polls.get(name);
    if (poll === undefined) {
        res.status(400).send("no poll with name '".concat(name, "'"));
        return;
    }
    var now = Date.now();
    if (now >= poll.endTime) {
        res.status(400).send("poll \"".concat(poll.name, "\" has already ended"));
        return;
    }
    var selectedOption = req.body.selectedOption;
    if (typeof selectedOption !== "string" || !poll.options.includes(selectedOption)) {
        res.status(400).send("'selectedOption' is invalid: ".concat(selectedOption));
        return;
    }
    // Create a new object with the updated pollWinner property without using spread
    var updatedPoll = Object.assign({}, poll, { pollWinner: selectedOption });
    // Update the map with the new object
    exports.polls.set(updatedPoll.name, updatedPoll);
    res.send({ poll: updatedPoll }); // send back the updated poll state
};
exports.voteInPoll = voteInPoll;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQWVBLGlDQUFpQztBQUNqQyw4Q0FBOEM7QUFDakMsUUFBQSxLQUFLLEdBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7QUFHbEQ7OztHQUdHO0FBQ0ksSUFBTSxlQUFlLEdBQUc7SUFDN0IsYUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUZXLFFBQUEsZUFBZSxtQkFFMUI7QUFFRixJQUFNLGVBQWUsR0FBRyxVQUFDLENBQU8sRUFBRSxDQUFPO0lBQ3ZDLElBQU0sR0FBRyxHQUFXLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMvQixJQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDN0QsSUFBTSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQzdELE9BQU8sSUFBSSxHQUFHLElBQUksQ0FBQztBQUNyQixDQUFDLENBQUM7QUFHRjs7Ozs7O0dBTUc7QUFDSSxJQUFNLFNBQVMsR0FBRyxVQUFDLElBQWlCLEVBQUUsR0FBaUI7SUFDNUQsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM1QixDQUFD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