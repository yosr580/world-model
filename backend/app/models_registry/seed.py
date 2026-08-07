#!/usr/bin/env python
"""
Seed script to populate the Model table from JSON manifests in models_registry/.

Usage: python -m app.models_registry.seed
"""

import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Model


def load_manifests(registry_dir: Path) -> list[dict[str, Any]]:
    """Load all JSON manifest files from the registry directory."""
    manifests = []
    for json_file in registry_dir.glob("*.json"):
        try:
            with json_file.open("r", encoding="utf-8") as f:
                manifest = json.load(f)
                manifests.append(manifest)
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse {json_file.name}: {e}", file=sys.stderr)
        except Exception as e:
            print(f"ERROR: Failed to read {json_file.name}: {e}", file=sys.stderr)
    return manifests


def upsert_model(db: Session, manifest: dict[str, Any]) -> tuple[str, str | None]:
    """
    Upsert a model from manifest.
    Returns: (action, error_message) where action is "inserted", "updated", or "error"
    """
    model_id = manifest.get("id")
    if not model_id:
        return "error", "Manifest missing required 'id' field"

    # Check if model already exists by name (used as unique identifier)
    existing = db.query(Model).filter(Model.name == model_id).first()

    # Prepare model data
    checkpoint = manifest.get("checkpoint")
    # If checkpoint is null/None in JSON, store SQL NULL (None in Python)
    checkpoint_id = checkpoint if checkpoint is not None else None

    model_data = {
        "name": model_id,
        "family": manifest.get("family"),
        "checkpoint_id": checkpoint_id,
        "license": manifest.get("license"),
        "modality": manifest.get("modality"),
        "manifest": manifest,  # Full JSON dict stored as JSONB
        "params_millions": None,
        "verified_reproducible": False,
        "source_paper_id": None,
    }

    try:
        if existing:
            # Update existing model
            for key, value in model_data.items():
                setattr(existing, key, value)
            db.commit()
            return "updated", None
        else:
            # Insert new model
            new_model = Model(**model_data)
            db.add(new_model)
            db.commit()
            return "inserted", None
    except Exception as e:
        db.rollback()
        return "error", str(e)


def main() -> int:
    """Main entry point for the seed script."""
    registry_dir = Path(__file__).parent
    manifests = load_manifests(registry_dir)

    if not manifests:
        print("No manifest files found in models_registry/")
        return 1

    print(f"Found {len(manifests)} manifest(s) to process")
    print("-" * 60)

    db = SessionLocal()
    inserted = 0
    updated = 0
    errors = 0
    error_details = []

    try:
        for manifest in manifests:
            model_id = manifest.get("id", "UNKNOWN")
            action, error = upsert_model(db, manifest)

            if action == "inserted":
                inserted += 1
                print(f"  INSERTED: {model_id}")
            elif action == "updated":
                updated += 1
                print(f"  UPDATED:  {model_id}")
            else:
                errors += 1
                error_details.append(f"{model_id}: {error}")
                print(f"  ERROR:    {model_id} - {error}")

    finally:
        db.close()

    print("-" * 60)
    print(f"Summary:")
    print(f"  Inserted: {inserted}")
    print(f"  Updated:  {updated}")
    print(f"  Errors:   {errors}")

    if error_details:
        print("\nError details:")
        for detail in error_details:
            print(f"  - {detail}")

    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())