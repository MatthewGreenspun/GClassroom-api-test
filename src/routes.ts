import express from "express";
import { google, classroom_v1 } from "googleapis";
const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
];

router.get("/", (req, res) => {
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
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
    <style>
      *{font-family: 'Roboto', 'sans-serif';}
    </style>
    <h1>Automate Google Classroom!</h1>
    <a href = ${authUrl}>Sign in with Google</a>
  `);
});

router.get("/courses", async (req, res) => {
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
    const { courses } = response.data;
    res.send(`
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
      <style>
        *{font-family: 'Roboto', 'sans-serif';}
      </style>
      <a href="/">home</a>
      <h1>Your Courses: </h1>
      <div style="display: flex; flex-wrap: wrap; font-family: 'Roboto', 'sans-serif';">
      ${courses
        ?.map((course) => {
          return `
            <div style="margin: 5px; padding: 5px; border: 3px solid gray; border-radius: 4px; width: 100%">
              <h2>${course.name}</h2>
              <hr>
              <h5>${course.section ?? ""}</h5>
              <h5>${course.descriptionHeading ?? ""}</h5>
              <h5>${course.description ?? ""}</h5>
              <a href="${course.alternateLink}">Go To Class</a>
            </div>
          `;
        })
        .toString()
        .replace(/,/g, "<br>")}
      </div>
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

export default router;
