import {
    renderResult,
    renderDecimalFormula,
    renderSteps,
    updateLiveResult,
    forceValidBounds,
    renderStepVisualization,
    updateAllowedCharsHint,
    updateExampleHint,
    liveValidateInput,
    showError,
    clearError,
    markInvalid,
    clearInvalidMarks,
    highlightActiveStep
} from "./ui.js";

let steps = [];
let currentStepIndex = 0;
let currentTargetBase = null;
let isConverting = false;

async function convert() {

    if (isConverting) return;
    isConverting = true;

    clearError();
    clearInvalidMarks();
    clearPreviousResults();

    const rawValue = document.getElementById("value").value;
    const rawSourceBase = document.getElementById("sourceBase").value;
    const rawTargetBase = document.getElementById("targetBase").value;
    const rawPrecision = document.getElementById("precision").value;

    const value = String(rawValue).trim();
    const sourceBase = Number.parseInt(rawSourceBase, 10);
    const targetBase = Number.parseInt(rawTargetBase, 10);
    const precision = Number.parseInt(rawPrecision, 10);

    const decimalBlock = document.getElementById("decimal-conversion-block");

    try {
        if (!Number.isInteger(sourceBase) || sourceBase < 2 || sourceBase > 36) {
            markInvalid("sourceBase");
            throw new Error("Вихідна система повинна бути цілим числом у діапазоні 2–36");
        }
        if (!Number.isInteger(targetBase) || targetBase < 2 || targetBase > 36) {
            markInvalid("targetBase");
            throw new Error("Цільова система повинна бути цілим числом у діапазоні 2–36");
        }
        if (!Number.isInteger(precision) || precision < 0 || precision > 50) {
            markInvalid("precision");
            throw new Error("Точність повинна бути цілим числом від 0 до 50");
        }
        if (value.length === 0) {
            markInvalid("value");
            clearPreviousResults();
            throw new Error("Поле значення не може бути порожнім");
        }

        const payload = {
            value: value,
            source_base: sourceBase,
            target_base: targetBase,
            precision: precision
        };

        console.log("Дані, що відправляються на бекенд:", payload);

        const response = await fetch("/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let serverError = null;
            try {
                const json = await response.json();
                if (json && typeof json === "object") {
                    if (json.error) {
                        serverError = json.error;
                    } else if (json.detail) {
                        if (Array.isArray(json.detail) && json.detail.length > 0) {
                            serverError = json.detail.map(d => d.msg || JSON.stringify(d)).join("; ");
                        } else {
                            serverError = JSON.stringify(json.detail);
                        }
                    } else {
                        serverError = JSON.stringify(json);
                    }
                } else {
                    serverError = String(json);
                }
            } catch (e) {
                try {
                    const text = await response.text();
                    serverError = text || `HTTP ${response.status}`;
                } catch {
                    serverError = `HTTP ${response.status}`;
                }
            }

            showError(serverError);
            console.error("Server error:", response.status, serverError);
            clearPreviousResults();
            return;
        }


        const data = await response.json();

        if (!data || !data.result || !Array.isArray(data.steps) || typeof data.precision !== "object" || data.precision === null) {
            showError("Некоректна відповідь сервера");
            console.error("Invalid server response:", data);
            return;
        }

        const resultsWrapper = document.getElementById("results-wrapper");
        if (resultsWrapper) {
            resultsWrapper.hidden = false;
        }

        steps = data.steps;
        window.steps = steps;
        currentTargetBase = data.result.base;
        window.currentConversionResult = data;
        currentStepIndex = 0;

        renderResult(data, value);

        if (decimalBlock) {
            if (sourceBase !== 10) {
                decimalBlock.hidden = false;
                renderDecimalFormula(data, value, sourceBase);
            } else {
                decimalBlock.hidden = true;
            }
        }

        renderSteps(steps, currentTargetBase);

        if (steps.length > 0) {
            highlightStep(0);
        } else {

            const container = document.getElementById("division-visualization");
            if (container) container.innerHTML = "";
            updateStepCounter();
        }

    } catch (err) {
        if (err instanceof TypeError) {
            showError("Запит не виконано. Можлива проблема з CORS або сервер недоступний.");
            console.error("TypeError (мережа/CORS):", err);
        }
        else if (err instanceof Error) {
            try {
                const parsed = JSON.parse(err.message);
                if (parsed && parsed.error) {
                    showError("Помилка від сервера: " + parsed.error);
                    console.error("Server error JSON:", parsed);
                } else {
                    showError("Помилка: " + err.message);
                    console.error("Error message:", err.message);
                }
            } catch {
                showError("Помилка: " + err.message);
                console.error("Error raw:", err);
            }
        }
        else {
            showError("Невідома помилка: " + (err && err.message ? err.message : String(err)));
            clearPreviousResults();
            console.error("Unknown error:", err);
        }
    } finally {
        isConverting = false;
    }
}


function highlightStep(index) {
    if (!steps[index]) return;
    highlightActiveStep(index);

    renderStepVisualization(steps[index], currentTargetBase);
    updateLiveResult(steps[index], currentTargetBase);

    currentStepIndex = index;
    updateStepCounter();
}

function updateStepCounter() {
    const counter = document.getElementById("step-counter");
    if (!counter) return;
    counter.textContent = steps.length ? `Крок ${currentStepIndex + 1} з ${steps.length}` : "";
}

function nextStep() {
    if (currentStepIndex < steps.length - 1) highlightStep(currentStepIndex + 1);
}
function prevStep() {
    if (currentStepIndex > 0) highlightStep(currentStepIndex - 1);
}

const sourceBaseInput = document.getElementById("sourceBase");
const targetBaseInput = document.getElementById("targetBase");
const valueInput = document.getElementById("value");

if (sourceBaseInput) {
    sourceBaseInput.addEventListener("input", () => checkBaseLimits(sourceBaseInput));
    sourceBaseInput.addEventListener("blur", () => forceValidBounds(sourceBaseInput));
    sourceBaseInput.addEventListener("input", updateAllowedCharsHint);
    sourceBaseInput.addEventListener("input", updateExampleHint);
    sourceBaseInput.addEventListener("input", liveValidateInput);
}

if (targetBaseInput) {
    targetBaseInput.addEventListener("input", () => checkBaseLimits(targetBaseInput));
    targetBaseInput.addEventListener("blur", () => forceValidBounds(targetBaseInput));
}

if (valueInput) {
    valueInput.addEventListener("input", liveValidateInput);
}


document.addEventListener("click", (event) => {
    if (event.target.id === "toggle-details") {
        const detailsSection = document.getElementById("details-section");
        if (!detailsSection) return;

        const isHidden = detailsSection.style.display === "none" || detailsSection.style.display === "";
        detailsSection.style.display = isHidden ? "block" : "none";

        event.target.innerText = isHidden ? "Приховати деталі ↑" : "Детальніше ↓";
        return;
    }

    const row = event.target.closest("tr[data-index]");
    if (row) {
        const index = parseInt(row.dataset.index, 10);
        if (typeof steps !== 'undefined' && !isNaN(index) && index >= 0 && index < steps.length) {
            if (typeof highlightStep === 'function') {
                highlightStep(index);
            }
        }
    }
});

function clearPreviousResults() {

    const inputNumber = document.getElementById("input-number");
    const outputNumber = document.getElementById("output-number");
    const exactness = document.getElementById("exactness");

    if (inputNumber) inputNumber.textContent = "";
    if (outputNumber) outputNumber.textContent = "";
    if (exactness) exactness.textContent = "";

    const decimalFormula = document.getElementById("decimal-conversion-formula");
    const decimalResultValue = document.getElementById("decimal-result-value");

    if (decimalFormula) decimalFormula.textContent = "";
    if (decimalResultValue) decimalResultValue.textContent = "";

    const liveResult = document.getElementById("live-result-value");
    if (liveResult) {
        liveResult.textContent = "";
    }

    const divisionVisualization = document.getElementById("division-visualization");
    const stepCounter = document.getElementById("step-counter");

    if (divisionVisualization) divisionVisualization.innerHTML = "";
    if (stepCounter) stepCounter.textContent = "";

    const integerStepsTable = document.getElementById("integer-steps");
    const fractionStepsTable = document.getElementById("fraction-steps");

    if (integerStepsTable) integerStepsTable.innerHTML = "";
    if (fractionStepsTable) fractionStepsTable.innerHTML = "";

    const detailsSection = document.getElementById("details-section");
    if (detailsSection) {
        detailsSection.style.display = "none";
    }

    const toggleBtn = document.getElementById("toggle-details");
    if (toggleBtn) {
        toggleBtn.innerText = "Детальніше ↓";
    }

    const resultsWrapper = document.getElementById("results-wrapper");
    if (resultsWrapper) {
        resultsWrapper.hidden = true;
    }

    if (typeof steps !== 'undefined') steps = [];
    if (typeof currentStepIndex !== 'undefined') currentStepIndex = 0;
    window.steps = [];
    window.currentConversionResult = null;
}

updateAllowedCharsHint();
updateExampleHint();

window.convert = convert;
window.nextStep = nextStep;
window.prevStep = prevStep;
