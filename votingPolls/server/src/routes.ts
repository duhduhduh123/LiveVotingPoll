import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";

// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check

export type Poll = {
  name: string;
  minutes: number;
  options: string[];
  pollWinner: string;
  endTime: number;
};

// Map from name to poll details.
/** A map to store information about polls. */
export const polls: Map<string, Poll> = new Map();


/**
 * Testing function to remove all the added polls.
 * @function
 */
export const resetForTesting = (): void => {
  polls.clear();
};

const comparePollTime = (a: Poll, b: Poll): number => {
  const now: number = Date.now();
  const endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
  const endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
  return endA - endB;
};


/**
 * Returns a list of all the polls, sorted by the time remaining.
 * @function
 * @param {_req: SafeRequest} _req - The request object (unused).
 * @param {SafeResponse} res - The response object to send the sorted polls.
 * @returns {void}
 */
export const listPolls = (_req: SafeRequest, res: SafeResponse): void => {
  const vals = Array.from(polls.values());
  vals.sort(comparePollTime);
  res.send({ polls: vals });
};


/**
 * Returns a list of closed polls with their closed duration.
 * @function
 * @param {_req: SafeRequest} _req - The request object (unused).
 * @param {SafeResponse} res - The response object to send the closed polls.
 * @returns {void}
 */
export const listFinishedPolls = (_req: SafeRequest, res: SafeResponse): void => {
  const now: number = Date.now();
  const finishedPolls = Array.from(polls.values()).filter(
    (poll): poll is Poll & { endTime: number } => !!poll.endTime && poll.endTime <= now
  );

  const closedPolls = [];

  for (const poll of finishedPolls) {
    const closedDuration = now - poll.endTime;
    closedPolls.push({
      name: poll.name,
      closedDuration: closedDuration,
    });
  }

  res.send({ closedPolls: closedPolls });
};


/**
 * Adds a new poll to the list.
 * @function
 * @param {SafeRequest} req - The request object containing poll details.
 * @param {SafeResponse} res - The response object to send the added poll.
 * @returns {void}
 */
export const addPoll = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if (typeof name !== "string") {
    res.status(400).send("missing 'name' parameter");
    return;
  }

  const minutes = req.body.minutes;
  if (typeof minutes !== "number") {
    res.status(400).send("'minutes' is not a number");
    return;
  } else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
    res.status(400).send(`'minutes' is not a positive integer: ${minutes}`);
    return;
  }

  const options = req.body.options;
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) {
    res.status(400).send("'options' should be an array of strings");
    return;
  }

  if (polls.has(name)) {
    res.status(400).send(`poll for '${name}' already exists`);
    return;
  }

  const poll: Poll = {
    name: name,
    minutes: minutes,
    options: options,
    pollWinner: "",
    endTime: Date.now() + minutes * 60 * 1000,
  };
  polls.set(poll.name, poll);
  res.send({ poll: poll });
};


/**
 * Allows a user to vote in a poll by selecting an option.
 * @function
 * @param {SafeRequest} req - The request object containing vote details.
 * @param {SafeResponse} res - The response object to send the updated poll state.
 * @returns {void}
 */
export const voteInPoll = (req: SafeRequest, res: SafeResponse): void => {
  const voter = req.body.voter;
  if (typeof voter !== "string") {
    res.status(400).send("missing or invalid 'voter' parameter");
    return;
  }

  const name = req.body.name;
  if (typeof name !== "string") {
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }

  const poll = polls.get(name);
  if (poll === undefined) {
    res.status(400).send(`no poll with name '${name}'`);
    return;
  }

  const now = Date.now();
  if (now >= poll.endTime) {
    res.status(400).send(`poll "${poll.name}" has already ended`);
    return;
  }

  const selectedOption = req.body.selectedOption;
  if (typeof selectedOption !== "string" || !poll.options.includes(selectedOption)) {
    res.status(400).send(`'selectedOption' is invalid: ${selectedOption}`);
    return;
  }

  // Create a new object with the updated pollWinner property without using spread
  const updatedPoll: Poll = Object.assign({}, poll, { pollWinner: selectedOption });

  // Update the map with the new object
  polls.set(updatedPoll.name, updatedPoll);

  res.send({ poll: updatedPoll });  // send back the updated poll state
};