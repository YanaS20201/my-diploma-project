export function charToValue(ch) {

    if (ch >= "0" && ch <= "9")

        return ch.charCodeAt(0) - 48;

    if (ch >= "A" && ch <= "Z")

        return ch.charCodeAt(0) - 55;

    if (ch >= "a" && ch <= "z")

        return ch.charCodeAt(0) - 87;

    return NaN;

}


export function getAllowedChars(base) {

    if (!Number.isInteger(base) || base < 2 || base > 36)

        return "";

    return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, base);

}


export function validateInput(value, base) {
    if (!value || value.trim() === "")
        return "Число не може бути порожнім";
    if (!Number.isInteger(base) || base < 2 || base > 36)
        return "Некоректна основа системи числення";

    if (value.includes("-"))
        return "Від’ємні числа заборонені";

    const parts = value.split(".");
    if (parts.length > 2)
        return "Допускається лише один десятковий роздільник";
    if (parts.some(p => p.length === 0))
        return "Неповне число (порожня ціла або дробова частина)";

    const allowed = getAllowedChars(base);
    for (const ch of value.toUpperCase()) {
        if (ch === ".") continue;
        if (!allowed.includes(ch)) {
            return `Символ «${ch}» не дозволений у системі з основою ${base}`;
        }
    }
    return null;
}


export function isValidForBase(value, base) {
    if (!Number.isInteger(base) || base < 2 || base > 36)
        return false;
    let dotCount = 0;
    for (const ch of value) {
        if (ch === ".") {
            dotCount++;
            if (dotCount > 1) return false;
            continue;
        }
        const v = charToValue(ch);
        if (Number.isNaN(v) || v >= base)
            return false;
    }
    return true;
}


export function getStepExplanation(step, targetBase) {
    if (!step || !step.step_type) return "";

    if (step.step_type === "INTEGER_DIVISION") {
        const input = step.input_state?.value ?? "—";
        const quotient = step.output_state?.quotient ?? "—";
        const remainder = step.output_state?.remainder ?? "—";
        return `Ділимо ${input} на ${targetBase}. Отримуємо частку ${quotient} і остачу ${remainder}. Остача записується в результат.`;
    }

    if (step.step_type === "FRACTION_MULTIPLICATION") {
        const fraction = step.input_state?.decimal_value ?? "—";
        const digit = step.output_state?.digit ?? "—";
        const newFraction = step.output_state?.new_decimal_fraction ?? "—";
        return `Множимо ${fraction} на ${targetBase}. Отримуємо ${digit} + ${newFraction}. Ціла частина ${digit} стає наступною цифрою результату.`;
    }

    if (step.step_type === "ROUNDING") {
        const before = step.input_state?.digits_before_rounding ?? [];
        const after = step.output_state?.digits_after_rounding ?? [];
        const carry = step.output_state?.carry_to_integer ?? 0;
        return `Виконуємо округлення: ${before.join("")} → ${after.join("")}. Перенос у цілу частину: ${carry}.`;
    }

    if (step.step_type === "BASE_POWER_EXPANSION") {
        const digit = step.input_state?.digit ?? "—";
        const power = step.input_state?.power ?? "—";
        const partialSum = step.output_state?.partial_sum ?? "—";
        return `Множимо цифру ${digit} на основу в степені ${power}. Поточна сума: ${partialSum}.`;
    }

    return "";
}


export function computeAbsoluteError(exact, approx) {

    return Math.abs(exact - approx);

}



export function computeRelativeError(exact, approx) {

    if (exact === 0)

        return 0;

    return Math.abs(exact - approx) / Math.abs(exact);

}


export function reconstructFractionValue(

    steps,

    k,

    base

) {

    let value = 0;

    let factor = 1 / base;

    let count = 0;

    for (const step of steps) {

        if (step.step_type !== "FRACTION_MULTIPLICATION")

            continue;

        const digit = step.output_state && typeof step.output_state.digit !== "undefined"

            ? step.output_state.digit

            : undefined;

        if (digit === undefined)

            continue;

        value += digit * factor;

        factor /= base;

        count++;

        if (count >= k)

            break;

    }

    return value;

}

export function buildErrorSeries(

    exactValue,

    steps,

    targetBase

) {

    const result = [];

    let fractionValue = 0;

    let factor = 1 / targetBase;

    let stepIndex = 0;

    for (const step of steps) {

        if (step.step_type !== "FRACTION_MULTIPLICATION")

            continue;

        const digit = step.output_state && typeof step.output_state.digit !== "undefined"

            ? step.output_state.digit

            : undefined;

        if (digit === undefined)

            continue;

        fractionValue += digit * factor;

        factor /= targetBase;

        stepIndex++;

        const absoluteError =

            computeAbsoluteError(exactValue, fractionValue);

        const relativeError =

            computeRelativeError(exactValue, fractionValue);

        result.push({

            step: stepIndex,

            approx: fractionValue,

            absoluteError,

            relativeError

        });

    }

    return result;

}


export function adaptBackendResponse(response) {
    const r = response.result || {};
    const p = response.precision || {};
    const absErr = p.absolute_error || {};
    const relErr = p.relative_error || {};
    const steps = Array.isArray(response.steps) ? response.steps : [];

    return {
        formatted: r.formatted || "",
        integer_digits: Array.isArray(r.integer_digits) ? r.integer_digits : [],
        fractional_digits: Array.isArray(r.fractional_digits) ? r.fractional_digits : [],
        base: !isNaN(parseInt(r.base, 10)) ? parseInt(r.base, 10) : null,
        is_exact: !!r.is_exact,
        precision: {
            absolute_error: {
                numerator: absErr.numerator || "0",
                denominator: absErr.denominator || "1",
                float_value: typeof absErr.float_value === "number" ? absErr.float_value : 0
            },
            relative_error: {
                numerator: relErr.numerator || "0",
                denominator: relErr.denominator || "1",
                float_value: typeof relErr.float_value === "number" ? relErr.float_value : 0
            },
            warnings: Array.isArray(p.warnings) ? p.warnings : []
        },
        steps
    };
}

