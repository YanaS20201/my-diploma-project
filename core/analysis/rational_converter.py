from fractions import Fraction
from typing import List


class RationalConverter:
    
    def convert(
        self,
        *,
        integer_digits: List[int],
        fractional_digits: List[int],
        base: int
    ) -> Fraction:

        self._validate_inputs(
            integer_digits,
            fractional_digits,
            base
        )

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
        integer_digits: List[int],
        fractional_digits: List[int],
        base: int
    ) -> None:
        if not isinstance(base, int):
            raise ValueError("Base must be an integer")
        if base < 2 or base > 36:
            raise ValueError("Base must be in range 2..36")
        if not isinstance(integer_digits, list):
            raise ValueError("integer_digits must be a list")
        if not isinstance(fractional_digits, list):
            raise ValueError("fractional_digits must be a list")
        if len(integer_digits) == 0:
            raise ValueError("integer_digits cannot be empty")
        for digit in integer_digits:
            if not isinstance(digit, int):
                raise ValueError("All digits must be integers")
            if digit < 0 or digit >= base:
                raise ValueError(
                    f"Invalid digit {digit} for base {base}"
                )
        for digit in fractional_digits:
            if not isinstance(digit, int):
                raise ValueError("All digits must be integers")
            if digit < 0 or digit >= base:
                raise ValueError(
                    f"Invalid digit {digit} for base {base}"
                )