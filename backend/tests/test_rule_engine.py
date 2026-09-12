"""Reusable smoke test for the compliance rule engine."""

from __future__ import annotations

import sys
from pathlib import Path

# Allow this file to be run directly from the repository root.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services import rule_engine


class FakeResponse:
    data = [
        {
            "id": "rule-mrp-format",
            "declaration_type": "MRP",
            "validation_type": "Format Check",
            "threshold_value": {},
            "severity": "High",
            "is_active": True,
        },
        {
            "id": "rule-net-quantity-presence",
            "declaration_type": "Net Quantity",
            "validation_type": "Presence Check",
            "threshold_value": {},
            "severity": "Medium",
            "is_active": True,
        },
    ]


class FakeRulesQuery:
    def select(self, _fields):
        return self

    def eq(self, _field, _value):
        return self

    def or_(self, _category_filter):
        return self

    def execute(self):
        return FakeResponse()


class FakeSupabase:
    def table(self, table_name):
        assert table_name == "rules"
        return FakeRulesQuery()


def main() -> None:
    category = "Food & Beverages"
    declarations = [
        {
            "declaration_type": "MRP",
            "extracted_value": "Rs 149",
            "normalized_value": "Rs 149",
            "confidence": 0.9,
        }
        # Net Quantity is intentionally missing to test the presence rule.
    ]

    rule_engine.supabase = FakeSupabase()
    rules = rule_engine.get_applicable_rules(category)
    result = rule_engine.run_compliance_check(declarations, category)

    print(f"Violations: {len(result['violations'])}")
    print(f"Compliance score: {result['compliance_score']}")
    print(f"Status: {result['compliance_status']}")
    print("Violation descriptions:")
    for violation in result["violations"]:
        print(f"- {violation['description']}")

    assert len(rules) == 2
    assert len(result["violations"]) == 2
    assert result["compliance_score"] == 70
    assert result["compliance_status"] == "Non-Compliant"


if __name__ == "__main__":
    main()
