# Student Credit System & Unit Economics Summary

This document outlines the student-facing credit deduction rules, top-up packages, and financial unit economics designed for the Placeme platform.

---

## 1. Credit Deduction Rules (Student Dashboard)

All student AI operations are metered strictly through credits. No rupee figures are exposed in product flows or client interfaces.

| Feature / Action | Credits Deducted | Internal Cost Benchmark | Notes & Rules |
| :--- | :---: | :---: | :--- |
| **AI Resume Generation** | **30 Credits** | ₹1.00 | Includes ATS-tailored LaTeX compile, keyword mapping & PDF export |
| **AI Job Search (5 Postings)** | **100 Credits** | ₹3.00 | Scrapes & scores 5 live jobs across LinkedIn & Internshala with fit rationale |
| **AI Job Search (10 Postings)** | **180 Credits** | ₹6.00 | Bulk job discovery with 10% credit discount (18 credits/job vs 20) |
| **Skill Gap Analysis** | **0 Credits** | ₹0.00 | Free value-add to drive student engagement and retention |
| **Cold Outreach Email Generator** | **0 Credits** | ₹0.00 | Free utility to assist students in outreach and networking |

---

## 2. Student Credit Purchase Packages (Billing Tab)

Students purchase credit packs via Razorpay. Pricing offers tiered volume discounts:

| Package Name | Credits Included | MRP (Base) | Offer Price | Effective Rate / Credit | Discount |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Starter Pack** | **500 Credits** | ₹100 | **₹100** | ₹0.200 / cr | Base Rate |
| **Career Pro Pack** | **1,000 Credits** | ₹200 | **₹190** | ₹0.190 / cr | **5% OFF** |
| **Placement Booster** | **2,000 Credits** | ₹400 | **₹360** | ₹0.180 / cr | **10% OFF** |

---

## 3. Financial Unit Economics Analysis

Internal cost benchmark vs. revenue generated across credit tiers:

### A. AI Resume Generation (30 Credits | ₹1 Cost)
* **At Starter Pack (₹0.200/cr):** Revenue = $30 \times 0.20 = \text{₹6.00}$ → **Profit = ₹5.00 (83.3% Gross Margin)**
* **At Career Pro (₹0.190/cr):** Revenue = $30 \times 0.19 = \text{₹5.70}$ → **Profit = ₹4.70 (82.5% Gross Margin)**
* **At Placement Booster (₹0.180/cr):** Revenue = $30 \times 0.18 = \text{₹5.40}$ → **Profit = ₹4.40 (81.5% Gross Margin)**

### B. 5 Job Searches (100 Credits | ₹3 Cost)
* **At Starter Pack (₹0.200/cr):** Revenue = $100 \times 0.20 = \text{₹20.00}$ → **Profit = ₹17.00 (85.0% Gross Margin)**
* **At Career Pro (₹0.190/cr):** Revenue = $100 \times 0.19 = \text{₹19.00}$ → **Profit = ₹16.00 (84.2% Gross Margin)**
* **At Placement Booster (₹0.180/cr):** Revenue = $100 \times 0.18 = \text{₹18.00}$ → **Profit = ₹15.00 (83.3% Gross Margin)**

### C. 10 Job Searches (180 Credits | ₹6 Cost)
* **At Starter Pack (₹0.200/cr):** Revenue = $180 \times 0.20 = \text{₹36.00}$ → **Profit = ₹30.00 (83.3% Gross Margin)**
* **At Career Pro (₹0.190/cr):** Revenue = $180 \times 0.19 = \text{₹34.20}$ → **Profit = ₹28.20 (82.5% Gross Margin)**
* **At Placement Booster (₹0.180/cr):** Revenue = $180 \times 0.18 = \text{₹32.40}$ → **Profit = ₹26.40 (81.5% Gross Margin)**

---

## 4. Summary Takeaways
1. **Consistent 81.5% – 85.0% Gross Margins:** Under all packs and scenarios, platform margins remain above 81%.
2. **Student-Friendly Pricing:** ₹100 allows any college student to craft ~16 resumes or discover ~25 targeted job matches.
3. **Strict Separation of Concerns:** Internal ₹ cost figures remain strictly for economic planning and never leak into UI, database, or server actions.
