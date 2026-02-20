const express = require("express");
const multer = require("multer");
const { analyzeCatImage } = require("../services/analyzeCatImage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required" });
      return;
    }

    const result = await analyzeCatImage({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

