const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const xmlbuilder = require("xmlbuilder");
const fs = require("fs");
const app = express();
const port = 7070;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "segments");
  },
  filename: function (req, file, cb) {
    cb(null, `segment-${Date.now()}.mp4`);
  },
});
const upload = multer({ storage: storage });

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let segmentNumber = 0;
const resolutions = [
  {
    name: "720p",
    size: "1280x720",
  },
  {
    name: "480p",
    size: "854x480",
  },
  {
    name: "360p",
    size: "640x360",
  },
  {
    name: "240p",
    size: "426x240",
  },
];
app.post("/upload", upload.single("video"), (req, res) => {
  console.log("upload");
  const video = req.file;
  if (!video) {
    res.send("No video found");
  }
  console.log(segmentNumber);

  resolutions.forEach((resolution) => {
    ffmpeg(video.path)
      .audioCodec("aac")
      .audioBitrate("128k")
      .size(resolution.size)
      .addOption("-c:v", "libx264")
      .addOption("-profile:v", "main")
      .addOption("-level", "3.2")
      .addOption("-pix_fmt", "yuv420p")
      .addOption("-preset", "medium")
      .addOption("-tune", "zerolatency")
      .addOption("-flags", "+cgop+low_delay")
      .addOption(
        "-movflags",
        "empty_moov+omit_tfhd_offset+frag_keyframe+default_base_moof+isml"
      )
      .on("end", () => {
        console.log(`${resolution.name} completed`);
      })
      .output(
        `fragmented_segments/segment${resolution.name}_0${segmentNumber}.mp4`
      )
      .run();
  });

  segmentNumber++;
  res.send(req.body);
});

app.get("/get_mpd_playlist", (req, res) => {
  console.log("get_mpd_playlist");
  const mpd = xmlbuilder.create("MPD", { version: "1.0", encoding: "UTF-8" });
  mpd.att("xmlns", "urn:mpeg:dash:schema:mpd:2011");
  mpd.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
  mpd.att("xsi:schemaLocation", "urn:mpeg:DASH:schema:MPD:2011 DASH-MPD.xsd");
  mpd.att(
    "profiles",
    "urn:hbbtv:dash:profile:isoff-live:2012,urn:mpeg:dash:profile:isoff-live:2011"
  );
  mpd.att("type", "static");
  mpd.att("mediaPresentationDuration", "3");
  mpd.att("minBufferTime", "PT2S");

  const period = mpd.ele("Period", { duration: "15" });
  const adaptationSet = period.ele("AdaptationSet");
  adaptationSet.att("segmentAlignment", "true");
  adaptationSet.att("subsegmentAlignment", "true");
  adaptationSet.att("bitstreamSwitching", "true");
  adaptationSet.att("contentType", "video");
  adaptationSet.att("mimeType", "video/mp4");
  adaptationSet.att("width", "1280");
  adaptationSet.att("height", "720");
  adaptationSet.att("maxFrameRate", "30");
  adaptationSet.att("lang", "und");
  adaptationSet.att("codecs", "avc1.64001f");
  adaptationSet.att("frameRate", "30");

  const segmentTemplate1 = adaptationSet.ele("SegmentTemplate");
  segmentTemplate1.att(
    "media",
    "fragmented_segments/segment$RepresentationID$_0$Number$.mp4"
  );
  segmentTemplate1.att(
    "initialization",
    "fragmented_segments/segment$RepresentationID$_00.mp4"
  );
  segmentTemplate1.att("startNumber", "1");
  segmentTemplate1.att("duration", "3");

  const representation1 = adaptationSet.ele("Representation");
  representation1.att("id", "720p");
  representation1.att("mimeType", "video/mp4");
  representation1.att("codecs", "avc1.64001f");
  representation1.att("width", "1280");
  representation1.att("height", "720");
  representation1.att("frameRate", "30");
  representation1.att("bandwidth", "1627745");

  const representation2 = adaptationSet.ele("Representation");
  representation2.att("id", "480p");
  representation2.att("mimeType", "video/mp4");
  representation2.att("codecs", "avc1.64001f");
  representation2.att("width", "854");
  representation2.att("height", "480");
  representation2.att("frameRate", "30");
  representation2.att("bandwidth", "882355");

  const representation3 = adaptationSet.ele("Representation");
  representation3.att("id", "360p");
  representation3.att("mimeType", "video/mp4");
  representation3.att("codecs", "avc1.64001f");
  representation3.att("width", "640");
  representation3.att("height", "360");
  representation3.att("frameRate", "30");
  representation3.att("bandwidth", "542383");

  const representation4 = adaptationSet.ele("Representation");
  representation4.att("id", "240p");
  representation4.att("mimeType", "video/mp4");
  representation4.att("codecs", "avc1.64001f");
  representation4.att("width", "426");
  representation4.att("height", "240");
  representation4.att("frameRate", "30");
  representation4.att("bandwidth", "280000");

  const output = mpd.end({ pretty: true });

  res.setHeader("Content-Type", "application/dash+xml");
  res.attachment("playlist.mpd");
  res.send(output);
});

app.get("/fragmented_segments/:segmentFileName", (req, res) => {
  const path = `fragmented_segments/${req.params.segmentFileName}`;
  const range = req.headers.range;
  const videoFile = fs.createReadStream(path);
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const videoHeaders = {
    "Content-Type": "video/mp4",
    "Content-Length": fileSize,
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const videoChunk = videoFile.pipe(
      res.status(206).set({
        ...videoHeaders,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize,
      })
    );
    return videoChunk;
  }
  const videoStream = videoFile.pipe(res.status(200).set(videoHeaders));
  return videoStream;
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
