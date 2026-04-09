const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const users = {}; // userId -> tokens


app.get("/", (req, res) => {
  res.send("Spotify Bot Backend Running 🚀");
});
// 🔐 LOGIN
app.get("/login", (req, res) => {
  const userId = req.query.userId;

  const scope = "user-modify-playback-state user-read-playback-state";

  const url =
    "https://accounts.spotify.com/authorize?" +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${userId}`;

  res.redirect(url);
});

// 🎧 CALLBACK
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const userId = req.query.state;

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64")
        }
      }
    );

    users[userId] = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token
    };

    res.send("✅ Spotify connected! You can go back to Discord.");
  } catch (err) {
    console.error("Callback error:", err.response?.data || err.message);
    res.send("❌ Error during Spotify login");
  }
});

// 🔑 GET TOKEN (CORRECT PLACE)
app.get("/token/:userId", async (req, res) => {
  const userId = req.params.userId;
  const user = users[userId];

  if (!user) return res.json({});

  try {
    return res.json(user);
  } catch {
    await refreshAccessToken(userId);
    return res.json(users[userId]);
  }
});

// 🔁 REFRESH TOKEN
async function refreshAccessToken(userId) {
  const user = users[userId];

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.refresh_token
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  user.access_token = response.data.access_token;
}

// 🚀 START SERVER
app.listen(PORT, () => console.log("Auth server running on 3000"));