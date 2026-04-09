const axios = require("axios");

const BASE = "https://api.spotify.com/v1/me/player";

function headers(token) {
  return { Authorization: `Bearer ${token}` };
}
exports.searchTrack = async (token, query) => {
if (!query || !query.trim()) return null;
  const res = await axios.get(
    "https://api.spotify.com/v1/search",
    {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: "track",
        limit: 7
      }
    }
  );

  const tracks = res.data.tracks.items;
  if (!tracks.length) return null;

  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9 ]/g, "");

  const q = clean(query);

  // 🔥 Score each track
  const scored = tracks.map(track => {
    const name = clean(track.name);
    const artist = clean(track.artists[0].name);

    let score = 0;

    // exact match
    if (name === q) score += 100;

    // contains query
    if (name.includes(q)) score += 50;

    // partial word match
    const words = q.split(" ");
    const matchCount = words.filter(w => name.includes(w)).length;
    score += matchCount * 10;

    // artist match boost (optional future use)
    if (artist.includes(q)) score += 5;

    // popularity boost (0–100)
    score += track.popularity * 0.5;

    return { track, score };
  });

  // sort highest score first
  scored.sort((a, b) => b.score - a.score);

  return scored[0].track;
};
exports.getDevices = async (token) => {
  const res = await axios.get(
    "https://api.spotify.com/v1/me/player/devices",
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return res.data.devices;
};
exports.pause = (token) =>
  axios.put(`${BASE}/pause`, {}, { headers: headers(token) });

exports.play = async (token, body) => {
  const devices = await exports.getDevices(token);

  if (!devices.length) {
    throw new Error("No active device");
  }

  const deviceId = devices.find(d => d.is_active)?.id || devices[0].id;

  return axios.put(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    body,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};
exports.resume = async (token) => {
  const devices = await exports.getDevices(token);

  if (!devices.length) {
    throw new Error("No active device");
  }

  const deviceId = devices.find(d => d.is_active)?.id || devices[0].id;

  return axios.put(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {}, // 🔥 empty body = resume
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};
exports.next = (token) =>
  axios.post(`${BASE}/next`, {}, { headers: headers(token) });

exports.prev = (token) =>
  axios.post(`${BASE}/previous`, {}, { headers: headers(token) });

exports.queue = (token, uri) =>
  axios.post(`${BASE}/queue?uri=${encodeURIComponent(uri)}`, {}, {
    headers: headers(token)
  });