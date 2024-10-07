import React, { Component, ChangeEvent, MouseEvent } from "react";
import { isRecord } from './record';



// Description of an individual poll
// RI: duration >= 0
export type Poll = {
  readonly name: string;
  readonly options: string[]; // List of poll options
  readonly startTime: number; // ms since epoch
  readonly duration: number; // Duration of the poll in milliseconds
  readonly question: string;
  readonly results: Record<string, string>; // Assuming results is a record of strings
  readonly endTime: number;
  readonly votes: Record<string, string>; // Record of user votes (username to option)
};

/**
 * Parses unknown data into a Poll. Will log an error and return undefined
 * if it is not a valid Poll.
 * @param val unknown data to parse into a Poll
 * @return Poll if val is a valid Poll and undefined otherwise
 */
export const parsePoll = (val: unknown): undefined | Poll => {
  if (!isRecord(val)) {
    console.error("not a poll", val);
    return undefined;
  }

  if (typeof val.name !== "string") {
    console.error("not a poll: missing 'name'", val);
    return undefined;
  }

  if (!Array.isArray(val.options) || val.options.some((opt) => typeof opt !== "string")) {
    console.error("not a poll: invalid or missing 'options'", val);
    return undefined;
  }

  if (typeof val.startTime !== "number" || val.startTime < 0 || isNaN(val.startTime)) {
    console.error("not a poll: missing or invalid 'startTime'", val);
    return undefined;
  }

  if (typeof val.duration !== "number" || val.duration < 0 || isNaN(val.duration)) {
    console.error("not a poll: missing or invalid 'duration'", val);
    return undefined;
  }

  if (!isRecord(val.votes) || Object.values(val.votes).some((vote) => typeof vote !== "string")) {
    console.error("not a poll: invalid or missing 'votes'", val);
    return undefined;
  }

  if (typeof val.question !== "string") {
    console.error("not a poll: missing or invalid 'question'", val);
    return undefined;
  }

  return {
    name: val.name,
    options: val.options,
    startTime: val.startTime,
    duration: val.duration,
    question: val.question,
    results: {}, // Initialize with an empty record
    endTime: 100000,
    votes: {}, // Initialize with an empty record
  };
};




// Indicates which page to show. If it is the details page, the argument
// includes the specific poll to show the details of.
type Page = "list" | "new" | { kind: "details"; name: string };

// RI: If page is "details", then index is a valid index into polls array.
type AppState = { page: Page };

// Whether to show debugging information in the console.
const DEBUG: boolean = true;

// Top-level component that displays the appropriate page.
export class PollsApp extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = { page: "list" };
  }

  render = (): JSX.Element => {
    if (this.state.page === "list") {

      if (DEBUG) console.debug("rendering list page");
      <div> <label>Closed</label></div>
      if (DEBUG) console.debug("rendering list page");
      return <PollList onNewClick={this.doNewClick} onPollClick={this.doPollClick} />;
    } else if (this.state.page === "new") {
      if (DEBUG) console.debug("rendering add page");
      return <NewPoll onBackClick={this.doBackClick} />;
    } else {
      // details
      if (DEBUG) console.debug(`rendering details page for "${this.state.page.name}"`);
      return <PollDetails name={this.state.page.name} onBackClick={this.doBackClick} />;
    }
  };

  doNewClick = (): void => {
    if (DEBUG) console.debug("set state to new");
    this.setState({ page: "new" });
  };

  doPollClick = (name: string): void => {
    if (DEBUG) console.debug(`set state to details for poll ${name}`);
    this.setState({ page: { kind: "details", name } });
  };

  doBackClick = (): void => {
    if (DEBUG) console.debug("set state to list");
    this.setState({ page: "list" });
  };
}


type ListProps = {
  onNewClick: () => void;
  onPollClick: (name: string) => void;
};

type ListState = {
  now: number; // current time when rendering
  polls: Poll[] | undefined;
};

// Shows the list of all the polls.
export class PollList extends Component<ListProps, ListState> {
  constructor(props: ListProps) {
    super(props);
    this.state = { now: Date.now(), polls: undefined };
  }

  componentDidMount = (): void => {
    this.doRefreshClick();
  };

  componentDidUpdate = (prevProps: ListProps): void => {
    if (prevProps !== this.props) {
      this.setState({ now: Date.now() }); // Force a refresh
    }
  };

  render = (): JSX.Element => {
    return (
      <div>
        <h2>Current Polls</h2>
        {this.renderPolls()}
        <button type="button" onClick={this.doRefreshClick}>
          Refresh
        </button>
        <button type="button" onClick={this.doNewClick}>
          New Poll
        </button>
      </div>
    );
  };

  renderPolls = (): JSX.Element => {
    if (this.state.polls === undefined) {
      return (<div> <div><label>Still Open</label>
      <p>Loading poll list...</p></div>
      <div><label>Closed</label>
      <p>Loading poll list...</p></div></div>);
    } else {
      const polls: JSX.Element[] = [];
      for (const poll of this.state.polls) {
        const min = (poll.startTime + poll.duration - this.state.now) / 60 / 1000;
        const desc = min < 0 ? "" : <span> – {Math.round(min)} minutes remaining</span>;
        polls.push(
          <li key={poll.name}>
            <a href="#" onClick={(evt) => this.doPollClick(evt, poll.name)}>
              {poll.name}
            </a>
            {desc}
          </li>
        );
      }
      return <ul>{polls}</ul>;
    }
  };

  doListResp = (resp: Response): void => {
    if (resp.status === 200) {
      resp.json().then(this.doListJson).catch(() => this.doListError("200 response is not JSON"));
    } else if (resp.status === 400) {
      resp.text().then(this.doListError).catch(() => this.doListError("400 response is not text"));
    } else {
      this.doListError(`bad status code from /api/list: ${resp.status}`);
    }
  };

  doListJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/list: not a record", data);
      return;
    }

    if (!Array.isArray(data.polls)) {
      console.error("bad data from /api/list: polls is not an array", data);
      return;
    }

    const polls: Poll[] = [];
    for (const val of data.polls) {
      const poll = parsePoll(val);
      if (poll === undefined) return;
      polls.push(poll);
    }
    this.setState({ polls, now: Date.now() }); // fix time also
  };

  doListError = (msg: string): void => {
    console.error(`Error fetching /api/list: ${msg}`);
  };

  doRefreshClick = (): void => {
    fetch("/api/list").then(this.doListResp).catch(() => this.doListError("failed to connect to server"));
  };

  doNewClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
    this.props.onNewClick(); // tell the parent to show the new poll page
  };

  doPollClick = (evt: MouseEvent<HTMLAnchorElement>, name: string): void => {
    evt.preventDefault();
    this.props.onPollClick(name);
  };
}



type NewPollProps = {
  onBackClick: () => void;
};

type NewPollState = {
  question: string;
  options: string[];
  duration: string;
  error: string;
};

// Allows the user to create a new poll.
export class NewPoll extends Component<NewPollProps, NewPollState> {
  constructor(props: NewPollProps) {
    super(props);
    this.state = { question: "", options: [], duration: "60", error: "" };
  }

  render = (): JSX.Element => {
    return (
      <div>
        <h2>New Poll</h2>
        <div>
          <label htmlFor="question">Poll Question:</label>
          <input
            id="question"
            type="text"
            value={this.state.question}
            onChange={this.doQuestionChange}
          ></input>
        </div>
        <div>
          <label htmlFor="options">Poll Options (comma-separated):</label>
          <input
            id="options"
            type="text"
            value={this.state.options.join(",")}
            onChange={this.doOptionsChange}
          ></input>
        </div>
        <div>
          <label htmlFor="duration">Duration (minutes):</label>
          <input
            id="duration"
            type="number"
            min="1"
            value={this.state.duration}
            onChange={this.doDurationChange}
          ></input>
        </div>
        <button type="button" onClick={this.doCreateClick}>
          Create
        </button>
        <button type="button" onClick={this.doBackClick}>
          Back
        </button>
        {this.renderError()}
      </div>
    );
  };

  renderError = (): JSX.Element => {
    if (this.state.error.length === 0) {
      return <div></div>;
    } else {
      const style = {
        width: "300px",
        backgroundColor: "rgb(246,194,192)",
        border: "1px solid rgb(137,66,61)",
        borderRadius: "5px",
        padding: "5px",
      };
      return (
        <div style={{ marginTop: "15px" }}>
          <span style={style}>
            <b>Error</b>: {this.state.error}
          </span>
        </div>
      );
    }
  };

  doQuestionChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ question: evt.target.value, error: "" });
  };

  doOptionsChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    const options = evt.target.value.split(",");
    this.setState({ options, error: "" });
  };

  doDurationChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ duration: evt.target.value, error: "" });
  };

  doCreateClick = (_: MouseEvent<HTMLButtonElement>): void => {
    // Verify that the user entered all required information.
    if (
      this.state.question.trim().length === 0 ||
      this.state.options.length === 0 ||
      this.state.duration.trim().length === 0
    ) {
      this.setState({ error: "a required field is missing." });
      return;
    }

    // Verify that duration is a number.
    const duration = parseFloat(this.state.duration);
    if (isNaN(duration) || duration < 1 || Math.floor(duration) !== duration) {
      this.setState({ error: "duration is not a positive integer" });
      return;
    }

    // Ask the app to create this poll.
    const args = {
      question: this.state.question,
      options: this.state.options,
      duration: duration,
    };
    fetch("/api/add", {
      method: "POST",
      body: JSON.stringify(args),
      headers: { "Content-Type": "application/json" },
    })
      .then(this.doCreateResp)
      .catch(() => this.doCreateError("failed to connect to server"));
  };

  doCreateResp = (resp: Response): void => {
    if (resp.status === 200) {
      resp.json().then(this.doCreateJson).catch(() => this.doCreateError("200 response is not JSON"));
    } else if (resp.status === 400) {
      resp.text().then(this.doCreateError).catch(() => this.doCreateError("400 response is not text"));
    } else {
      this.doCreateError(`bad status code from /api/create: ${resp.status}`);
    }
  };

  doCreateJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/create: not a record", data);
      return;
    }

    this.props.onBackClick(); // show the updated list
  };

  doCreateError = (msg: string): void => {
    this.setState({ error: msg });
  };

  doBackClick = (_: MouseEvent<HTMLButtonElement>): void => {
    this.props.onBackClick(); // tell the parent this was clicked
  };
}




type PollDetailsProps = {
  name: string;
  onBackClick: () => void;
};

type PollDetailsState = {
  now: number;
  poll: Poll | undefined;
  voter: string;
  selectedOption: string;
  error: string;
};

// Shows an individual poll and allows voting (if ongoing).
export class PollDetails extends Component<PollDetailsProps, PollDetailsState> {
  constructor(props: PollDetailsProps) {
    super(props);

    this.state = {
      now: Date.now(),
      poll: undefined,
      voter: "",
      selectedOption: "",
      error: "",
    };
  }

  componentDidMount = (): void => {
    this.doRefreshClick();
  };

  render = (): JSX.Element => {
    if (this.state.poll === undefined) {
      return <p>Loading poll "{this.props.name}"...</p>;
    } else {
      if (this.state.poll.endTime <= this.state.now) {
        return this.renderCompleted(this.state.poll);
      } else {
        return this.renderOngoing(this.state.poll);
      }
    }
  };

  renderCompleted = (poll: Poll): JSX.Element => {
    const optionElements = [];
    const options = poll.options;  // Assuming poll.options is an array

    // Inv:
// Before the loop: optionElements contains correctly formatted li elements for options[0], options[1], ..., options[index - 1].
// After each iteration: optionElements contains correctly formatted li elements for options[0], options[1], ..., options[index].

    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      optionElements.push(
        <li key={index}>
          {option}: {poll.results[option]}
        </li>
      );
    }

    return (
      <div>
        <h2>{poll.question}</h2>
        <p>Results:</p>
        <ul>{optionElements}</ul>
      </div>
    );
  };

  renderOngoing = (poll: Poll): JSX.Element => {
    const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10;
    const options = poll.options;  // Assuming poll.options is an array

    const optionElements = [];
    // Inv:
// Before the loop: optionElements contains correctly formatted input elements for options[0], options[1], ..., options[index - 1].
// After each iteration: optionElements contains correctly formatted input elements for options[0], options[1], ..., options[index].
    for (let index = 0; index < options.length; index++) {
      const option = options[index];

      optionElements.push(
        <div key={index}>
          <input
            type="radio"
            id={`option${index}`}
            name="options"
            value={option}
            checked={this.state.selectedOption === option}
            onChange={this.doOptionChange}
          />
          <label htmlFor={`option${index}`}>{option}</label>
        </div>
      );
    }

    return (
      <div>
        <h2>{poll.question}</h2>
        <p><i>Voting ends in {min} minutes...</i></p>
        <form>
          <div>
            <label htmlFor="voter">Name:</label>
            <input
              type="text"
              id="voter"
              value={this.state.voter}
              onChange={this.doVoterChange}
            />
          </div>
          <div>
            <label>Options:</label>
            {optionElements}
          </div>
          <button type="button" onClick={this.doVoteClick}>
            Vote
          </button>
          <button type="button" onClick={this.doRefreshClick}>
            Refresh
          </button>
          <button type="button" onClick={this.doDoneClick}>
            Done
          </button>
          {this.renderError()}
        </form>
      </div>
    );
  };
  renderError = (): JSX.Element => {
    if (this.state.error.length === 0) {
      return <div></div>;
    } else {
      const style = {
        width: "300px",
        backgroundColor: "rgb(246,194,192)",
        border: "1px solid rgb(137,66,61)",
        borderRadius: "5px",
        padding: "5px",
      };
      return (
        <div style={{ marginTop: "15px" }}>
          <span style={style}>
            <b>Error</b>: {this.state.error}
          </span>
        </div>
      );
    }
  };

  doRefreshClick = (): void => {
    const args = { name: this.props.name };
    fetch("/api/get", {
      method: "POST",
      body: JSON.stringify(args),
      headers: { "Content-Type": "application/json" },
    })
      .then(this.doGetResp)
      .catch(() => this.doGetError("failed to connect to server"));
  };

  doGetResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doGetJson).catch(() => this.doGetError("200 res is not JSON"));
    } else if (res.status === 400) {
      res.text().then(this.doGetError).catch(() => this.doGetError("400 response is not text"));
    } else {
      this.doGetError(`bad status code from /api/refersh: ${res.status}`);
    }
  };

  doGetJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/refresh: not a record", data);
      return;
    }

    this.doPollChange(data);
  };

  // Shared helper to update the state with the new poll.
  doPollChange = (data: { poll?: unknown }): void => {
    const poll = parsePoll(data.poll);
    if (poll !== undefined) {
      this.setState({ poll, now: Date.now(), error: "" });
    } else {
      console.error("poll from /api/fresh did not parse", data.poll);
    }
  };

  doGetError = (msg: string): void => {
    console.error(`Error fetching /api/refresh: ${msg}`);
  };

  doVoterChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ voter: evt.target.value, error: "" });
  };

  doOptionChange = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ selectedOption: evt.target.value, error: "" });
  };

  doVoteClick = (_: MouseEvent<HTMLButtonElement>): void => {
    if (this.state.poll === undefined) throw new Error("impossible");

    // Verify that the user entered all required information.
    if (this.state.voter.trim().length === 0 || this.state.selectedOption.trim().length === 0) {
      this.setState({ error: "a required field is missing." });
      return;
    }

    const args = { name: this.props.name, voter: this.state.voter, option: this.state.selectedOption };
    fetch("/api/vote", {
      method: "POST",
      body: JSON.stringify(args),
      headers: { "Content-Type": "application/json" },
    })
      .then(this.doVoteResp)
      .catch(() => this.doVoteError("failed to connect to server"));
  };

  doVoteResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doVoteJson).catch(() => this.doVoteError("200 response is not JSON"));
    } else if (res.status === 400) {
      res.text().then(this.doVoteError).catch(() => this.doVoteError("400 response is not text"));
    } else {
      this.doVoteError(`bad status code from /api/vote: ${res.status}`);
    }
  };

  doVoteJson = (data: unknown): void => {
    if (this.state.poll === undefined) throw new Error("impossible");

    if (!isRecord(data)) {
      console.error("bad data from /api/vote: not a record", data);
      return;
    }

    this.doPollChange(data);
  };

  doVoteError = (msg: string): void => {
    console.error(`Error fetching /api/vote: ${msg}`);
  };

  doDoneClick = (_: MouseEvent<HTMLButtonElement>): void => {
    this.props.onBackClick(); // tell the parent to show the full list again
  };
}