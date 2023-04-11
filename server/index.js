const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const xmlbuilder = require("xmlbuilder");
const fs = require("fs");
const app = express();
const port = 7070;
const { exec } = require("child_process");
const https = require("https");
const mp4box = require("mp4box");
const options = {
  key: fs.readFileSync("./cert/privatekey.pem"),
  cert: fs.readFileSync("./cert/certificate.pem"),
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "segments"); // specify the destination directory for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `segment-${Date.now()}.mp4`); // set the filename for the uploaded file
  },
});
const upload = multer({ storage: storage });

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let segmentNumber = 0;

// app.post("/upload", upload.single("video"), (req, res) => {
//   const video = req.file;
//   if (!video) {
//     res.send("No video found");
//   }
//   console.log(segmentNumber);
//   const resolutions = [
//     {
//       name: "720p",
//       size: "1280x720",
//     },
//     {
//       name: "480p",
//       size: "854x480",
//     },
//     {
//       name: "360p",
//       size: "640x360",
//     },
//     {
//       name: "240p",
//       size: "426x240",
//     },
//   ];
//   resolutions.forEach((resolution) => {
//     ffmpeg(video.path)
//       .audioCodec("aac")
//       .audioBitrate("128k")
//       .size(resolution.size)
//       .outputOptions("-c:v", "libx264")
//       .outputOptions("-f", "segment")
//       .outputOptions("-segment_time", "3")
//       .outputOptions("-reset_timestamps", "1")
//       .on("end", () => {
//         console.log(`${resolution.name} completed`);
//       })
//       .save(`encoded_segments/segment${resolution.name}_%d${segmentNumber}.mp4`)
//       .run();
//   });
//   segmentNumber++;
//   res.send(req.body);
// });

app.get("/get_mpd_playlist", (req, res) => {
  // const segmentsPaths = [
  //   "encoded_segments/segment720p_00.mp4",
  //   "encoded_segments/segment720p_01.mp4",
  //   "encoded_segments/segment720p_02.mp4",
  //   "encoded_segments/segment720p_03.mp4",
  //   "encoded_segments/segment480p_00.mp4",
  //   "encoded_segments/segment480p_01.mp4",
  //   "encoded_segments/segment480p_02.mp4",
  //   "encoded_segments/segment480p_03.mp4",
  //   "encoded_segments/segment360p_00.mp4",
  //   "encoded_segments/segment360p_01.mp4",
  //   "encoded_segments/segment360p_02.mp4",
  //   "encoded_segments/segment360p_03.mp4",
  //   "encoded_segments/segment240p_00.mp4",
  //   "encoded_segments/segment240p_01.mp4",
  //   "encoded_segments/segment240p_02.mp4",
  //   "encoded_segments/segment240p_03.mp4",
  // ];
  const mpd = xmlbuilder.create("MPD", { version: "1.0", encoding: "UTF-8" });
  mpd.att("xmlns", "urn:mpeg:dash:schema:mpd:2011");
  mpd.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
  mpd.att("xsi:schemaLocation", "urn:mpeg:DASH:schema:MPD:2011 DASH-MPD.xsd");
  mpd.att(
    "profiles",
    "urn:hbbtv:dash:profile:isoff-live:2012,urn:mpeg:dash:profile:isoff-live:2011"
  );
  mpd.att("type", "static");
  mpd.att("mediaPresentationDuration", "PT634.566S");
  mpd.att("minBufferTime", "PT2.00S");

  const period = mpd.ele("Period");
  // const period = mpd.ele("Period", { duration: "PT0H10M34.600S" });
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

  // const representation1 = adaptationSet.ele("Representation");
  // representation1.att("id", "720p");
  // representation1.att("mimeType", "video/mp4");
  // representation1.att("codecs", "avc1.64001f");
  // representation1.att("width", "1280");
  // representation1.att("height", "720");
  // representation1.att("frameRate", "30");
  // representation1.att("bandwidth", "1627745");

  // const segmentTemplate1 = representation1.ele("SegmentTemplate");
  // segmentTemplate1.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment720p_0$Number$.mp4"
  // );
  // segmentTemplate1.att("timescale", "1000");
  // segmentTemplate1.att("startNumber", "0");
  // segmentTemplate1.att("duration", "3000");

  // const representation2 = adaptationSet.ele("Representation");
  // representation2.att("id", "480p");
  // representation2.att("mimeType", "video/mp4");
  // representation2.att("codecs", "avc1.64001f");
  // representation2.att("width", "854");
  // representation2.att("height", "480");
  // representation2.att("frameRate", "30");
  // representation2.att("bandwidth", "882355");

  // const segmentTemplate2 = representation2.ele("SegmentTemplate");
  // segmentTemplate2.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment480p_0$Number$.mp4"
  // );
  // segmentTemplate2.att("timescale", "1000");
  // segmentTemplate2.att("startNumber", "0");
  // segmentTemplate2.att("duration", "3000");

  // const representation3 = adaptationSet.ele("Representation");
  // representation3.att("id", "360p");
  // representation3.att("mimeType", "video/mp4");
  // representation3.att("codecs", "avc1.64001f");
  // representation3.att("width", "640");
  // representation3.att("height", "360");
  // representation3.att("frameRate", "30");
  // representation3.att("bandwidth", "542383");

  // const segmentTemplate3 = representation3.ele("SegmentTemplate");
  // segmentTemplate3.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment360p_0$Number$.mp4"
  // );
  // segmentTemplate3.att("timescale", "1000");
  // segmentTemplate3.att("startNumber", "0");
  // segmentTemplate3.att("duration", "3000");

  // const representation4 = adaptationSet.ele("Representation");
  // representation4.att("id", "240p");
  // representation4.att("mimeType", "video/mp4");
  // representation4.att("codecs", "avc1.64001f");
  // representation4.att("width", "426");
  // representation4.att("height", "240");
  // representation4.att("frameRate", "30");
  // representation4.att("bandwidth", "280000");

  // const segmentTemplate4 = representation4.ele("SegmentTemplate");
  // segmentTemplate4.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment240p_0$Number$.mp4"
  // );
  // segmentTemplate4.att("timescale", "1000");
  // segmentTemplate4.att("startNumber", "0");
  // segmentTemplate4.att("duration", "3000");

  const segmentTemplate1 = adaptationSet.ele("SegmentTemplate");
  segmentTemplate1.att(
    "media",
    "encoded_segments/segment$RepresentationID$_0$Number$.mp4"
  );
  segmentTemplate1.att(
    "initialization",
    "encoded_segments/segment$RepresentationID$_00.mp4"
  );
  segmentTemplate1.att("timescale", "1000");
  segmentTemplate1.att("startNumber", "0");
  segmentTemplate1.att("duration", "3000");

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

  // const segmentTemplate2 = representation2.ele("SegmentTemplate");
  // segmentTemplate2.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment480p_0$Number$.mp4"
  // );
  // segmentTemplate2.att("timescale", "1000");
  // segmentTemplate2.att("startNumber", "0");
  // segmentTemplate2.att("duration", "3000");

  const representation3 = adaptationSet.ele("Representation");
  representation3.att("id", "360p");
  representation3.att("mimeType", "video/mp4");
  representation3.att("codecs", "avc1.64001f");
  representation3.att("width", "640");
  representation3.att("height", "360");
  representation3.att("frameRate", "30");
  representation3.att("bandwidth", "542383");

  // const segmentTemplate3 = representation3.ele("SegmentTemplate");
  // segmentTemplate3.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment360p_0$Number$.mp4"
  // );
  // segmentTemplate3.att("timescale", "1000");
  // segmentTemplate3.att("startNumber", "0");
  // segmentTemplate3.att("duration", "3000");

  const representation4 = adaptationSet.ele("Representation");
  representation4.att("id", "240p");
  representation4.att("mimeType", "video/mp4");
  representation4.att("codecs", "avc1.64001f");
  representation4.att("width", "426");
  representation4.att("height", "240");
  representation4.att("frameRate", "30");
  representation4.att("bandwidth", "280000");

  // const segmentTemplate4 = representation4.ele("SegmentTemplate");
  // segmentTemplate4.att(
  //   "media",
  //   "http://localhost:7070/encoded_segments/segment240p_0$Number$.mp4"
  // );
  // segmentTemplate4.att("timescale", "1000");
  // segmentTemplate4.att("startNumber", "0");
  // segmentTemplate4.att("duration", "3000");

  const output = mpd.end({ pretty: true });

  res.setHeader("Content-Type", "application/dash+xml");
  res.attachment("playlist.mpd");
  res.send(output);
});

app.get("/encoded_segments/:segmentFileName", (req, res) => {
  console.log(req.params.segmentFileName);
  console.log("PLS FKN WORK");
  const path = `encoded_segments/${req.params.segmentFileName}`;

  // const mp4boxFile = mp4box.createFile();
  // const inputFilePath = path;
  // const outputFolderPath = "fragmented_segments";
  // mp4boxFile.onError = (error) => {
  //   console.error("MP4Box error:", error);
  // };

  // mp4boxFile.onReady = () => {
  //   mp4boxFile.setSegmentOptions({ nbSamples: 1000, rapAlignement: true });
  //   mp4boxFile.setOutputFileName(`${outputFolderPath}/output.mpd`);
  //   mp4boxFile.flush();
  // };
  // const inputFileStream = fs.createReadStream(inputFilePath);
  // inputFileStream.on("data", (data) => {
  //   const arrayBuffer = data.buffer.slice(
  //     data.byteOffset,
  //     data.byteOffset + data.byteLength
  //   );
  //   mp4boxFile.appendBuffer(arrayBuffer);
  // });

  // inputFileStream.on("end", () => {
  //   mp4boxFile.flush();
  // });

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
  // mp4box.createFileByteStream(path, (err, stream) => {
  //   if (err) {
  //     console.error(err);
  //   } else {
  //     mp4box
  //       .loadAsync(stream)
  //       .then(() => {
  //         console.log(mp4box.getInfo());
  //       })
  //       .catch((err) => {
  //         console.error(err);
  //       });
  //   }
  // });

  // const stat = fs.statSync(path);
  // const fileSize = stat.size;
  // const range = req.headers.range;

  // if (range) {
  //   const parts = range.replace(/bytes=/, "").split("-");
  //   const start = parseInt(parts[0], 10);
  //   const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  //   const chunkSize = end - start + 1;
  //   const file = fs.createReadStream(path, { start, end });
  //   const headers = {
  //     "Content-Range": `bytes ${start}-${end}/${fileSize}`,
  //     "Accept-Ranges": "bytes",
  //     "Content-Length": chunkSize,
  //     "Content-Type": "iso.segment",
  //     "Cache-Control": "max-age=31536000",
  //     "Access-Control-Allow-Origin": "*",
  //     "Access-Control-Allow-Headers": "Range",
  //   };
  //   res.writeHead(206, headers);
  //   file.pipe(res);
  // } else {
  //   const headers = {
  //     "Content-Length": fileSize,
  //     "Content-Type": "video/mp4",
  //   };
  //   res.writeHead(200, headers);
  //   fs.createReadStream(path).pipe(res);
  // }

  // fs.readFile(`encoded_segments/${req.params.segmentFileName}`, (err, data) => {
  //   if (err) {
  //     res.writeHead(404);
  //     res.end("File not found");
  //     return;
  //   }

  // res.writeHead(200, {
  //   "Content-Type": "video/mp4",
  //   "Content-Length": data.length,
  //   "Cache-Control": "max-age=31536000",
  //   "Access-Control-Allow-Origin": "*",
  //   "Access-Control-Allow-Headers": "Range",
  // });
  // res.end(data);
  // });
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
