import os
from typing import List, Dict, Any, Optional
from fractions import Fraction

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from core.base_converter import BaseNumberConverter, NumberSystemValidationError
from core.models import ConvertRequest, ConvertResponse, ResultModel, PrecisionInfo, ErrorFraction, StepModel

app = FastAPI(
    title="Positional Number System Converter",
    version="1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_frontend():
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return JSONResponse(
        status_code=404, 
        content={"error": "Файл index.html не знайдено в кореневій папці"}
    )

converter = BaseNumberConverter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ensure_json_safe(obj: Any) -> Any:
    if isinstance(obj, Fraction):
        return float(obj)
    if isinstance(obj, dict):
        return {k: ensure_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [ensure_json_safe(i) for i in obj]
    return obj

def normalize_error_to_model(err_data: Dict[str, Any]) -> ErrorFraction:
    return ErrorFraction(
        numerator=str(err_data.get("numerator", "0")),
        denominator=str(err_data.get("denominator", "1")),
        float_value=float(err_data.get("float_value", 0.0))
    )

@app.options("/convert")
async def convert_options(request: Request):
    origin = request.headers.get("origin", "*")
    headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
        "Access-Control-Allow-Credentials": "false"
    }
    return Response(status_code=200, headers=headers)


@app.exception_handler(NumberSystemValidationError)
async def validation_exception_handler(request: Request, exc: NumberSystemValidationError):
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=400,
        content={"detail": [{"msg": str(exc)}]} 
    )
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "false"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"!!! SERVER ERROR: {str(exc)}")
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=500,
        content={"error": f"Внутрішня помилка сервера: {str(exc)}"}
    )
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "false"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.post("/convert", response_model=ConvertResponse)
async def convert_number(request: ConvertRequest):
    result_data = converter.convert(
        value=request.value,
        source_base=request.source_base,
        target_base=request.target_base,
        precision=request.precision
    )

    r = result_data["result"]
    normalized_result = ResultModel(
        formatted=r["formatted"],
        integer_digits=r["integer_digits"],
        fractional_digits=r["fractional_digits"],
        base=r["base"],
        is_exact=r["is_exact"]
    )

    p = result_data["precision"]
    normalized_precision = PrecisionInfo(
        absolute_error=normalize_error_to_model(p["absolute_error"]),
        relative_error=normalize_error_to_model(p["relative_error"]),
        warnings=p.get("warnings", [])
    )

    serialized_steps = []
    for step in result_data["steps"]:
        step_type_str = step.step_type.value if hasattr(step.step_type, "value") else str(step.step_type)
        
        serialized_steps.append(
            StepModel(
                index=step.index,
                step_type=step_type_str,
                input_state=ensure_json_safe(step.input_state),
                output_state=ensure_json_safe(step.output_state),
                error=ensure_json_safe(step.error) if step.error else None
            )
        )

    return ConvertResponse(
        result=normalized_result,
        precision=normalized_precision,
        steps=serialized_steps
    )