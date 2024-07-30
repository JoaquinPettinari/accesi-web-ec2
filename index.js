import express from "express";
import pa11y from "pa11y";
import { errorResponse, successResponse } from "./utils.js";
import bodyparser from "body-parser";
import cors from "cors";

const app = express();

app.listen(5001, () => console.log("listening on port 5001"));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(cors());

app.get("/", (req, res) => res.json("My api running"));

app.use(
  cors({
    origin: "https://accesi-web.vercel.app/",
  })
);

app.post("/api/analizar", async (req, res) => {
  const defaultIncludes = {
    includeWarnings: true,
    includeNotices: true,
    timeout: 20000,
  };

  const chromeLaunchConfig = {
    headless: "new",
    executablePath: "/usr/bin/google-chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
    ignoreHTTPSErrors: true,
  };

  const url = req.body?.url;
  const actions = req.body?.actions;
  const host = req.hostname;
  let successResponseData;
  try {
    if (!url) {
      res.status(404).json({
        error: "Sin url",
      });
    }
    if (actions) {
      defaultIncludes.actions = actions
        .split("\n")
        .map((line) => line.replace(/\r$/, ""))
        .filter((line) => line.trim() !== "");
    }
    console.log("🧑‍🏭 Fetching...");
    const params = {
      ...defaultIncludes,
      ...(host.includes("localhost") ? {} : chromeLaunchConfig),
    };
    const pa11yResponse = await pa11y(url, params);
    successResponseData = successResponse(pa11yResponse, url);
    console.log("✅ Fetch success ");
    res.status(200).json(successResponseData);
  } catch (error) {
    const errorData = errorResponse(error, url);
    res.status(500).json(errorData);
  }
});
