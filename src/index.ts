require("dotenv").config();
import express from "express";
import { google } from "googleapis";
import axios from "axios";
const cors = require("cors");

const listCoursesUrl = "https://classroom.googleapis.com/v1/courses";
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
];
enum CourseState {
  COURSE_STATE_UNSPECIFIED,
  ACTIVE,
  ARCHIVED,
  PROVISIONED,
  DECLINED,
}

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost:3000/courses"
  );
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.send(`
    <h1>Automate Google Classroom!</h1>
    <a href = ${authUrl}>sign in with google</a>
  `);
});

app.get("/courses", async (req, res) => {
  const code = req.query.code;
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost:3000/courses"
  );

  const { tokens } = await oAuth2Client.getToken(code as string);
  oAuth2Client.setCredentials(tokens);
  const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
  try {
    const response = await classroom.courses.list({});
    const courses = response.data;
    res.send(`
      <a href="/">home</a>
      <h1>Your Courses: </h1>
      <pre>${JSON.stringify(courses)}</pre>
    `);
  } catch (err) {
    console.error(err);
    res.send(`
      <a href="/">home</a>
      <h1>Your Courses: </h1>
      <p>Failed to get your courses. Please try again.</p>
  `);
  }
});

app.listen(process.env.PORT, () =>
  console.log("Google Classroom Automation listening on port", process.env.PORT)
);
