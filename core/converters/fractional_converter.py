from fractions import Fraction
from decimal import Decimal, getcontext
from typing import List, Tuple
from core.models import StepModel, StepType


class FractionalConverter:
    
    def convert(
        self,
        *,
        fractional_part: Fraction,
        target_base: int,
        precision: int
    ) -> Tuple[List[int], List[StepModel], bool, int]:

        self._validate_inputs(
            fractional_part,
            target_base,
            precision
        )

        if fractional_part == 0:
            return [], [], True, 0

        digits: List[int] = []
        steps: List[StepModel] = []

        current = fractional_part
        step_index = 1
        getcontext().prec = precision + 10

        for _ in range(precision + 1):
            multiplied = current * target_base
            digit = multiplied.numerator // multiplied.denominator
            new_fraction = multiplied - digit

            steps.append(
                StepModel(
                    index=step_index,
                    step_type=StepType.FRACTION_MULTIPLICATION,
                    input_state={
                        "decimal_value": str(Decimal(current.numerator) / Decimal(current.denominator))
                    },
                    output_state={
                        "multiplied_value": str(Decimal(multiplied.numerator) / Decimal(multiplied.denominator)),
                        "digit": digit,
                        "new_decimal_fraction": str(Decimal(new_fraction.numerator) / Decimal(new_fraction.denominator)) if new_fraction != 0 else "0"
                    }
                )
            )

            digits.append(digit)
            current = new_fraction
            step_index += 1

            if current == 0:
                break

        if current == 0 and len(digits) <= precision:
            return digits, steps, True, 0

        if len(digits) > precision:
            rounding_digit = digits.pop()
            steps.pop()
        else:
            return digits, steps, True, 0

        threshold = Fraction(target_base, 2)
        carry = 0
        
        if Fraction(rounding_digit, 1) >= threshold:
            old_digits = digits.copy()
            carry = self._propagate_carry(digits, target_base)

            steps.append(
                StepModel(
                    index=step_index,
                    step_type=StepType.ROUNDING,
                    input_state={
                        "digits_before_rounding": old_digits,
                        "rounding_digit": rounding_digit
                    },
                    output_state={
                        "digits_after_rounding": digits.copy(),
                        "carry_to_integer": carry
                    }
                )
            )

        return digits, steps, False, carry

    def _propagate_carry(
        self,
        digits: List[int],
        base: int
    ) -> int:
        carry = 1
        for i in reversed(range(len(digits))):
            new_value = digits[i] + carry
            if new_value == base:
                digits[i] = 0
                carry = 1
            else:
                digits[i] = new_value
                carry = 0
                break
        return carry

    def _validate_inputs(
        self,
        fractional_part: Fraction,
        target_base: int,
        precision: int
    ) -> None:

        if not isinstance(fractional_part, Fraction):
            raise ValueError("fractional_part must be Fraction")

        if fractional_part < 0 or fractional_part >= 1:
            raise ValueError("fractional_part must satisfy 0 <= f < 1")

        if not isinstance(target_base, int):
            raise ValueError("target_base must be int")

        if target_base < 2 or target_base > 36:
            raise ValueError("target_base must be in range 2..36")

        if not isinstance(precision, int) or precision < 0:
            raise ValueError("precision must be non-negative integer")