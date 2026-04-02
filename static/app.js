const form = document.getElementById("predict-form");
const button = document.getElementById("predict-btn");
const resetButton = document.getElementById("reset-btn");
const quickButtons = document.querySelectorAll(".quick-btn");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const predictionValue = document.getElementById("prediction-value");
const moodPill = document.getElementById("sales-mood");
const smartTip = document.getElementById("smart-tip");
const confidenceFill = document.getElementById("confidence-fill");
const confidenceText = document.getElementById("confidence-text");
const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");

const presets = {
  sunny: { day: "Saturday", month: "July", temperature: 89, rainfall: 0.04 },
  rainy: { day: "Monday", month: "April", temperature: 56, rainfall: 0.9 },
  weekend: { day: "Sunday", month: "June", temperature: 84, rainfall: 0.12 },
};

const historyStorageKey = "icecream_prediction_history";

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function showResult(value) {
  predictionValue.textContent = value;
  resultBox.classList.remove("hidden");
  resultBox.classList.remove("pop");
  void resultBox.offsetWidth;
  resultBox.classList.add("pop");
}

function clearResult() {
  predictionValue.textContent = "";
  resultBox.classList.add("hidden");
}

function setMood(prediction) {
  moodPill.classList.remove(
    "mood-low",
    "mood-medium",
    "mood-high",
    "mood-peak",
  );

  if (prediction < 70) {
    moodPill.classList.add("mood-low");
    moodPill.textContent = "Slow and cozy";
    return;
  }

  if (prediction < 130) {
    moodPill.classList.add("mood-medium");
    moodPill.textContent = "Steady scoop flow";
    return;
  }

  if (prediction < 180) {
    moodPill.classList.add("mood-high");
    moodPill.textContent = "Busy and sweet";
    return;
  }

  moodPill.classList.add("mood-peak");
  moodPill.textContent = "Peak rush";
}

function updateSmartTip(temp, rain, prediction) {
  if (rain > 0.75) {
    smartTip.textContent =
      "Heavy rain usually lowers walk-in orders. Offer combo deals.";
    return;
  }

  if (temp > 85 && prediction > 150) {
    smartTip.textContent =
      "Hot day alert: prep extra cones and toppings for a likely rush.";
    return;
  }

  if (prediction < 80) {
    smartTip.textContent =
      "Demand looks light. Keep production lean to reduce waste.";
    return;
  }

  smartTip.textContent =
    "Balanced demand expected. Keep your regular prep plan.";
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(historyStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(historyStorageKey, JSON.stringify(entries.slice(0, 6)));
}

function renderHistory() {
  const entries = loadHistory();
  historyList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent =
      "No predictions yet. Use quick examples to get started.";
    historyList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    item.innerHTML = `<span>${entry.day}, ${entry.month} • ${entry.temp}F • ${entry.rain}in</span><strong>${entry.prediction}</strong>`;
    historyList.appendChild(item);
  });
}

function addHistoryEntry(payload, prediction) {
  const entries = loadHistory();
  entries.unshift({
    day: payload.day_of_week,
    month: payload.month,
    temp: Number(payload.temperature).toFixed(1),
    rain: Number(payload.rainfall).toFixed(2),
    prediction,
  });
  saveHistory(entries);
  renderHistory();
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) {
    return;
  }

  form.elements.day_of_week.value = preset.day;
  form.elements.month.value = preset.month;
  form.elements.temperature.value = preset.temperature;
  form.elements.rainfall.value = preset.rainfall;
}

function resetFormState() {
  form.reset();
  clearError();
  clearResult();
  moodPill.classList.remove(
    "mood-low",
    "mood-medium",
    "mood-high",
    "mood-peak",
  );
  moodPill.textContent = "Waiting for prediction";
  smartTip.textContent = "Try a quick example to compare different days.";
}

async function loadMetrics() {
  try {
    const response = await fetch("/api/metrics");
    const data = await response.json();

    document.getElementById("rmse").textContent = `${data.rmse ?? "-"}%`;
    document.getElementById("mae").textContent = `${data.mae ?? "-"}%`;
    document.getElementById("r2").textContent = `${data.r2 ?? "-"}%`;

    const confidence = Number(data.r2 ?? 0);
    confidenceFill.style.width = `${Math.max(0, Math.min(100, confidence))}%`;
    confidenceText.textContent = `${confidence.toFixed(2)}% confidence`;
  } catch {
    document.getElementById("rmse").textContent = "N/A";
    document.getElementById("mae").textContent = "N/A";
    document.getElementById("r2").textContent = "N/A";
    confidenceFill.style.width = "0%";
    confidenceText.textContent = "Unavailable";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  clearResult();

  const formData = new FormData(form);
  const payload = {
    day_of_week: formData.get("day_of_week"),
    month: formData.get("month"),
    temperature: Number(formData.get("temperature")),
    rainfall: Number(formData.get("rainfall")),
  };

  button.disabled = true;
  button.textContent = "Predicting...";

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "Could not calculate prediction.");
      return;
    }

    showResult(data.prediction);
    setMood(Number(data.prediction));
    updateSmartTip(
      payload.temperature,
      payload.rainfall,
      Number(data.prediction),
    );
    addHistoryEntry(payload, data.prediction);
  } catch {
    showError("Server is not reachable. Please run python app.py and retry.");
  } finally {
    button.disabled = false;
    button.textContent = "Predict Sales";
  }
});

quickButtons.forEach((quickButton) => {
  quickButton.addEventListener("click", () => {
    applyPreset(quickButton.dataset.preset);
  });
});

resetButton.addEventListener("click", () => {
  resetFormState();
});

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(historyStorageKey);
  renderHistory();
});

loadMetrics();
renderHistory();
