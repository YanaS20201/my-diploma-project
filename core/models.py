from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class StepType(str, Enum):
    INTEGER_DIVISION = "INTEGER_DIVISION"
    FRACTION_MULTIPLICATION = "FRACTION_MULTIPLICATION"
    ROUNDING = "ROUNDING"
    BASE_POWER_EXPANSION = "BASE_POWER_EXPANSION"


class ParsedNumber(BaseModel):
    base: int
    integer_digits: List[int]
    fractional_digits: List[int]

    class Config:
        frozen = True


class ConvertRequest(BaseModel):
    value: str = Field(..., min_length=1)
    source_base: int = Field(..., ge=2, le=36)
    target_base: int = Field(..., ge=2, le=36)
    precision: int = Field(..., ge=0, le=100)



class StepModel(BaseModel):
    index: int
    step_type: str
    input_state: Dict[str, Any]
    output_state: Dict[str, Any]
    error: Optional[Dict[str, Any]] = None

    class Config:
        frozen = True

class ErrorFraction(BaseModel):
    numerator: str      
    denominator: str    
    float_value: float  

    class Config:
        frozen = True


class PrecisionInfo(BaseModel):
    absolute_error: ErrorFraction
    relative_error: ErrorFraction
    warnings: List[str] = Field(default_factory=list)

    class Config:
        frozen = True


class ResultModel(BaseModel):
    formatted: str
    integer_digits: List[int]
    fractional_digits: List[int]
    base: int
    is_exact: bool

    class Config:
        frozen = True


class ConvertResponse(BaseModel):
    result: ResultModel
    precision: PrecisionInfo
    steps: List[StepModel]

    class Config:
        frozen = True