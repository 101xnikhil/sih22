# LANDGUARD AI — SIH 2026 5-Minute Live Judging Presentation Script

> **Problem Statement:** AI & IoT-Powered Early Warning System for Rainfall-Induced Landslides  
> **Project Name:** LANDGUARD AI (Prototype)  
> **Presentation Duration:** Exactly 5 Minutes (0:00 – 5:00)  
> **Required Mode:** `PHYSICAL DEMO` (or live ESP32 `LIVE HARDWARE` if bench hardware is powered)

---

## Presentation Checklist Before Judges Arrive
- [ ] Backend running: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (Status: `ONLINE`)
- [ ] Frontend running: `http://localhost:5173`
- [ ] Mode selector: Set to **`PHYSICAL DEMO`**
- [ ] Demo State reset to **`[ NORMAL ]`** (Dry Soil baseline)
- [ ] Browser window in full-screen mode (F11 / Cmd+Shift+F)

---

## Minute-by-Minute Presentation Timeline

```
  0:00 ─── 0:45    1. System Overview & Problem Statement
  0:45 ─── 1:15    2. Live Transducer Telemetry (Sensors Nominal)
  1:15 ─── 1:45    3. Trigger Rainfall (`[ RAIN ]` & `[ HEAVY RAIN ]`)
  1:45 ─── 2:30    4. Moisture & Pore-Water Infiltration Dynamics
  2:30 ─── 3:15    5. Physics Limit Equilibrium Degradation (FoS < 1.0)
  3:15 ─── 3:45    6. Gray-Box XGBoost AI Risk Scoring
  3:45 ─── 4:15    7. Explainable AI via SHAP Feature Attributions
  4:15 ─── 4:35    8. Multi-Tier Alerting & Safety Evacuation Trigger
  4:35 ─── 4:50    9. Geospatial GIS Sector Map & Offline Edge Health
  4:50 ─── 5:00   10. Scalability, Cost Model & Geotechnical Validation
```

---

### Minute 0:00 – 0:45 | 1. System Overview & Architecture
**What to Show on Screen:** Main Mission Control Dashboard (`/`) on state **`[ NORMAL ]`**.  
**Presenter Action:** Point to the system architecture and offline-first banner.

> **Speaker Script:**
> *"Respected judges, welcome to LANDGUARD AI. Landslides in the Western Ghats and Himalayan railway corridors cause tragic loss of life and infrastructure collapse due to undetected pore-water pressure buildup and sudden slope shear failure.*
>
> *Current monitoring approaches either rely on coarse satellite radar that updates days too late, or multi-crore imported geotechnical sensors that are too expensive for wide deployment.*
>
> *LANDGUARD AI is a rugged, low-cost ($45 edge node), offline-first early warning system that combines low-power LoRa IoT sensing, limit-equilibrium geotechnical physics, and explainable XGBoost AI. It operates with zero internet dependency directly on the local edge."*

---

### Minute 0:45 – 1:15 | 2. Live Transducers & Baseline Stability
**What to Show on Screen:** The 6 Sensor Cards (`Soil Moisture 18.5%`, `Rainfall 0 mm`, `Slope Angle 21.8°`, `FoS 1.85`).  
**Presenter Action:** Highlight the sensor telemetry metrics.

> **Speaker Script:**
> *"Here on the Mission Control Dashboard, we are monitoring Node LG-N01 on the Northern slope of Sector 7. 
>
> Right now in baseline state `[ NORMAL ]`:
> 1. Our capacitive soil moisture sensor reads **18.5%** — dry soil.
> 2. The FC-37 tipping-bucket rain sensor reads **0 mm/h**.
> 3. The 6-axis MPU6050 IMU measures a stable spatial dip of **21.8°** with zero angular creep.
> 4. Our geotechnical physics engine computes a **Factor of Safety of 1.85** — safely above the 1.30 stability threshold, and our AI outputs a nominal **LOW HAZARD (2%)**."*

---

### Minute 1:15 – 1:45 | 3. Triggering Precipitation (`[ RAIN ]` $\rightarrow$ `[ HEAVY RAIN ]`)
**What to Show on Screen:** Click **`[ RAIN ]`**, then after 15 seconds click **`[ HEAVY RAIN ]`**.  
**Presenter Action:** Click the buttons on the SIH Demo Controller.

> **Speaker Script:**
> *"Now, let us simulate a severe monsoon cloudburst event. When I click `[ RAIN ]` and `[ HEAVY RAIN ]`:
>
> Watch the live telemetry respond in real-time. Rainfall intensity jumps to **75 mm/h**, and cumulative precipitation crosses **55 mm**.
>
> Notice the event timeline immediately logs **'Rainfall detected'** and **'Moisture threshold crossed'**. The edge packet sequence is verified with monotonic watermarks and CCITT-16 CRC checksums."*

---

### Minute 1:45 – 2:30 | 4. Moisture Infiltration & Pore-Water Saturation
**What to Show on Screen:** Click **`[ SATURATION ]`**.  
**Presenter Action:** Point to the Soil Moisture Card and Live Engineering Charts.

> **Speaker Script:**
> *"As continuous rainfall infiltrates the soil matrix, water replaces air voids between soil grains.
>
> When I trigger `[ SATURATION ]`, soil moisture rises to **84.0%**. This generates severe pore-water pressure ($u$), which directly counteracts effective normal stress ($\sigma_n' = \sigma - u$).
>
> Notice the dynamic Live Chart: the moisture curve rapidly climbs while the stability curve begins its sharp descent."*

---

### Minute 2:30 – 3:15 | 5. Physics Limit Equilibrium & Factor of Safety (FoS)
**What to Show on Screen:** Point to the **Factor of Safety (FoS)** gauge on the Risk Card.  
**Presenter Action:** Click **`[ SLOPE MOVEMENT ]`**.

> **Speaker Script:**
> *"Unlike pure black-box AI systems that can hallucinate or overfit, LANDGUARD AI employs a **Gray-Box Geotechnical Architecture**.
>
> We calculate the Bishop/Fellenius Infinite Slope Factor of Safety in real time:
> $$\text{FoS} = \frac{c' + (\gamma z \cos^2\beta - u)\tan\phi'}{\gamma z \sin\beta \cos\beta}$$
>
> As physical displacement begins (`[ SLOPE MOVEMENT ]`), the IMU registers a tilt shift to **31.5°** and an accelerating creep rate of **+0.16°/min**.
>
> The Factor of Safety drops below **1.00** (to **0.92**). In soil mechanics, FoS < 1.0 represents limit equilibrium failure — shear stress exceeds the shear strength of the soil."*

---

### Minute 3:15 – 3:45 | 6. XGBoost Ensemble Risk Prediction
**What to Show on Screen:** The Risk Card transitioning from **`HIGH`** to **`CRITICAL`** (Score: **82%** $\rightarrow$ **95%**).  
**Presenter Action:** Click **`[ CRITICAL ]`**.

> **Speaker Script:**
> *"Simultaneously, our XGBoost Gradient Boosted Ensemble ingests the 6-dimensional feature vector: soil moisture, instantaneous rain, 24h rainfall, tilt angle, angular velocity, and the physics FoS.
>
> The system enforces a strict geotechnical constraint: whenever FoS < 1.0, the risk score is mathematically bounded to $\ge 0.75$, immediately transitioning the system to **CRITICAL HAZARD**."*

---

### Minute 3:45 – 4:15 | 7. Explainable AI via Local SHAP Attributions
**What to Show on Screen:** The **AI Hazard Explainability Card** (`AIExplanation.tsx`).  
**Presenter Action:** Point to the top 3 SHAP bars.

> **Speaker Script:**
> *"Judges often ask: 'Why did the AI trigger this alarm?'
>
> We solve this with integrated **SHAP (SHapley Additive exPlanations)**. The dashboard clearly explains the top 3 drivers:
> 1. **Factor of Safety (0.65)** contributed **+20.7%** to the hazard score (limit equilibrium failure).
> 2. **Soil Moisture (96.0%)** contributed **+14.2%** (pore saturation).
> 3. **Cumulative Rain (115 mm)** contributed **+8.5%** (rainfall load).
>
> Operators don't see a mysterious number — they see clear geotechnical causality."*

---

### Minute 4:15 – 4:35 | 8. Incident Command, Alerts & Railway Stoppage
**What to Show on Screen:** The High-Risk Warning Banner and Alert & Incident Center (`/alerts`).  
**Presenter Action:** Click **`ACKNOWLEDGE`** on the high hazard alert.

> **Speaker Script:**
> *"Immediately upon crossing the critical threshold, an automated safety incident is created. The alert details the node ID, exact trigger reasons, and timestamp.
>
> In our extensible alert dispatcher architecture, this signal can directly interface with Railway Section Control to turn track signals to RED and alert local disaster management authorities."*

---

### Minute 4:35 – 4:50 | 9. Geographic Map & Offline Edge Reliability
**What to Show on Screen:** Click **`Map`** (`/map`) or **`Sensor Node`** (`/sensor`).  
**Presenter Action:** Show the GIS sector pin turning RED and the LoRa signal quality metrics.

> **Speaker Script:**
> *"On the GIS Risk Map, Sector 7 flashes RED to alert response teams to the exact coordinates (31.1048°N, 77.1734°E).
>
> If cellular networks or internet cables are severed during a landslide storm, our ESP32 gateway buffers up to 256 telemetry frames locally in SRAM and continues computing without any cloud dependency."*

---

### Minute 4:50 – 5:00 | 10. Conclusion & Honest Scientific Prototype Scope
**What to Show on Screen:** Point to the footer disclaimer: *"Prototype — requires field calibration and geotechnical validation before operational deployment."*

> **Speaker Script:**
> *"To conclude: LANDGUARD AI delivers a complete, end-to-end early warning prototype at a fraction of commercial cost.
>
> As responsible engineers, we emphasize that this prototype requires localized geotechnical borehole calibration and soil shear angle validation before real-world deployment.
>
> Thank you, and we are now ready for your questions!"*

---

## Anticipated Judge Q&A & Defensible Answers

### Q1: How does your system work if the internet is down?
> **Answer:** *"The entire pipeline is 100% offline-first. Sensor nodes communicate with the local gateway over 433MHz LoRa. The gateway forwards packets via local HTTP/Serial to a local laptop running FastAPI, SQLite, and our local XGBoost model. No cloud, external API, or internet connection is required."*

### Q2: Why use both physics (FoS) and Machine Learning?
> **Answer:** *"Physics models (Infinite Slope) provide fundamental geotechnical guardrails and prevent hallucination under unseen conditions. Machine learning (XGBoost) captures non-linear interactions between rainfall accumulation rates, antecedent soil moisture, and micro-creep kinematics that simple limit-equilibrium equations miss. Together, they create a robust Gray-Box model."*

### Q3: What sensors are you using and what is the hardware cost?
> **Answer:** 
> - Capacitive Soil Moisture Sensor v2.0 (~₹120)
> - MPU6050 6-Axis IMU (~₹150)
> - FC-37 Rain Gauge (~₹80)
> - ESP32 Node + SX1278 LoRa Module (~₹750)
> - Solar LiFePO4 Power Circuit (~₹400)
> - **Total Node Bill of Materials:** ~₹1,500 ($18 USD), compared to commercial borehole inclinometers costing ₹2,00,000+.*

### Q4: How do you prevent false alarms from animal movement or wind?
> **Answer:** *"We use an envelope threshold on the 6-axis IMU: isolated impulse shocks (high acceleration with zero soil moisture or rain) are filtered by our 10-second rolling window. An alarm requires correlated multi-sensor evidence (elevated moisture + rainfall + sustained directional angular creep)."*
