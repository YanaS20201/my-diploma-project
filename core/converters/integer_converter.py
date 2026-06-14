from typing import List, Tuple
from core.models import StepModel, StepType


class IntegerBaseConverter:
    def convert(
        self,
        integer_value: int,
        target_base: int
    ) -> Tuple[List[int], List[StepModel]]:

        self._validate_inputs(integer_value, target_base)

        if integer_value == 0:
            return [0], []

        current_value = integer_value
        result_digits: List[int] = []
        steps: List[StepModel] = []

        step_index = 1

        while current_value > 0:
            quotient = current_value // target_base
            remainder = current_value % target_base

            if remainder < 0 or remainder >= target_base:
                raise RuntimeError("Remainder invariant violated")

            steps.append(
                StepModel(
                    index=step_index,
                    step_type=StepType.INTEGER_DIVISION,
                    input_state={
                        "value": current_value
                    },
                    output_state={
                        "quotient": quotient,
                        "remainder": remainder
                    }
                )
            )

            result_digits.append(remainder)
            current_value = quotient
            step_index += 1

        result_digits.reverse()

        return result_digits, steps

    def _validate_inputs(
        self,
        integer_value: int,
        target_base: int
    ) -> None:

        if not isinstance(integer_value, int):
            raise ValueError("integer_value must be int")

        if integer_value < 0:
            raise ValueError("Negative integers are not allowed")

        if not isinstance(target_base, int):
            raise ValueError("target_base must be int")

        if target_base < 2 or target_base > 36:
            raise ValueError("target_base must be in range 2..36")