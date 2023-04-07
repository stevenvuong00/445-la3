const express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");
const { Readable } = require("stream");
// const readStream = new stream.PassThrough();
const app = express();
const port = 7070;
const multer = require("multer");

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../../public_html/segments"); // specify the destination directory for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `video-${Date.now()}.mp4`); // set the filename for the uploaded file
  },
});
const upload = multer({ storage: storage });

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app.post("/lab", upload.single("video"), (req, res) => {
//   const file = req.file;
//   res.send(req.body);
// });

app.post("/lab", upload.single("video"), (req, res) => {
  let sentResponse = false;
  const videoFile = req.file;

  if (!videoFile) {
    res.status(400).json({ error: "Please upload a valid video file" });
    return;
  }
  const outputPath = "../../public_html/segments";

  const command = ffmpeg(videoFile.path)
    .outputOptions("-c:v", "libx264")
    .outputOptions("-f", "segment")
    .outputOptions("-segment_time", "3")
    .outputOptions("-reset_timestamps", "1")
    .on("end", () => {
      if (!sentResponse) {
        console.log("Video split into chunks successfully");
        res.send("Video split into chunks successfully");
      }
      sentResponse = true;
    })
    .save(outputPath + "segment_%d" + Date.now() + ".mp4")
    .run();

  // const command1 = ffmpeg(videoFile.path)
  //   .audioCodec("aac")
  //   .audioBitrate("128k")
  //   .size("1280x720")
  //   .outputOptions("-c:v", "libx264")
  //   .outputOptions("-f", "segment")
  //   .outputOptions("-segment_time", "3")
  //   .outputOptions("-reset_timestamps", "1")
  //   .on("end", () => {
  //     console.log("720p done");
  //   })
  //   .save(outputPath + "720p/segment_%d" + Date.now() + ".mp4")
  //   .run();

  // const command2 = ffmpeg(videoFile.path)
  //   .audioCodec("aac")
  //   .audioBitrate("128k")
  //   .size("854x480")
  //   .outputOptions("-c:v", "libx264")
  //   .outputOptions("-f", "segment")
  //   .outputOptions("-segment_time", "3")
  //   .outputOptions("-reset_timestamps", "1")
  //   .on("end", () => {
  //     console.log("480p done");
  //   })
  //   .save(outputPath + "480p/segment_%d" + Date.now() + ".mp4")
  //   .run();

  // const command3 = ffmpeg(videoFile.path)
  //   .audioCodec("aac")
  //   .audioBitrate("128k")
  //   .size("640x360")
  //   .outputOptions("-c:v", "libx264")
  //   .outputOptions("-f", "segment")
  //   .outputOptions("-segment_time", "3")
  //   .outputOptions("-reset_timestamps", "1")
  //   .on("end", () => {
  //     console.log("360p done");
  //   })
  //   .save(outputPath + "360p/segment_%d" + Date.now() + ".mp4")
  //   .run();

  // const command4 = ffmpeg(videoFile.path)
  //   .audioCodec("aac")
  //   .audioBitrate("64k")
  //   .size("426x240")
  //   .outputOptions("-c:v", "libx264")
  //   .outputOptions("-f", "segment")
  //   .outputOptions("-segment_time", "3")
  //   .outputOptions("-reset_timestamps", "1")
  //   .on("end", () => {
  //     if (!sentResponse) {
  //       console.log("240p done");
  //       res.send("Video split into chunks successfully");
  //     }
  //     sentResponse = true;
  //   })
  //   .save(outputPath + "240p/segment_%d" + Date.now() + ".mp4")
  //   .run();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
