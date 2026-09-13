from app.services.groq_service import _build_prompt


def test_prompt_includes_maintained_terms_and_real_label_example():
    prompt = _build_prompt(
        [
            {"text": "Qty: 1 Unit", "bounding_box": {"x": 0, "y": 0, "w": 10, "h": 10}},
            {"text": "Brand Name: Hammer", "bounding_box": {"x": 0, "y": 0, "w": 10, "h": 10}},
        ],
        "Household",
    )

    assert '"Net Qty"' in prompt
    assert '"Imported, Marketed & Packed by"' in prompt
    assert "₹2499.00/-" in prompt
    assert "June 2026" in prompt
    assert "Ignore non-mandatory fields" in prompt
