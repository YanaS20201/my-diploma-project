from typing import List, Dict, Any
from fractions import Fraction

from core.models import StepModel  # Synchronized with openapi.json and pipeline
from core.converters.integer_converter import IntegerBaseConverter
from core.converters.fractional_converter import FractionalConverter
from core.analysis.precision_analyzer import PrecisionAnalyzer
from core.analysis.rational_converter import RationalConverter
from core.formatters.number_formatter import NumberFormatter
from core.parser import NumberParser


class NumberSystemValidationError(ValueError):
    pass


class BaseNumberConverter:


    def __init__(self):
        self.parser = NumberParser()
        self.rational_converter = RationalConverter()
        self.integer_converter = IntegerBaseConverter()
        self.fractional_converter = FractionalConverter()
        self.precision_analyzer = PrecisionAnalyzer()


    def convert(
        self,
        value: str,
        source_base: int,
        target_base: int,
        precision: int
    ) -> Dict[str, Any]:

        self._validate_bases(source_base, target_base)
        clean_value = self._validate_value(value, source_base)

        parsed = self.parser.parse(clean_value, source_base)

        exact_fraction = self.rational_converter.convert(
            integer_digits=parsed.integer_digits,
            fractional_digits=parsed.fractional_digits,
            base=parsed.base
        )

        integer_part = exact_fraction.numerator // exact_fraction.denominator
        fractional_part = exact_fraction - integer_part

        integer_digits, integer_steps = (
            self.integer_converter.convert(
                integer_part,
                target_base
            )
        )

        (
            fractional_digits,
            fractional_steps,
            is_exact_fraction,
            carry_to_integer
        ) = self.fractional_converter.convert(
            fractional_part=Fraction(fractional_part),
            target_base=target_base,
            precision=precision
        )

        if carry_to_integer:
            integer_digits = self._add_one(
                integer_digits,
                target_base
            )

        steps: List[StepModel] = (
            integer_steps + fractional_steps
        )

        formatted = NumberFormatter.format_unsigned(
            integer_digits=integer_digits,
            fractional_digits=fractional_digits,
            base=target_base
        )

        is_exact = (
            is_exact_fraction
            and carry_to_integer == 0
        )

        precision_info = self.precision_analyzer.analyze(
            exact_fraction=exact_fraction,
            integer_digits=integer_digits,
            fractional_digits=fractional_digits,
            target_base=target_base
        )

        return {
            "result": {
                "formatted": formatted,
                "integer_digits": integer_digits,
                "fractional_digits": fractional_digits,
                "base": target_base,
                "is_exact": is_exact
            },
            "precision": precision_info,
            "steps": steps
        }

    def _validate_bases(
        self,
        source_base: int,
        target_base: int
    ) -> None:

        if not (2 <= source_base <= 36):
            raise ValueError("source_base must be between 2 and 36")

        if not (2 <= target_base <= 36):
            raise ValueError("target_base must be between 2 and 36")

    def _validate_value(self, value: str, base: int) -> str:
        
        val = value.strip().upper()
        
        if not val:
            raise NumberSystemValidationError("Поле значення не може бути порожнім.")

        if val.startswith('-'):
            raise NumberSystemValidationError("Введення від'ємних чисел заборонено.")
            
        if val.count('.') > 1:
            raise NumberSystemValidationError("Число може містити лише одну роздільну крапку.")

        if val.startswith('.') or val.endswith('.'):
            raise NumberSystemValidationError("Число не може починатися або закінчуватися крапкою.")

        if val == '.':
            raise NumberSystemValidationError("Введено некоректне значення.")

        allowed_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[:base]
        
        for char in val:
            if char != '.' and char not in allowed_chars:
                raise NumberSystemValidationError(
                    f"Символ '{char}' є недопустимим для системи числення з основою {base}."
                )
                
        return val

    def _add_one(
        self,
        digits: List[int],
        base: int
    ) -> List[int]:

        result = digits.copy()
        i = len(result) - 1

        while i >= 0:
            result[i] += 1
            if result[i] < base:
                return result
            result[i] = 0
            i -= 1

        return [1] + result