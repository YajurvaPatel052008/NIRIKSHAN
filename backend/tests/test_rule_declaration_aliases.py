from app.services.rule_engine import validate_declarations


def test_full_rule_names_match_legacy_classifier_names():
    declarations = [
        {"declaration_type": "Manufacturer", "normalized_value": "Acme"},
        {"declaration_type": "Consumer Care", "normalized_value": "1800-123"},
        {"declaration_type": "Mfg Date", "normalized_value": "06/2026"},
    ]
    rules = [
        {
            "declaration_type": "Manufacturer/Packer/Importer Name & Address",
            "validation_type": "Presence Check",
            "severity": "High",
        },
        {"declaration_type": "Consumer Care Details", "validation_type": "Presence Check", "severity": "Medium"},
        {"declaration_type": "Month & Year of Manufacture/Packing", "validation_type": "Presence Check", "severity": "High"},
    ]

    assert validate_declarations(declarations, rules) == []


def test_unsupported_common_name_rule_does_not_create_false_missing_violation():
    rules = [
        {
            "declaration_type": "Common or Generic Name",
            "validation_type": "Presence Check",
            "severity": "Medium",
        }
    ]

    assert validate_declarations([], rules) == []
