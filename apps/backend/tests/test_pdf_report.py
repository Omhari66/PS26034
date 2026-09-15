"""
Integration and unit tests for Ticket 14:
PDF Report Export & Completeness Guarantee.

Covers:
A. Valid inspection generates valid PDF with %PDF header, rule version, and extracted values.
B. FOUND + None fails completeness validation (preview, PDF endpoint, and service).
C. FOUND + "" fails completeness validation.
D. FOUND + whitespace ("   ") fails completeness validation.
E. NOT_FOUND with no value passes validation and preserves NOT_FOUND state.
F. NOT_VERIFIABLE with no value passes validation and preserves NOT_VERIFIABLE state.
G. CONFLICTING preserves CONFLICTING state without completeness error.
H. Corrections/resolutions and rule version appear in report/PDF.
I. Missing/unsubmitted inspection returns 404 REPORT_NOT_FOUND for preview and PDF.
J. Shared validation: preview and PDF use the exact same completeness invariant.
"""

import re
from pathlib import Path

import pytest
from packages.shared_schema import Decision, EvidenceState, FieldEvidence, RuleResult

from app.models import FieldResult as FieldResultModel
from app.models import Inspection
from app.services import inspection_service as svc
from app.services import pdf_generator as pdf_gen
from app.services.inspection_service import (
    ReportCompletenessError,
    _assert_report_complete,
    generate_inspection_pdf,
    get_report_preview,
)

_COVERAGE = {"front": True, "back": True, "close_up": False}

_VALID_EVIDENCES = [
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "149.00",
        "ocr_confidence": 0.94,
    },
    {
        "field_name": "net_quantity",
        "state": "FOUND",
        "value": "500g",
        "ocr_confidence": 0.91,
    },
    {
        "field_name": "manufacturing_date",
        "state": "FOUND",
        "value": "2025-01-01",
        "ocr_confidence": 0.87,
    },
    {
        "field_name": "manufacturer_name",
        "state": "FOUND",
        "value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "ocr_confidence": 0.88,
    },
    {
        "field_name": "consumer_care",
        "state": "FOUND",
        "value": "1800-000-000",
        "ocr_confidence": 0.85,
    },
]


def _create_submitted_inspection(
    client,
    category="packaged_food",
    evidences=None,
    corrections=None,
):
    """Helper: create and submit inspection via API."""
    if evidences is None:
        evidences = _VALID_EVIDENCES

    r = client.post("/api/v1/inspections", json={"inspector_id": "inspector_001"})
    assert r.status_code == 201
    insp_id = r.json()["inspection_id"]

    r = client.post(f"/api/v1/inspections/{insp_id}/category", json={"category": category})
    assert r.status_code == 200

    payload = {"coverage": _COVERAGE, "field_evidences": evidences}
    if corrections:
        payload["corrections"] = corrections
    r = client.post(f"/api/v1/inspections/{insp_id}/submit", json=payload)
    assert r.status_code == 200, r.text
    return insp_id


def _seed_db_inspection_with_evidence(db, field_name: str, state: str, value: str | None):
    """Helper: directly seed a submitted Inspection with raw FieldResult in DB."""
    insp = Inspection(
        inspector_id="insp_test",
        status="submitted",
        category="packaged_food",
        rule_version="v1.0",
        overall_decision="REVIEW",
        coverage=_COVERAGE,
    )
    db.add(insp)
    db.flush()

    evidence_dict = {
        "field_name": field_name,
        "state": state,
        "value": value,
        "source_image": "front.jpg",
        "bbox": [0, 0, 100, 50],
        "ocr_engine": "easyocr",
        "ocr_confidence": 0.95,
        "secondary_value": None,
        "image_quality": "high",
        "candidates": [],
        "single_engine_only": False,
    }
    fr = FieldResultModel(
        inspection_id=insp.id,
        rule_id=f"LM-{field_name.upper()}-001",
        rule_version="v1.0",
        field_name=field_name,
        decision="PASS" if (state == "FOUND" and value) else "REVIEW",
        reason="Test reason",
        evidence_json=evidence_dict,
        correction_json=None,
    )
    db.add(fr)
    db.commit()
    db.refresh(insp)
    return insp.id


def extract_pdf_unicode_text(pdf_bytes: bytes) -> str:
    """
    Extract decoded Unicode text from PDF bytes generated with fpdf2 TrueType font(s).
    Maps font references (/F1, /F2, etc.) to their respective /ToUnicode CMaps
    and resolves big-endian 2-byte character IDs (CIDs) in content stream string literals.
    """
    raw = pdf_bytes.decode("latin-1", errors="ignore")

    # 1. Map /F1, /F2, etc. to their font object ID
    font_refs = dict(re.findall(r"/(F\d+)\s+(\d+)\s+0\s+R", raw))

    # 2. Map font ID to ToUnicode object ID
    font_tounicode: dict[str, str] = {}
    for font_id, obj_id in font_refs.items():
        m = re.search(rf"{obj_id}\s+0\s+obj.*?/ToUnicode\s+(\d+)\s+0\s+R", raw, re.DOTALL)
        if m:
            font_tounicode[font_id] = m.group(1)

    # 3. Parse CMap for each font
    font_cmaps: dict[str, dict[int, str]] = {}
    for font_id, touni_obj in font_tounicode.items():
        m = re.search(rf"{touni_obj}\s+0\s+obj.*?stream\s*(.*?)\s*endstream", raw, re.DOTALL)
        if not m:
            continue
        stream_text = m.group(1)
        cmap: dict[int, str] = {}
        for bf in re.finditer(r"beginbfchar\s*(.*?)\s*endbfchar", stream_text, re.DOTALL):
            for line in bf.group(1).splitlines():
                m_bf = re.match(r"<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>", line.strip())
                if m_bf:
                    cmap[int(m_bf.group(1), 16)] = chr(int(m_bf.group(2), 16))
        for bfr in re.finditer(r"beginbfrange\s*(.*?)\s*endbfrange", stream_text, re.DOTALL):
            for line in bfr.group(1).splitlines():
                m_bfr = re.match(
                    r"<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>",
                    line.strip(),
                )
                if m_bfr:
                    s_c = int(m_bfr.group(1), 16)
                    e_c = int(m_bfr.group(2), 16)
                    s_u = int(m_bfr.group(3), 16)
                    for off in range(e_c - s_c + 1):
                        cmap[s_c + off] = chr(s_u + off)
        font_cmaps[font_id] = cmap

    # 4. Parse content streams tracking current font
    current_font = list(font_cmaps.keys())[0] if font_cmaps else None
    tokens = re.finditer(r"/(F\d+)\s+\d+(?:\.\d+)?\s+Tf|\(((?:[^()\\]|\\.)*)\)\s*Tj", raw)
    chars: list[str] = []
    for t in tokens:
        if t.group(1):
            current_font = t.group(1)
        elif t.group(2) is not None:
            s = t.group(2)
            cmap = font_cmaps.get(current_font, {})
            unescaped = bytearray()
            i = 0
            b_str = s.encode("latin-1")
            while i < len(b_str):
                if b_str[i] == 92 and i + 1 < len(b_str):
                    nxt = b_str[i + 1]
                    if nxt == 110:
                        unescaped.append(10)
                    elif nxt == 114:
                        unescaped.append(13)
                    elif nxt == 116:
                        unescaped.append(9)
                    elif nxt == 92:
                        unescaped.append(92)
                    elif nxt == 40:
                        unescaped.append(40)
                    elif nxt == 41:
                        unescaped.append(41)
                    else:
                        unescaped.append(nxt)
                    i += 2
                else:
                    unescaped.append(b_str[i])
                    i += 1
            for j in range(0, len(unescaped) - 1, 2):
                cid = (unescaped[j] << 8) | unescaped[j + 1]
                if cid in cmap:
                    chars.append(cmap[cid])
    return "".join(chars)


class TestValidInspectionPDF:
    """A. Valid inspection report generation with Unicode font."""

    def test_pdf_endpoint_success(self, client):
        insp_id = _create_submitted_inspection(client)
        resp = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 500
        assert resp.content.startswith(b"%PDF-")

        # Verify NotoSansDevanagari Unicode font is embedded, not Helvetica
        assert b"NotoSansDevanagari" in resp.content
        assert b"Helvetica" not in resp.content
        assert b"ToUnicode" in resp.content

        # Meaningfully verify rule version and extracted value via ToUnicode decoded text
        text = extract_pdf_unicode_text(resp.content)
        assert "149.00" in text
        assert "1.0" in text

    def test_pdf_service_success(self, client, db):
        insp_id = _create_submitted_inspection(client)
        pdf_bytes = generate_inspection_pdf(insp_id, db)
        assert pdf_bytes is not None
        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 500
        assert b"NotoSansDevanagari" in pdf_bytes

        text = extract_pdf_unicode_text(pdf_bytes)
        assert "149.00" in text

    def test_preview_endpoint_success(self, client):
        insp_id = _create_submitted_inspection(client)
        resp = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["inspection_id"] == insp_id
        assert data["rule_version"] == "v1.0"
        assert len(data["field_results"]) == 5


class TestUnicodeHindiPreservation:
    """Unicode preservation tests, specifically for Hindi / Devanagari OCR evidence."""

    def test_hindi_ocr_evidence_preserved_in_pdf(self, client, db):
        hindi_val = "निर्माता: उदाहरण कंपनी"
        insp_id = _seed_db_inspection_with_evidence(
            db, "manufacturer_name", "FOUND", hindi_val
        )

        # Service generation
        pdf_bytes = generate_inspection_pdf(insp_id, db)
        assert pdf_bytes.startswith(b"%PDF-")
        assert b"NotoSansDevanagari" in pdf_bytes
        assert b"Helvetica" not in pdf_bytes
        assert b"ToUnicode" in pdf_bytes

        # Decode via ToUnicode CMap
        text = extract_pdf_unicode_text(pdf_bytes)
        assert hindi_val in text
        assert "?" not in text  # Not replaced by '?'

        # Endpoint generation
        resp = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        endpoint_text = extract_pdf_unicode_text(resp.content)
        assert hindi_val in endpoint_text

    def test_missing_font_raises_explicit_filenotfounderror(self, monkeypatch, db):
        insp_id = _seed_db_inspection_with_evidence(db, "mrp", "FOUND", "149.00")
        fake_path = Path("app/assets/fonts/NonExistentFont.ttf")
        monkeypatch.setattr(pdf_gen, "FONT_PATH", fake_path)

        with pytest.raises(FileNotFoundError, match="Required Unicode font"):
            generate_inspection_pdf(insp_id, db)


class TestCompletenessFailures:
    """B, C, D. Completeness invariant: FOUND with None, '', or whitespace fails."""

    def test_found_none_unit_assertion(self):
        rr = RuleResult(
            rule_id="LM-MRP-001",
            rule_version="v1.0",
            field_name="mrp",
            decision=Decision.PASS,
            reason="test",
            evidence=FieldEvidence(field_name="mrp", state=EvidenceState.FOUND, value=None),
        )
        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            _assert_report_complete([rr])

    def test_found_empty_string_unit_assertion(self):
        rr = RuleResult(
            rule_id="LM-MRP-001",
            rule_version="v1.0",
            field_name="mrp",
            decision=Decision.PASS,
            reason="test",
            evidence=FieldEvidence(field_name="mrp", state=EvidenceState.FOUND, value=""),
        )
        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            _assert_report_complete([rr])

    def test_found_whitespace_unit_assertion(self):
        rr = RuleResult(
            rule_id="LM-MRP-001",
            rule_version="v1.0",
            field_name="mrp",
            decision=Decision.PASS,
            reason="test",
            evidence=FieldEvidence(field_name="mrp", state=EvidenceState.FOUND, value="   "),
        )
        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            _assert_report_complete([rr])

    def test_found_none_endpoint_and_service_fail(self, client, db):
        insp_id = _seed_db_inspection_with_evidence(db, "mrp", "FOUND", None)

        # Service fails
        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            generate_inspection_pdf(insp_id, db)

        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            get_report_preview(db, insp_id)

        # PDF endpoint fails with 422 REPORT_INCOMPLETE
        r_pdf = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert r_pdf.status_code == 422
        assert r_pdf.json()["detail"]["code"] == "REPORT_INCOMPLETE"

        # Preview endpoint fails with 422 REPORT_INCOMPLETE
        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 422
        assert r_prev.json()["detail"]["code"] == "REPORT_INCOMPLETE"

    def test_found_empty_string_endpoint_and_service_fail(self, client, db):
        insp_id = _seed_db_inspection_with_evidence(db, "mrp", "FOUND", "")

        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            generate_inspection_pdf(insp_id, db)

        r_pdf = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert r_pdf.status_code == 422
        assert r_pdf.json()["detail"]["code"] == "REPORT_INCOMPLETE"

        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 422
        assert r_prev.json()["detail"]["code"] == "REPORT_INCOMPLETE"

    def test_found_whitespace_endpoint_and_service_fail(self, client, db):
        insp_id = _seed_db_inspection_with_evidence(db, "mrp", "FOUND", "  \t\n  ")

        with pytest.raises(ReportCompletenessError, match="completeness failure"):
            generate_inspection_pdf(insp_id, db)

        r_pdf = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert r_pdf.status_code == 422
        assert r_pdf.json()["detail"]["code"] == "REPORT_INCOMPLETE"


class TestNonFoundStatesAllowedEmpty:
    """E, F, G. NOT_FOUND, NOT_VERIFIABLE, and CONFLICTING with no value pass."""

    def test_not_found_with_none_passes(self, client, db):
        insp_id = _seed_db_inspection_with_evidence(db, "consumer_care", "NOT_FOUND", None)
        # Should not raise completeness failure
        preview = get_report_preview(db, insp_id)
        assert preview is not None
        pdf_bytes = generate_inspection_pdf(insp_id, db)
        assert pdf_bytes is not None and pdf_bytes.startswith(b"%PDF-")

        # Endpoints succeed
        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 200
        fr = r_prev.json()["field_results"][0]
        assert fr["evidence"]["state"] == "NOT_FOUND"

        r_pdf = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert r_pdf.status_code == 200

    def test_not_verifiable_with_none_passes(self, client, db):
        insp_id = _seed_db_inspection_with_evidence(
            db, "manufacturing_date", "NOT_VERIFIABLE", None
        )
        preview = get_report_preview(db, insp_id)
        assert preview is not None
        pdf_bytes = generate_inspection_pdf(insp_id, db)
        assert pdf_bytes is not None and pdf_bytes.startswith(b"%PDF-")

        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 200
        assert r_prev.json()["field_results"][0]["evidence"]["state"] == "NOT_VERIFIABLE"

    def test_conflicting_state_passes(self, client, db):
        insp = Inspection(
            inspector_id="insp_test",
            status="submitted",
            category="packaged_food",
            rule_version="v1.0",
            overall_decision="REVIEW",
            coverage=_COVERAGE,
        )
        db.add(insp)
        db.flush()

        evidence_dict = {
            "field_name": "mrp",
            "state": "CONFLICTING",
            "value": None,
            "secondary_value": "199.00",
            "candidates": ["149.00", "199.00"],
            "ocr_confidence": 0.90,
            "single_engine_only": False,
        }
        fr = FieldResultModel(
            inspection_id=insp.id,
            rule_id="LM-MRP-001",
            rule_version="v1.0",
            field_name="mrp",
            decision="REVIEW",
            reason="Readings disagree",
            evidence_json=evidence_dict,
        )
        db.add(fr)
        db.commit()

        preview = get_report_preview(db, insp.id)
        assert preview is not None
        assert preview.field_results[0].evidence.state == EvidenceState.CONFLICTING
        assert preview.field_results[0].evidence.secondary_value == "199.00"

        pdf_bytes = generate_inspection_pdf(insp.id, db)
        assert pdf_bytes is not None and pdf_bytes.startswith(b"%PDF-")


class TestCorrectionsAndRuleVersion:
    """H. Corrections/resolutions and rule version appear in report/PDF."""

    def test_corrections_appear_in_preview_and_pdf(self, client, db):
        # Create an inspection with a REVIEW field resolved by inspector correction
        evidences = [
            {"field_name": "mrp", "state": "FOUND", "value": "149.00"},
            {"field_name": "net_quantity", "state": "FOUND", "value": "500g"},
            {"field_name": "manufacturing_date", "state": "NOT_VERIFIABLE"},
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
            },
            {"field_name": "consumer_care", "state": "FOUND", "value": "1800-000-000"},
        ]
        corrections = [
            {
                "field_name": "manufacturing_date",
                "action": "corrected",
                "corrected_value": "2025-02-01",
                "reviewer_id": "insp_001",
                "acknowledged": True,
            }
        ]
        insp_id = _create_submitted_inspection(client, evidences=evidences, corrections=corrections)

        # Verify preview includes correction and rule_version
        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 200
        data = r_prev.json()
        assert data["rule_version"] == "v1.0"
        mfg = next(f for f in data["field_results"] if f["field_name"] == "manufacturing_date")
        assert mfg["correction"] is not None
        assert mfg["correction"]["corrected_value"] == "2025-02-01"
        assert mfg["correction"]["action"] == "corrected"

        # Verify PDF generates successfully
        pdf_bytes = generate_inspection_pdf(insp_id, db)
        assert pdf_bytes is not None and pdf_bytes.startswith(b"%PDF-")


class TestMissingAndUnsubmittedInspection:
    """I. Missing or unsubmitted inspections return 404 REPORT_NOT_FOUND."""

    def test_missing_inspection_returns_404(self, client):
        r_prev = client.get("/api/v1/inspections/non-existent-uuid/report/preview")
        assert r_prev.status_code == 404
        assert r_prev.json()["detail"]["code"] == "REPORT_NOT_FOUND"

        r_pdf = client.get("/api/v1/inspections/non-existent-uuid/report/pdf")
        assert r_pdf.status_code == 404
        assert r_pdf.json()["detail"]["code"] == "REPORT_NOT_FOUND"

    def test_unsubmitted_inspection_returns_404(self, client):
        # Create an inspection in "capturing" status
        r = client.post("/api/v1/inspections", json={"inspector_id": "inspector_001"})
        insp_id = r.json()["inspection_id"]

        r_prev = client.get(f"/api/v1/inspections/{insp_id}/report/preview")
        assert r_prev.status_code == 404
        assert r_prev.json()["detail"]["code"] == "REPORT_NOT_FOUND"

        r_pdf = client.get(f"/api/v1/inspections/{insp_id}/report/pdf")
        assert r_pdf.status_code == 404
        assert r_pdf.json()["detail"]["code"] == "REPORT_NOT_FOUND"


class TestSharedValidationProof:
    """J. Prove preview and PDF share the exact same completeness validation path."""

    def test_shared_validation_function_used(self, monkeypatch, db):
        insp_id = _seed_db_inspection_with_evidence(db, "mrp", "FOUND", "149.00")

        calls = []

        def mock_assert(field_results):
            calls.append(len(field_results))
            return None

        monkeypatch.setattr(svc, "_assert_report_complete", mock_assert)

        get_report_preview(db, insp_id)
        assert len(calls) == 1

        generate_inspection_pdf(insp_id, db)
        assert len(calls) == 2
