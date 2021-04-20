require("dotenv").config();
import express from "express";
import router from "./routes";
import { google, classroom_v1 } from "googleapis";
import axios from "axios";
const cors = require("cors");

const app = express();
app.use(cors());

app.use("/", router);

app.listen(process.env.PORT, () =>
  console.log("Google Classroom Automation listening on port", process.env.PORT)
);
