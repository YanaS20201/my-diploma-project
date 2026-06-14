from typing import List


class NumberFormatter:
    _DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    _MIN_BASE = 2
    _MAX_BASE = 36
    @classmethod
    def _validate_base(cls, base: int) -> None:
        if not isinstance(base, int):
            raise ValueError("Base must be an integer")

        if base < cls._MIN_BASE or base > cls._MAX_BASE:
            raise ValueError(
                f"Base must be in range {cls._MIN_BASE}..{cls._MAX_BASE}"
            )

    @classmethod
    def _validate_digits(
        cls,
        digits: List[int],
        base: int
    ) -> None:

        if not isinstance(digits, list):
            raise ValueError("Digits must be a List[int]")

        for digit in digits:
            if not isinstance(digit, int):
                raise ValueError("Digits must be integers")

            if digit < 0 or digit >= base:
                raise ValueError(
                    f"Digit {digit} is invalid for base {base}"
                )

    @classmethod
    def digit_to_char(cls, digit: int) -> str:
        if not isinstance(digit, int):
            raise ValueError("Digit must be an integer")

        if digit < 0 or digit >= len(cls._DIGITS):
            raise ValueError(f"Invalid digit value: {digit}")

        return cls._DIGITS[digit]

    @classmethod
    def format_unsigned(
        cls,
        *,
        integer_digits: List[int],
        fractional_digits: List[int],
        base: int
    ) -> str:

        cls._validate_base(base)
        cls._validate_digits(integer_digits, base)
        cls._validate_digits(fractional_digits, base)

        if not integer_digits:
            raise ValueError("integer_digits cannot be empty")

        first_nonzero = 0
        while first_nonzero < len(integer_digits) - 1 and integer_digits[first_nonzero] == 0:
            first_nonzero += 1

        normalized_integer = integer_digits[first_nonzero:]

        integer_part = "".join(
            cls.digit_to_char(d) for d in normalized_integer
        )

        if fractional_digits:
            fractional_part = "".join(
                cls.digit_to_char(d) for d in fractional_digits
            )
            return f"{integer_part}.{fractional_part}"

        return integer_part