from fractions import Fraction
from typing import List, Dict, Any


class PrecisionAnalyzer:
    RELATIVE_ERROR_WARNING_THRESHOLD = Fraction(1, 10)
    def analyze(
        self,
        *,
        exact_fraction: Fraction,
        integer_digits: List[int],
        fractional_digits: List[int],
        target_base: int
    ) -> Dict[str, Any]:

        self._validate_inputs(
            exact_fraction,
            integer_digits,
            fractional_digits,
            target_base
        )

        approx_fraction = self._reconstruct_fraction(
            integer_digits,
            fractional_digits,
            target_base
        )

        absolute_error = abs(exact_fraction - approx_fraction)

        if exact_fraction == 0:
            relative_error = Fraction(0, 1)
        else:
            relative_error = absolute_error / abs(exact_fraction)

        warnings: List[str] = []

        if relative_error > self.RELATIVE_ERROR_WARNING_THRESHOLD:
            warnings.append(
                "Relative error exceeds threshold (10%)"
            )

        return {
            "absolute_error": {
                "numerator": str(absolute_error.numerator),
                "denominator": str(absolute_error.denominator),
                "float_value": float(absolute_error)
            },
            "relative_error": {
                "numerator": str(relative_error.numerator),
                "denominator": str(relative_error.denominator),
                "float_value": float(relative_error)
            },
            "warnings": warnings
        }

    def _reconstruct_fraction(
        self,
        integer_digits: List[int],
        fractional_digits: List[int],
        base: int
    ) -> Fraction:
        integer_value = 0
        for digit in integer_digits:
            integer_value = integer_value * base + digit
        fractional_value = Fraction(0, 1)
        power = base
        for digit in fractional_digits:
            fractional_value += Fraction(digit, power)
            power *= base
        return Fraction(integer_value, 1) + fractional_value

    def _validate_inputs(
        self,
        exact_fraction: Fraction,
        integer_digits: List[int],
        fractional_digits: List[int],
        target_base: int
    ) -> None:

        if not isinstance(exact_fraction, Fraction):
            raise ValueError("exact_fraction must be Fraction")

        if not isinstance(target_base, int):
            raise ValueError("target_base must be int")

        if target_base < 2 or target_base > 36:
            raise ValueError("target_base must be in range 2..36")

        if not isinstance(integer_digits, list):
            raise ValueError("integer_digits must be list")

        if not isinstance(fractional_digits, list):
            raise ValueError("fractional_digits must be list")

        for digit in integer_digits:
            if not isinstance(digit, int):
                raise ValueError("All integer_digits must be int")
            if digit < 0 or digit >= target_base:
                raise ValueError(f"Invalid digit {digit} in integer_digits for base {target_base}")

        for digit in fractional_digits:
            if not isinstance(digit, int):
                raise ValueError("All fractional_digits must be int")
            if digit < 0 or digit >= target_base:
                raise ValueError(f"Invalid digit {digit} in fractional_digits for base {target_base}")