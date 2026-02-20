const { prepareImageForModel } = require("./imagePreprocessor");
const { getNamesForImage } = require("./nameModelClient");

async function analyzeCatImage(file) {
  const prepared = await prepareImageForModel(file);
  const names = await getNamesForImage(prepared);

  return {
    requestId: prepared.requestId,
    names,
    image: {
      mimeType: prepared.mimeType,
      size: prepared.size,
    },
  };
}

module.exports = {
  analyzeCatImage,
};

