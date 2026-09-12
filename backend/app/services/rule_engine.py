"""Versioned Legal Metrology rule validation and compliance decisions."""

from __future__ import annotations

import logging
import re
from numbers import Real
from typing import Any

from app.supabase_client import supabase

logger = logging.getLogger(__name__)

_MRP_PATTERN = re.compile(r"^\s*₹\s*\d+(?:\.\d{1,2})?\s*$")
_MONTH_YEAR_PATTERN = re.compile(r"^(0[1-9]|1[0-2])/\d{4}$")


def get_applicable_rules(category: str) -> list[dict]:
    """Fetch active rules for a category and the global ``All`` category."""
    # Every rules-table edit is captured in rule_versions, so past inspections
    # can be traced to the exact rule version used instead of a static config.
    if supabase is None:
        logger.error("Cannot load compliance rules because Supabase is not configured")
        return []

    response = (
        supabase.table("rules")
        .select("*")
        .eq("is_active", True)
        .or_(f"applicable_category.eq.{category},applicable_category.eq.All")
        .execute()
    )
    return response.data or []


def _declaration_for_type(declarations: list[dict], declaration_type: str) -> dict | None:
    expected = declaration_type.casefold()
    for declaration in declarations:
        actual = str(declaration.get("declaration_type", "")).casefold()
        if actual == expected:
            return declaration
    return None


def _normalized_value(declaration: dict) -> str:
    return str(
        declaration.get("normalized_value")
        or declaration.get("extracted_value")
        or ""
    ).strip()


def _numeric_value(value: str) -> float | None:
    match = re.search(r"-?\d+(?:\.\d+)?", value.replace(",", ""))
    return float(match.group()) if match else None


def _format_matches(value: str, rule: dict) -> bool:
    threshold = rule.get("threshold_value") or {}
    if not isinstance(threshold, dict):
        return True

    expected_pattern = threshold.get("expected_pattern") or threshold.get("pattern")
    if expected_pattern:
        try:
            return re.fullmatch(str(expected_pattern), value) is not None
        except re.error:
            logger.warning("Ignoring invalid format pattern for rule %s", rule.get("id"))
            return False

    declaration_type = str(rule.get("declaration_type", "")).casefold()
    if declaration_type == "mrp":
        return _MRP_PATTERN.fullmatch(value) is not None
    if declaration_type in {"month & year of manufacture/packing", "mfg date"}:
        return _MONTH_YEAR_PATTERN.fullmatch(value) is not None
    return True


def _range_matches(value: str, rule: dict) -> bool:
    threshold = rule.get("threshold_value") or {}
    if not isinstance(threshold, dict):
        return True
    numeric = _numeric_value(value)
    if numeric is None:
        return False

    minimum = threshold.get("min_value", threshold.get("minimum"))
    maximum = threshold.get("max_value", threshold.get("maximum"))
    if minimum is not None and numeric < float(minimum):
        return False
    if maximum is not None and numeric > float(maximum):
        return False
    return True


def _violation(rule: dict, description: str, declaration: dict | None = None) -> dict:
    confidence = 1.0
    if declaration is not None:
        raw_confidence = declaration.get("confidence", declaration.get("confidence_score"))
        if isinstance(raw_confidence, Real):
            confidence = float(raw_confidence)
            if confidence > 1:
                confidence /= 100
    return {
        "rule_id": rule.get("id"),
        "declaration_type": rule.get("declaration_type", ""),
        "severity": rule.get("severity", "Medium"),
        "description": description,
        "confidence_score": max(0.0, min(1.0, confidence)),
    }


def validate_declarations(declarations: list[dict], rules: list[dict]) -> list[dict]:
    """Apply each applicable rule to normalized declaration records."""
    violations = []
    for rule in rules:
        declaration_type = str(rule.get("declaration_type", ""))
        declaration = _declaration_for_type(declarations, declaration_type)
        validation_type = str(rule.get("validation_type", "")).casefold()

        if validation_type == "presence check":
            if declaration is None or not _normalized_value(declaration):
                violations.append(
                    _violation(
                        rule,
                        f"Required declaration is missing: {declaration_type}.",
                        declaration,
                    )
                )
        elif declaration is not None:
            value = _normalized_value(declaration)
            if validation_type == "format check" and not _format_matches(value, rule):
                violations.append(
                    _violation(rule, f"Declaration has an invalid format: {value}.", declaration)
                )
            elif validation_type == "value range":
                try:
                    matches = _range_matches(value, rule)
                except (TypeError, ValueError):
                    logger.warning("Invalid numeric range for rule %s", rule.get("id"))
                    matches = False
                if not matches:
                    violations.append(
                        _violation(rule, f"Declaration is outside the allowed range: {value}.", declaration)
                    )
            elif validation_type == "font size threshold":
                # TODO: derive font size from bounding-box height and image DPI.
                # Keep this branch ready for a real font-size detector.
                logger.info("Font-size validation is not implemented for rule %s", rule.get("id"))

    return violations


def calculate_compliance_decision(violations: list[dict]) -> dict:
    """Calculate the score and status from weighted violation penalties."""
    penalties = {"high": 20, "medium": 10, "low": 5}
    score = 100
    for violation in violations:
        score -= penalties.get(str(violation.get("severity", "Medium")).casefold(), 10)
    score = max(0, score)
    has_high_violation = any(
        str(violation.get("severity", "")).casefold() == "high"
        for violation in violations
    )
    if score < 60 or has_high_violation:
        status = "Non-Compliant"
    elif score >= 90:
        status = "Compliant"
    else:
        status = "Minor Violations"
    return {"compliance_score": score, "compliance_status": status}


def run_compliance_check(declarations: list[dict], category: str) -> dict:
    """Run applicability, validation, and the final compliance decision."""
    rules = get_applicable_rules(category)
    violations = validate_declarations(declarations, rules)
    return {"violations": violations, **calculate_compliance_decision(violations)}
