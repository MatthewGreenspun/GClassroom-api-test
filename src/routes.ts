import express from "express";
import { google, classroom_v1 } from "googleapis";
const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.announcements",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/courses"
);

router.get("/", (req, res) => {
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
  try {
    const code = req.query.code;
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);
    const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
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
              <hr>
              <textarea id="${
                course.name?.replace(/\s/g, "-") + "-anouncement-input"
              }"></textarea>
              <button onclick="createAnouncement()">Create Anouncement</button>
              <button onclick="createQuestion()">Create Question</button>
            </div>
            <script>
              function createAnouncement() {
                window.location.href=\`/create-anouncement?text=\${document.getElementById("${
                  course.name?.replace(/\s/g, "-") + "-anouncement-input"
                }").value}&courseId=${course.id}&courseLink=${
            course.alternateLink
          }\`
              };
              function createQuestion() {
                window.location.href=\`/create-assignment?courseId=${
                  course.id
                }&courseLink=${course.alternateLink}\`
              };
            </script>
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

router.get("/create-anouncement", async (req, res) => {
  const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
  try {
    const response = await classroom.courses.announcements.create({
      courseId: req.query.courseId as string,
      requestBody: { text: req.query.text as string },
    });
    res.send(`
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
      <style>
        *{font-family: 'Roboto', 'sans-serif';}
      </style>
      <a href="/">home</a>
      <h1>Anouncement Submitted!</h1>
      <a href=${response.data.alternateLink}>View Anouncement</a>
    `);
  } catch (err) {
    res.send(`
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
      <style>
        *{font-family: 'Roboto', 'sans-serif';}
      </style>
      <a href="/">home</a>
      <h1>Failed To Submit Announcement :(</h1>
      <a href=${req.query.courseLink}>Go To Class</a>
    `);
  }
});

router.get("/create-assignment", async (req, res) => {
  const classroom = google.classroom({ version: "v1", auth: oAuth2Client });
  try {
    const response = await classroom.courses.courseWork.create({
      courseId: req.query.courseId as string,
      requestBody: {
        title: "Do you like the Google Classroom API?",
        workType: "MULTIPLE_CHOICE_QUESTION",
        state: "PUBLISHED",
        multipleChoiceQuestion: {
          choices: ["Yes", "No"],
        },
      },
    });
    res.send(`
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
      <style>
        *{font-family: 'Roboto', 'sans-serif';}
      </style>
      <a href="/">home</a>
      <h1>Assingment Created!</h1>
      <a href=${response.data.alternateLink}>View Assignment</a>
      <p>${JSON.stringify(response.data)}</p>
    `);
  } catch (err) {
    console.error(err);
    res.send(`
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
      <style>
        *{font-family: 'Roboto', 'sans-serif';}
      </style>
      <a href="/">home</a>
      <h1>Failed To Create Question :(</h1>
      <a href=${req.query.courseLink}>Go To Class</a>
    `);
  }
});

export default router;
