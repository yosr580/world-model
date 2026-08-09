from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Model, TestResult
from app.inference.loaders import load_model
from app.inference.tests import t1_structure_gap, t8_output_type
import uuid

router = APIRouter()

TEST_RUNNERS = {
    "T1": t1_structure_gap.run,
    "T8": t8_output_type.run,
}

@router.post("/run")
def run_test(model_id: str, test_id: str, db: Session = Depends(get_db)):
    model_row = db.query(Model).filter(Model.name == model_id).first()
    if not model_row:
        raise HTTPException(status_code=404, detail=f"Modele non trouve: {model_id}")

    manifest = model_row.manifest
    compatible_tests = manifest.get("compatible_tests", [])
    if test_id not in compatible_tests:
        raise HTTPException(status_code=400, detail=f"Test {test_id} non compatible avec {model_id}")

    if test_id not in TEST_RUNNERS:
        raise HTTPException(status_code=501, detail=f"Test {test_id} non implemente cote inference service")

    runner = TEST_RUNNERS[test_id]

    if test_id == "T8":
        result = runner(None, model_id, manifest)
    else:
        try:
            model = load_model(manifest)
        except ValueError as e:
            raise HTTPException(status_code=501, detail=f"Loader non supporte: {str(e)}")
        result = runner(model, model_id)

    test_result = TestResult(
        id=uuid.uuid4(),
        model_id=model_row.id,
        test_id=test_id,
        input_hash="demo",
        params={},
        metrics=result,
        artifact_urls=[],
        execution_mode="live",
    )
    db.add(test_result)
    db.commit()

    return result