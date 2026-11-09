# College Institutional Credit System & Unit Economics Summary

This document details the college/institutional placement readiness evaluation slabs, credit deductions across 10 cohort scenarios, institutional top-up packages, and financial margin analysis.

---

## 1. Cohort Analysis Slabs & Credit Deductions (10 Cases)

Placement Readiness evaluates student cohorts against visiting recruiter Job Descriptions (JDs) using a 4-layer taxonomy breakdown (Hard Skills, Tooling & Infra, Engineering Process, Soft & Domain).

Deductions scale progressively with batch size and evaluation mode (Single Job vs. Multi-Job Pool):

| Case # | Cohort Scope / Batch Size | Single Job Analysis | Multi-Job Pool Analysis | Internal Cost Benchmark |
| :---: | :--- | :---: | :---: | :---: |
| **Case 1 & 2** | **Class / Branch (Up to 75 Students)** | **30 Credits** | **50 Credits** | ₹3.00 |
| **Case 3 & 4** | **Department / Dual Branch (76 – 250 Students)** | **60 Credits** | **100 Credits** | ₹3.00 |
| **Case 5 & 6** | **Multi-Branch / Mid-Campus (251 – 600 Students)** | **100 Credits** | **160 Credits** | ₹3.00 |
| **Case 7 & 8** | **Large College / Multi-Stream (601 – 1,000 Students)** | **140 Credits** | **220 Credits** | ₹3.00 |
| **Case 9 & 10** | **Mega University / Institutional Campus (1,001 – 2,000 Students)** | **180 Credits** | **280 Credits** | ₹3.00 |

*Note: University batch processing is capped at 2,000 students per evaluation run to maintain optimal LLM context efficiency and data density.*

---

## 2. Institutional Credit Top-Up Packages (Placement Readiness Tab)

Colleges purchase institutional credits directly from the Placement Readiness header credit showcase via Razorpay:

| Package Name | Credits Included | Base MRP | Offer Price | Discount | Effective Rate / Credit | Best Suited For |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Department Trial Pack** | **1,000 Credits** | ₹1,000 | **₹800** | **20% OFF** | ₹0.80 / cr | Single department drives, mock recruitments |
| **Campus Drive Pack** *(Popular)* | **2,000 Credits** | ₹2,000 | **₹1,400** | **30% OFF** | ₹0.70 / cr | Seasonal multi-branch campus recruitment drives |
| **Institutional Sovereign** *(Best Value)* | **5,000 Credits** | ₹5,000 | **₹2,500** | **50% OFF** | ₹0.50 / cr | Campus-wide mega cohorts & annual readiness tracking |

---

## 3. Financial Unit Economics & Profitability Analysis

With a fixed internal benchmark cost of **₹3.00 per generation run** across any of the 10 cohort scenarios:

### A. Minimum and Maximum Revenue & Margin per Run

| Slab / Operation | Credits | At ₹0.80/cr (Trial Pack) | At ₹0.70/cr (Drive Pack) | At ₹0.50/cr (Sovereign Pack) | Platform Cost | Gross Margin Range |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Class Single Job** (Min Slab) | 30 cr | ₹24.00 | ₹21.00 | ₹15.00 | ₹3.00 | **80.0% – 87.5%** |
| **Class Pool Drive** | 50 cr | ₹40.00 | ₹35.00 | ₹25.00 | ₹3.00 | **88.0% – 92.5%** |
| **Dept Single Job** | 60 cr | ₹48.00 | ₹42.00 | ₹30.00 | ₹3.00 | **90.0% – 93.8%** |
| **Dept Pool Drive** | 100 cr | ₹80.00 | ₹70.00 | ₹50.00 | ₹3.00 | **94.0% – 96.3%** |
| **Campus Mega Single Job** | 180 cr | ₹144.00 | ₹126.00 | ₹90.00 | ₹3.00 | **96.7% – 97.9%** |
| **Campus Mega Pool Drive** (Max Slab) | 280 cr | ₹224.00 | ₹196.00 | ₹140.00 | ₹3.00 | **97.9% – 98.7%** |

### B. Aggregate Package Capacity & Value

* **Department Trial (1,000 Credits @ ₹800):**
  * Delivers up to **33 Class-level analyses** OR **10 Department pool runs**.
  * Total platform delivery cost: $\text{₹30 to ₹100}$ against ₹800 revenue $\rightarrow$ **₹700 – ₹770 Net Margin (87.5% – 96.3%)**.

* **Campus Drive Pack (2,000 Credits @ ₹1,400):**
  * Delivers up to **66 Class-level analyses** OR **20 Department pool runs** OR **7 Mega campus runs**.
  * Total platform delivery cost: $\text{₹21 to ₹200}$ against ₹1,400 revenue $\rightarrow$ **₹1,200 – ₹1,379 Net Margin (85.7% – 98.5%)**.

* **Institutional Sovereign (5,000 Credits @ ₹2,500):**
  * Delivers up to **166 Class analyses** OR **50 Department pool runs** OR **18 Mega campus runs**.
  * Total platform delivery cost: $\text{₹54 to ₹500}$ against ₹2,500 revenue $\rightarrow$ **₹2,000 – ₹2,446 Net Margin (80.0% – 97.8%)**.

---

## 4. Key Architectural & Product Rules

1. **Strictly Credits in Code & UI:**
   * Internal ₹3 cost calculations and financial margins remain exclusively in this summary document.
   * All frontend UI badges, confirmation modals, error states, and ledger records operate solely with credits.
2. **Dedicated Placement Readiness Placement:**
   * As requested, institutional credit counters and top-up triggers are exclusively housed on the Placement Readiness tab (`/college/placement-readiness`).
   * Clicking either the credit counter badge or the `+ Top Up` button opens the modal with the 3 packages.
3. **Razorpay Production Integration:**
   * Order creation via `createCollegeCreditTopupOrderAction`
   * Instant confirmation via `confirmCollegeCreditTopupAction`
   * Webhook fallback via `/api/webhooks/razorpay` with type `college_credit_topup`
   * Atomic balance update in `colleges.credit_balance` with audit trail in `credit_ledgers`.
