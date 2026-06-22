import { getAllowedChars, validateInput } from "./utils.js";

export function updateAllowedCharsHint() {
    const base = parseInt(
        document.getElementById("sourceBase").value,
        10
    );

    const hintBox = document.getElementById(
        "allowed-chars-hint"
    );

    if (!Number.isInteger(base) || base < 2 || base > 36) {
        hintBox.textContent = "";
        return;
    }

    let allowedText;

    if (base <= 10) {
        allowedText = `0–${base - 1}`;
    } else if (base === 11) {
        allowedText = "0–9, A";
    } else {
        const lastLetter =
            String.fromCharCode(
                "A".charCodeAt(0) + (base - 11)
            );

        allowedText = `0–9, A–${lastLetter}`;
    }

    hintBox.innerHTML =
        `Дозволені символи для вхідного числа: <strong>${allowedText}</strong>`;
}

export function updateExampleHint() {
    const base = parseInt(document.getElementById("sourceBase").value, 10);
    const box = document.getElementById("example-hint");

    if (!Number.isInteger(base) || base < 2 || base > 36) {
        box.textContent = "";
        return;
    }

    const examples = {
        2: "Наприклад: 1011.01",
        8: "Наприклад: 17.4",
        10: "Наприклад: 12.375",
        16: "Наприклад: A3.F",
        36: "Наприклад: Z9.8"
    };

    box.textContent =
        examples[base] ??
        `Приклад: 1${getAllowedChars(base)[base - 1]}.0`;
}

export function liveValidateInput() {
    const valueField = document.getElementById("value");
    const base = parseInt(document.getElementById("sourceBase").value, 10);

    if (!Number.isInteger(base) || base < 2 || base > 36) {
        valueField.classList.remove("invalid");
        valueField.title = "";
        return;
    }

    const error = validateInput(valueField.value.trim(), base);

    if (error) {
        valueField.classList.add("invalid");
        valueField.title = error;
    } else {
        valueField.classList.remove("invalid");
        valueField.title = "";
    }
}

export function renderResult(data, originalValue) {
    const result = data.result || data;
    const formatted = result.formatted || "";

    const inputEl = document.getElementById("input-number");
    const outputEl = document.getElementById("output-number");
    const precisionBox = document.getElementById("exactness");

    if (!inputEl || !outputEl) {
        console.error("HTML elements for result not found");
        return;
    }

    const precisionInput = document.getElementById("precision");
    const userPrecision = precisionInput ? parseInt(precisionInput.value, 10) : 0;

    let [intPart, fracPart = ""] = formatted.split(".");
    let longVersion = formatted;

    if (userPrecision > 0) {
        const paddedFrac = fracPart.padEnd(userPrecision, "0");
        longVersion = `${intPart}.${paddedFrac}`;
    }

    const shortVersion = longVersion.includes(".")
        ? longVersion.replace(/0+$/, "").replace(/\.$/, "")
        : longVersion;

    document.getElementById("input-number").innerHTML = `
    <span class="result-label">Вхідне число</span>
    <span class="result-value">${originalValue}</span>
`;

    const outputElement = document.getElementById("output-number");

    if (longVersion !== shortVersion) {
        outputElement.innerHTML = `
        <span class="result-label">Результат</span>

        <div class="result-main-value">
            ${longVersion}<sub>${result.base}</sub>
        </div>

        <div class="result-approx">
            ≈
        </div>

        <div class="result-secondary-value">
            ${shortVersion}<sub>${result.base}</sub>
        </div>
    `;
    } else {
        outputElement.innerHTML = `
        <span class="result-label">Результат</span>

        <div class="result-main-value">
            ${formatted}<sub>${result.base}</sub>
        </div>
    `;
    }

    if (!precisionBox || !data.precision) return;

    const abs = data.precision.absolute_error?.float_value;
    const rel = data.precision.relative_error?.float_value;
    const isExact = result.is_exact;

    const format = (v) => {
        if (v === undefined || v === null) return "—";
        if (typeof v !== "number" || Number.isNaN(v)) return "—";
        if (v === 0) return "0";
        return Math.abs(v) < 1e-6 ? v.toExponential(3) : v.toPrecision(6);
    };

    precisionBox.innerText =
        `Абсолютна похибка: ${format(abs)}\n` +
        `Відносна похибка: ${format(rel)}\n` +
        `Статус: ${isExact ? "Точне значення" : "Наближене представлення"}`;

    const detailsSection = document.getElementById("details-section");
    const toggleBtn = document.getElementById("toggle-details");
    if (detailsSection && toggleBtn) {
        detailsSection.style.display = "none";
        toggleBtn.innerText = "Детальніше ↓";
    }
}


export function renderSteps(steps, targetBase) {
    const intBody = document.getElementById("integer-steps");
    const fracBody = document.getElementById("fraction-steps");

    if (!intBody || !fracBody) return;

    intBody.innerHTML = "";
    fracBody.innerHTML = "";

    steps.forEach((step, index) => {
        if (!step) return;

        const type = step.step_type;
        const row = (type === "INTEGER_DIVISION" || type === "BASE_POWER_EXPANSION") ? intBody.insertRow() : fracBody.insertRow();
        row.dataset.index = index;

        if (type === "INTEGER_DIVISION") {
            row.insertCell().innerText = step.input_state?.value ?? "—";
            row.insertCell().innerText = targetBase;
            row.insertCell().innerText = step.output_state?.quotient ?? "—";
            row.insertCell().innerText = step.output_state?.remainder ?? "—";
        } else if (type === "FRACTION_MULTIPLICATION") {
            row.insertCell().innerText = formatDecimal(step.input_state?.decimal_value);
            row.insertCell().innerText = targetBase;
            row.insertCell().innerText = step.output_state?.digit ?? "—";
            row.insertCell().innerText = formatDecimal(step.output_state?.new_decimal_fraction);
        } else if (type === "ROUNDING") {
            row.insertCell().innerText = "—";
            row.insertCell().innerText = targetBase;
            row.insertCell().innerText = "Округлення";
            row.insertCell().innerText = `Перенос: ${step.output_state?.carry_to_integer ?? 0}`;
        } else if (type === "BASE_POWER_EXPANSION") {
            row.insertCell().innerText = `Цифра: ${step.input_state?.digit ?? "—"}`;
            row.insertCell().innerText = `Степінь: ${step.input_state?.power ?? "—"}`;
            row.insertCell().innerText = "Додавання";
            row.insertCell().innerText = `Сума: ${step.output_state?.partial_sum ?? "—"}`;
        }
    });
}

export function renderStepVisualization(step, targetBase) {
    const container = document.getElementById("division-visualization");
    if (!container || !step) return;
    container.innerHTML = "";

    if (step.step_type === "INTEGER_DIVISION") {
        renderIntegerDivision(step, container, targetBase);
    } else if (step.step_type === "FRACTION_MULTIPLICATION") {
        renderFractionMultiplication(step, container, targetBase);
    } else if (step.step_type === "ROUNDING") {
        renderRoundingStep(step, container, targetBase);
    } else if (step.step_type === "BASE_POWER_EXPANSION") {
        renderBasePowerExpansion(step, container, targetBase);
    }
}

function renderBasePowerExpansion(step, container, targetBase) {
    const digit = step.input_state?.digit ?? "—";
    const power = step.input_state?.power ?? "—";
    const partialSum = step.output_state?.partial_sum ?? "—";

    const wrapper = document.createElement("div");

    wrapper.className = "visualization-wrapper";

    wrapper.innerHTML = `
        <div class="expansion-visual">

            <div class="expansion-title">
                Перетворення в десяткову систему
            </div>

            <div class="expansion-description">
                Множимо цифру
                <span class="digit-highlight">${digit}</span>
                на основу у степені
                <span class="power-highlight">${power}</span>
            </div>

            <div class="partial-sum-card">
                <span class="partial-sum-label">
                    Поточна сума
                </span>

                <span class="partial-sum-value">
                    ${partialSum}
                </span>
            </div>

        </div>
    `;

    container.appendChild(wrapper);
}


function renderRoundingStep(step, container, targetBase) {
    const before = step.input_state?.digits_before_rounding ?? [];
    const after = step.output_state?.digits_after_rounding ?? [];
    const carry = step.output_state?.carry_to_integer ?? 0;

    const wrapper = document.createElement("div");
    wrapper.className = "visualization-wrapper";
    wrapper.innerHTML = `
        <div class="rounding-visual" style="line-height:1.6;">
            <p>Виконуємо округлення (Round-Half-Up).</p>
            <p>Цифри до округлення: <strong>${before.join("")}</strong></p>
            <p>Цифри після округлення: <strong>${after.join("")}</strong></p>
            <p>Перенос у цілу частину: <strong>${carry}</strong></p>
        </div>
    `;
    container.appendChild(wrapper);
}


function renderIntegerDivision(step, container, targetBase) {
    container.innerHTML = "";

    const allSteps = window.currentConversionResult?.steps || window.steps || [];

    const integerSteps = allSteps.filter(
        s => s.step_type === "INTEGER_DIVISION" || s.step_type === "integer"
    );

    if (String(step.step_type).toUpperCase() !== "INTEGER_DIVISION") {
        return;
    }
    const currentIndex = integerSteps.findIndex(
        s => s.index === step.index
    );

    if (currentIndex === -1) return;

    const visibleSteps = integerSteps.slice(0, currentIndex + 1);

    const divisionHtml = visibleSteps.map((s) => {
        const dividend = s.input_state?.value ?? s.input_state?.integer_part ?? 0;
        const quotient = s.output_state?.quotient ?? 0;
        const remainder = s.output_state?.remainder ?? 0;
        const isCurrent = s.index === step.index;

        return `
            <div class="long-division-step ${isCurrent ? "current-division-step" : ""}">
                <div class="division-top">
                    <span class="division-dividend">${dividend}</span>
                    <span class="division-bar"></span>
                    <span class="division-base">${targetBase}</span>
                </div>
                <div class="division-bottom">
                    <span class="division-remainder">${remainder}</span>
                    <span class="division-quotient">${quotient}</span>
                </div>
            </div>
        `;
    }).join("");

    const currentDividend = step.input_state?.value ?? step.input_state?.integer_part ?? "—";
    const currentQuotient = step.output_state?.quotient ?? 0;
    const currentRemainder = step.output_state?.remainder ?? "—";
    const isLastStep = Number(currentQuotient) === 0;

    const wrapper = document.createElement("div");
    wrapper.className = "visualization-wrapper";
    wrapper.innerHTML = `
        <div class="long-division-wrapper">
            <div class="division-scroll">
                <div class="long-division-history">
                    ${divisionHtml}
                </div>
            </div>
        
            <div class="division-explanation" style="margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 12px; text-align: left;">
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.5; font-size: 0.92rem;">
                    <li style="margin-bottom: 6px;">
                        • Ділимо <span style="font-weight: bold; color: #1e293b;">${currentDividend}</span> на основу <span style="color: #4f46e5; font-weight: bold;">${targetBase}</span>.
                    </li>
                    <li style="margin-bottom: 6px;">
                        • Отримуємо остачу <span style="color: #ea580c; font-weight: bold;">${currentRemainder}</span>. Це наступна цифра результату (записуємо її <strong>справа наліво</strong>).
                    </li>
                    <li style="margin-bottom: 3px;">
                        • Нова частка <span style="color: #16a34a; font-weight: bold;">${currentQuotient}</span> стає числом, яке ми будемо ділити на наступному кроці.
                    </li>
                </ul>
            
                ${isLastStep ? `<p style="color: #059669; font-weight: bold; margin-top: 12px; text-align: center; font-size: 0.95rem;">✓ Оскільки частка дорівнює 0, ділення цілої частини завершено!</p>` : ''}
            </div>
        </div>
    `;

    container.appendChild(wrapper);

    const scrollContainer = wrapper.querySelector('.division-scroll');
    const currentStepElement = wrapper.querySelector('.current-division-step');

    if (scrollContainer && currentStepElement) {
        requestAnimationFrame(() => {
            const scrollTarget = currentStepElement.offsetTop - (scrollContainer.clientHeight / 2) + (currentStepElement.clientHeight / 2);

            scrollContainer.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
        });
    }
}

function renderFractionMultiplication(step, container, targetBase) {
    const fraction = formatDecimal(step.input_state?.decimal_value);
    const digit = step.output_state?.digit ?? "—";
    const newFraction = formatDecimal(step.output_state?.new_decimal_fraction);

    const isLastFractionStep = step.output_state?.new_decimal_fraction !== undefined && Number(step.output_state.new_decimal_fraction) === 0;

    const wrapper = document.createElement("div");
    wrapper.className = "visualization-wrapper";
    wrapper.innerHTML = `
        <div class="fraction-visual" style="line-height: 1.5; width: 100%;">
            <div>Множимо дробову частину: <strong>${fraction}</strong></div>
            
            <div style="margin: 12px 0; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 1.05rem;">
                ${fraction} × <span style="color: #4f46e5; font-weight: bold;">${targetBase}</span> = 
                <span style="color: #ea580c; font-weight: bold; font-size: 1.15rem;">${digit}</span> + ${newFraction}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                <div style="border-left: 3px solid #ea580c; padding-left: 8px;">
                    <span style="font-size: 0.82rem; color: #64748b;">Результат кроку:</span><br>
                    Цифра <strong style="color:#ea580c; font-size: 1rem;">${digit}</strong>
                </div>
                <div style="border-left: 3px solid #4f46e5; padding-left: 8px;">
                    <span style="font-size: 0.82rem; color: #64748b;">На наступний крок:</span><br>
                    Дріб <strong>${newFraction}</strong>
                </div>
            </div>
            
            ${isLastFractionStep ?
            `<p style="color: #059669; font-weight: bold; margin-top: 12px; text-align: center; font-size: 0.95rem;">✓ Перетворення завершено<br>(дробова частина стала 0)!</p>` : ''}
        </div>
    `;
    container.appendChild(wrapper);
}

function formatDecimal(val) {
    if (val === undefined || val === null)
        return "—";
    const num = Number(val);
    if (Number.isNaN(num))
        return val;
    if (num === 0)
        return "0";
    return Math.abs(num) < 1e-6
        ? num.toExponential(3)
        : num.toPrecision(6);
}

export function highlightActiveStep(index) {
    document
        .querySelectorAll("tr[data-index]")
        .forEach(row =>
            row.classList.remove("active-step")
        );

    const activeRow =
        document.querySelector(
            `tr[data-index="${index}"]`
        );

    if (activeRow) {
        activeRow.classList.add("active-step");
        activeRow.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

export function showError(message) {
    const box = document.getElementById("error-box");
    if (!box)
        return;
    box.textContent = message;
    box.style.display = "block";
}

export function clearError() {
    const box = document.getElementById("error-box");

    if (!box) return;

    box.style.display = "none";
    box.textContent = "";
}

export function markInvalid(id) {
    const el = document.getElementById(id);
    if (el)
        el.classList.add("invalid");
}

export function clearInvalidMarks() {
    ["value", "sourceBase", "targetBase", "precision"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el)
                el.classList.remove("invalid");
        });
}

export function renderDecimalFormula(data, originalValue, sourceBase) {
    const block = document.getElementById("decimal-conversion-block");
    const formulaContainer = document.getElementById("decimal-conversion-formula");
    const resultContainer = document.getElementById("decimal-result-value");

    if (!block || !formulaContainer || !resultContainer) return;

    block.hidden = false;
    const cleanValue = originalValue.toUpperCase();
    const [intPart, fracPart] = cleanValue.split(".");

    let terms = [];
    let decimalValue = parseInt(intPart || "0", sourceBase);

    for (let i = 0; i < intPart.length; i++) {
        const digit = intPart[i];
        const power = intPart.length - 1 - i;
        terms.push(`${digit}·${sourceBase}<sup>${power}</sup>`);
    }

    if (fracPart) {
        let fracDecimal = 0;
        for (let i = 0; i < fracPart.length; i++) {
            const digit = fracPart[i];
            const digitValue = parseInt(digit, sourceBase);
            const power = -(i + 1);
            terms.push(`${digit}·${sourceBase}<sup>${power}</sup>`);
            fracDecimal += digitValue * Math.pow(sourceBase, power);
        }
        decimalValue += fracDecimal;
    }

    const finalResult = Number.isInteger(decimalValue)
        ? decimalValue
        : parseFloat(decimalValue.toFixed(8));

    const prefix = `(${originalValue})<sub>${sourceBase}</sub> = `;
    formulaContainer.innerHTML = prefix + terms.join(" + ");
    resultContainer.innerText = `${finalResult}`;
}

export function checkBaseLimits(inputElement) {
    const value = parseInt(inputElement.value, 10);
    const min = 2;
    const max = 36;

    let hintBlock = inputElement.parentNode.querySelector('.base-limit-hint');
    if (!hintBlock) {
        hintBlock = document.createElement('div');
        hintBlock.className = 'base-limit-hint';
        hintBlock.style.color = '#e67e22';
        hintBlock.style.fontSize = '0.8em';
        hintBlock.style.marginTop = '3px';
        hintBlock.style.display = 'none';
        inputElement.parentNode.appendChild(hintBlock);
    }

    if (isNaN(value)) {
        hintBlock.style.display = 'none';
        return;
    }

    if (value > max) {
        hintBlock.textContent = `Досягнуто максимальної межі. Дозволений діапазон основ: ${min}-${max}.`;
        hintBlock.style.display = 'block';
    } else if (value < min) {
        hintBlock.textContent = `Досягнуто мінімальної межі. Дозволений діапазон основ: ${min}-${max}.`;
        hintBlock.style.display = 'block';
    } else {
        hintBlock.style.display = 'none';
    }
}

export function forceValidBounds(inputElement) {
    let value = parseInt(inputElement.value, 10);
    const min = 2;
    const max = 36;

    if (isNaN(value) || value < min) {
        inputElement.value = min;
    } else if (value > max) {
        inputElement.value = max;
    }

    let hintBlock = inputElement.parentNode.querySelector('.base-limit-hint');
    if (hintBlock) {
        hintBlock.style.display = 'none';
    }

    inputElement.dispatchEvent(new Event('input'));
}


export function updateLiveResult(step, targetBase) {
    const resultElement = document.getElementById("live-result-value");
    if (!resultElement) return;

    const allSteps = window.currentConversionResult?.steps || window.steps || [];

    let integerDigits = [];
    let fractionDigits = [];

    for (const s of allSteps) {
        const type = String(s.step_type).toUpperCase();

        if (type === "INTEGER_DIVISION" || type === "INTEGER") {
            integerDigits.push(s.output_state?.remainder ?? "");
        }

        if (type === "FRACTION_MULTIPLICATION" || type === "FRACTION") {
            fractionDigits.push(s.output_state?.digit ?? "");
        }

        if (s.index === step.index && s.step_type === step.step_type) {
            break;
        }
    }

    const integerPart = integerDigits.reverse().join("");
    const fractionPart = fractionDigits.join("");

    let result = integerPart || "0";

    if (fractionDigits.length > 0) {
        result += "." + fractionPart;
    }

    resultElement.innerHTML = `(${result})<sub>${targetBase}</sub>`;
}
