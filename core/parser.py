from core.models import ParsedNumber

class NumberParser:

    def parse(self, value: str, base: int) -> ParsedNumber:
        self._validate_base(base)
        self._validate_value(value)

        normalized = value.strip()
        unsigned = normalized.lstrip('+')

        integer_part, fractional_part = self._split_value(unsigned)

        integer_digits = self._parse_digits(integer_part, base)
        if not integer_digits:
            integer_digits = [0]

        fractional_digits = (
            self._parse_digits(fractional_part, base)
            if fractional_part is not None else []
        )

        return ParsedNumber(
            base=base,
            integer_digits=integer_digits,
            fractional_digits=fractional_digits
        )

    def _validate_base(self, base: int) -> None:
        if not isinstance(base, int):
            raise ValueError("Base must be an integer")
        if base < 2 or base > 36:
            raise ValueError("Base must be in range 2..36")

    def _validate_value(self, value: str) -> None:
        if not isinstance(value, str):
            raise ValueError("Value must be a string")

        stripped = value.strip()
        if stripped == "":
            raise ValueError("Value cannot be empty")

        if stripped.count('.') > 1:
            raise ValueError("Invalid number format: more than one dot")

        if '-' in stripped:
            raise ValueError("Negative numbers are not supported")

        if stripped.count('+') > 1:
            raise ValueError("Invalid sign placement")

        if '+' in stripped[1:]:
            raise ValueError("Sign allowed only at start")

    def _split_value(self, value: str) -> tuple[str, str | None]:
        if value.startswith('.') or value.endswith('.'):
            raise ValueError("Invalid number format: dot at start or end")

        if '.' in value:
            parts = value.split('.')
            if len(parts) != 2:
                raise ValueError("Invalid number format: more than one dot")
            integer_part, fractional_part = parts
            if integer_part == "" or fractional_part == "":
                raise ValueError("Invalid number format: missing integer or fractional part")
            return integer_part, fractional_part

        return value, None

    def _char_to_digit(self, ch: str) -> int:
        if '0' <= ch <= '9':
            return ord(ch) - ord('0')
        if 'A' <= ch <= 'Z':
            return ord(ch) - ord('A') + 10
        if 'a' <= ch <= 'z':
            return ord(ch) - ord('a') + 10

        raise ValueError(f"Invalid digit character: '{ch}'")

    def _parse_digits(self, part: str, base: int) -> list[int]:
        digits: list[int] = []
        for ch in part:
            digit = self._char_to_digit(ch)

            if digit >= base:
                raise ValueError(
                    f"Digit '{ch}' is not valid for base {base}"
                )
            
            digits.append(digit)
        return digits