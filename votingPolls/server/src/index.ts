import express, { Express } from "express";
import { addPoll, listPolls } from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/list", listPolls);  // TODO: REMOVE
app.post("/api/add", addPoll);

app.listen(port, () => console.log(`Server listening on ${port}`));
