document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("upload-button");
  const processingLoading = document.getElementById("processing-loading");
  const resultsNameList = document.getElementById("results-name-list");

  if (uploadButton) {
    initWelcomePage();
  } else if (processingLoading) {
    initProcessingPage();
  } else if (resultsNameList) {
    initResultsPage();
  }
});

function initWelcomePage() {
  const uploadInput = document.getElementById("cat-input");
  const uploadButton = document.getElementById("upload-button");
  const nameButton = document.getElementById("name-button");
  const previewImg = document.getElementById("cat-preview");
  const previewPlaceholder = document.getElementById("preview-placeholder");

  if (!uploadInput || !uploadButton || !nameButton || !previewImg || !previewPlaceholder) {
    return;
  }

  uploadButton.addEventListener("click", () => {
    uploadInput.click();
  });

  uploadInput.addEventListener("change", () => {
    if (uploadInput.files && uploadInput.files.length > 0) {
      nameButton.classList.remove("btn-hidden");

      const file = uploadInput.files[0];
      try {
        sessionStorage.removeItem("catNames");
        sessionStorage.removeItem("catAnalysisError");
      } catch {
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target && event.target.result;
        if (typeof result === "string") {
          previewImg.src = result;
          previewImg.classList.add("has-image");
          previewPlaceholder.classList.add("is-hidden");
          try {
            sessionStorage.setItem("catPhoto", result);
          } catch {
            // ignore storage issues, still show preview locally
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      nameButton.classList.add("btn-hidden");
      previewImg.src = "";
      previewImg.classList.remove("has-image");
      previewPlaceholder.classList.remove("is-hidden");
      try {
        sessionStorage.removeItem("catPhoto");
      } catch {
        // ignore
      }
    }
  });

  nameButton.addEventListener("click", () => {
    const storedPhoto = safeGetSessionItem("catPhoto");
    if (!storedPhoto) {
      return;
    }
    window.location.href = "processing.html";
  });
}

function initProcessingPage() {
  const remarkElement = document.getElementById("processing-remark");
  if (!remarkElement) {
    return;
  }

  const errorBox = document.getElementById("processing-error");
  const errorMessage = document.getElementById("processing-error-message");
  const retryButton = document.getElementById("processing-retry");
  const loadingBox = document.getElementById("processing-loading");

  const storedPhoto = safeGetSessionItem("catPhoto");
  if (!storedPhoto) {
    window.location.href = "index.html";
    return;
  }

  const remarks = [
    "Counting whiskers and calibrating zoomies.",
    "Measuring loaf stability...",
    "Checking if this cat respects gravity (probably not).",
    "Ranking levels of main‑character energy.",
    "Comparing face to worldwide blep database.",
  ];

  let index = 0;
  remarkElement.textContent = remarks[index];

  const intervalId = window.setInterval(() => {
    index = (index + 1) % remarks.length;
    if (remarkElement) {
      remarkElement.textContent = remarks[index];
    }
  }, 1400);

  function showProcessingError(message) {
    window.clearInterval(intervalId);
    if (loadingBox) {
      loadingBox.classList.add("is-hidden");
    }
    if (errorBox && errorMessage) {
      errorMessage.textContent = message || "Something went wrong while naming this cat.";
      errorBox.classList.remove("is-hidden");
    }
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }
  }

  analyzePhoto(storedPhoto)
    .then(() => {
      window.clearInterval(intervalId);
      window.location.href = "results.html";
    })
    .catch((error) => {
      const message = error && typeof error.message === "string" ? error.message : "We could not reach the naming service.";
      showProcessingError(message);
    });
}

function initResultsPage() {
  const resultPhoto = document.getElementById("result-photo");
  const resultsNameList = document.getElementById("results-name-list");

  if (!resultPhoto || !resultsNameList) {
    return;
  }

  const storedPhoto = safeGetSessionItem("catPhoto");
  if (!storedPhoto) {
    window.location.href = "index.html";
    return;
  }

  resultPhoto.src = storedPhoto;

  const fallbackNames = [
    "Moonwhisker",
    "Pixel",
    "Miso",
    "Nova",
    "Marshmallow",
    "Orbit",
    "Sushi",
    "Comet",
  ];

  const rawNames = safeGetSessionItem("catNames");
  const storedError = safeGetSessionItem("catAnalysisError");
  const resultsErrorBox = document.getElementById("results-error");
  const resultsErrorMessage = document.getElementById("results-error-message");

  let names = [];

  if (rawNames) {
    try {
      const parsed = JSON.parse(rawNames);
      if (Array.isArray(parsed)) {
        names = parsed;
      }
    } catch {
    }
  }

  if (!names.length) {
    names = fallbackNames;
  }

  resultsNameList.innerHTML = "";
  names.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "results-name-item";

    const spanName = document.createElement("span");
    spanName.className = "results-name-text";
    spanName.textContent = name;

    li.appendChild(spanName);
    resultsNameList.appendChild(li);
  });

  if (storedError && resultsErrorBox && resultsErrorMessage) {
    resultsErrorMessage.textContent = storedError;
    resultsErrorBox.classList.remove("is-hidden");
  }
}

function safeGetSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

async function analyzePhoto(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error("Could not read the uploaded image.");
  }
  const blob = await response.blob();
  const formData = new FormData();
  formData.append("image", blob, "cat-photo.png");

  let result;

  try {
    const apiResponse = await fetch("http://localhost:4000/api/analyze", {
      method: "POST",
      body: formData,
    });

    if (!apiResponse.ok) {
      let message = "The naming service returned an error.";
      try {
        const errorBody = await apiResponse.json();
        if (errorBody && typeof errorBody.error === "string") {
          message = errorBody.error;
        }
      } catch {
      }
      throw new Error(message);
    }

    result = await apiResponse.json();
  } catch (error) {
    const message = error && typeof error.message === "string" ? error.message : "Network error while contacting the naming service.";
    try {
      sessionStorage.setItem("catNames", JSON.stringify([]));
      sessionStorage.setItem("catAnalysisError", message);
    } catch {
    }
    throw new Error(message);
  }

  const names = Array.isArray(result && result.names) ? result.names : [];

  try {
    sessionStorage.setItem("catNames", JSON.stringify(names));
    sessionStorage.setItem("catAnalysisError", "");
  } catch {
  }
}


