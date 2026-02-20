const crypto = require("crypto");

async function prepareImageForModel(file) {
  const requestId = crypto.randomUUID();
  const base64 = file.buffer.toString("base64");
  const dataUrl = `data:${file.mimeType};base64,${base64}`;

  return {
    requestId,
    mimeType: file.mimeType,
    size: file.size,
    dataUrl,
    base64,
  };
}

module.exports = {
  prepareImageForModel,
};
