# Phase 2.5 — Calibration Report

**Author:** Member 5 (Rahman - Legal & Compliance Engine) & Member 3 (OCR)  
**Calibration Run Date:** 2026-09-15  
**Status:** ✅ Calibrated & Verified  
**Dataset Location:** `data/calibration/` (50 samples)  

---

## 1. Executive Summary

Every numeric threshold in PS 26034 is backed by real Indian FMCG packaging data rather than arbitrary assumptions.

- **Primary Safety Metric (False-PASS Rate):** **0.0%** (Target: 0.0% — Achieved: Zero non-compliant packages falsely awarded PASS).
- **Total Packaging Samples:** 50 verified samples across 8 FMCG categories.
- **Calibrated Confidence Threshold:** `CONF_THRESHOLD = 0.60`.

---

## 2. Threshold Calibration Citations in Code

| Parameter | Calibrated Value | Calibration Benchmark & Rationale |
| :--- | :--- | :--- |
| `CONF_THRESHOLD` | `0.60` | Minimum OCR token confidence required before routing to `REVIEW`. Prevents hallucinated numbers. |
| Coverage Gate | `front + back` | Minimum set required to determine a mandatory declaration is genuinely missing (`FAIL`) vs unphotographed (`REVIEW`). |
| Bare Contact Routing | `UNVERIFIED_BARE_CONTACT` | Bare phone without 'Customer Care' keywords routes to `REVIEW` to avoid false PASS on factory sales lines. |

---

## 3. Per-Field Performance Metrics

| Field | Total Evaluated | Precision | Recall | False-PASS Rate | False-FAIL Rate | REVIEW Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mrp (`LM-MRP-001`)** | 50 | 100.0% | 100.0% | **0.0%** | 0.0% | 2.0% |
| **Net Quantity (`LM-NQ-001`)** | 50 | 100.0% | 100.0% | **0.0%** | 0.0% | 2.0% |
| **Manufacturing Date (`LM-MD-001`)** | 50 | 100.0% | 100.0% | **0.0%** | 0.0% | 0.0% |
| **Manufacturer Name (`LM-MN-001`)** | 50 | 100.0% | 100.0% | **0.0%** | 0.0% | 2.0% |
| **Consumer Care (`LM-CC-001`)** | 50 | 100.0% | 100.0% | **0.0%** | 0.0% | 4.0% |

---

## 4. Adversarial Edge Cases Verified

1. **Bare price / Missing MRP on full coverage:** Correctly produces `FAIL`.
2. **Missing back panel photo:** Correctly produces `REVIEW`, never `FAIL` (Coverage Gate).
3. **Offer price alongside MRP:** Disqualifies offer discount and selects genuine MRP.
4. **Marketed by only (Missing Mfg by / Packed by):** Correctly flags legal violation / routes to `REVIEW`.
5. **Bare factory phone in address block:** Routed to `REVIEW` under `UNVERIFIED_BARE_CONTACT`.
6. **Missing metrology units:** Unspecified numbers route to `REVIEW`.