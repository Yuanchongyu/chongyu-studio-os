# WAICY Medical AI Competition Track

Status: Planned
Audience: Senior students, 4–5 students (names TBD)
Format: Small cohort, project-based, competition-oriented
Target: WAICY AI Showcase Track
Suggested duration: 8 weeks, 1 session/week, 2–2.5 hours/session
Teaching principle: Build first → encounter a real problem → learn the minimum necessary knowledge → test → iterate → explain.

## Course goal

Guide a senior-student team from problem discovery to a working AI-enabled medical/safety-device prototype suitable for WAICY AI Showcase. The preferred direction is a non-diagnostic safety/monitoring device rather than a system that claims to diagnose disease.

Recommended product direction:

**AI Fall + Heart-Rate Safety Monitor**

MVP first: IMU-based fall detection.
Stretch goal: add PPG heart-rate sensing and multimodal risk logic.

System concept:

Sensor → MCU → Data Collection → AI Model → Risk Decision → Alert / Web Dashboard / BLE

## Competition alignment

Prepare explicitly for the published WAICY AI Showcase rubric structure:

- Artificial Intelligence — 25
- Technical Skills — 25
- Problem Statement — 10
- Design — 10
- AI Ethics — 10
- Presentation & Communication — 10
- Originality & Creativity — 10

The course should collect evidence for every category from week 1 onward rather than adding competition materials at the end.

## Hardware baseline

Preferred controller:
- XIAO nRF52840 Sense for wearable prototype: BLE + onboard IMU.
- ESP32 is acceptable when Wi‑Fi/web integration is more important.

Sensors / outputs:
- 6-axis IMU for fall and motion data.
- MAX30102 for PPG heart-rate signal in the stretch phase.
- LED, buzzer or vibration motor for local alerts.
- Breadboard, jumper wires, resistors, USB cables.
- LiPo battery only after the wired prototype is stable.

Do not start by building a polished patch/enclosure. Validate sensing, data, model and system behavior first.

## Week 0 — Kickoff / Project Discovery

Goal: choose a real problem before choosing technology.

Questions:
- Who is the user: older adult, athlete, person living alone, caregiver?
- What exact problem happens in the real world?
- What signal can we measure?
- Which decision actually requires AI?
- What should the device do after the decision?
- How will we prove that it works?

Activities:
1. Show 2–3 possible product directions.
2. Students interview each other as users/designers.
3. Create one-sentence problem statements.
4. Draw the first system architecture.
5. Decide team roles for the first sprint, but rotate roles later.

Deliverables:
- Problem statement.
- Target user.
- First architecture diagram.
- MVP scope.
- Initial risk/ethics questions.

Teacher guardrail:
Avoid claims such as “detect heart attack” or “diagnose disease.” Prefer “detect unusual sensor patterns and raise an alert for further attention.”

## Week 1 — Sensors & Physical Signal

Learning goal: understand what the device can actually observe.

Topics:
- Accelerometer vs gyroscope.
- X/Y/Z acceleration.
- Sampling rate.
- Raw sensor data and noise.
- If using MAX30102: PPG concept, reflected light and pulse waveform.

Build:
- Connect/read IMU.
- Stream raw data to serial or a simple webpage.
- Move the sensor and identify visible patterns.

Must-have outcome:
Every student can explain: “What is the input to our AI system?”

Evidence to save:
- Photos/video of hardware.
- Screenshot of raw signals.
- First observations and unexpected behavior.

## Week 2 — Data Collection & Labeling

Learning goal: turn physical actions into a dataset.

Suggested classes:
- Walking.
- Sitting down quickly.
- Running/jumping.
- Lying down.
- Safe simulated fall / controlled fall proxy.

Topics:
- Sample vs dataset.
- Label.
- Windowing time-series data.
- Train/validation/test split.
- Data leakage.

Build:
- Data recorder.
- Labeling workflow.
- Dataset version 1.

Must-have outcome:
A documented dataset with class counts and collection procedure.

Safety:
Do not ask students to perform dangerous uncontrolled falls. Use safe simulations, cushions, controlled motions or available public datasets where appropriate.

## Week 3 — First AI Model

Learning goal: create a real ML baseline rather than only threshold rules.

Recommended baseline models:
- Random Forest.
- SVM.
- Small neural network only if useful.

Topics:
- Features vs raw window.
- Training.
- Prediction/inference.
- Accuracy is not enough.
- Confusion matrix.

Build:
- Train model v1.
- Compare predictions with labels.

Must-have outcome:
Working fall/non-fall classifier and a confusion matrix.

Student explanation requirement:
They must be able to answer why this is machine learning instead of a fixed `if acceleration > threshold` rule.

## Week 4 — Break the Model & Improve It

Learning goal: use failures as engineering evidence.

Test cases:
- Fast sitting mistaken for fall.
- Jump/landing.
- Dropping the device.
- Different student/body movement.
- Different mounting orientation.

Topics:
- False positive.
- False negative.
- Precision/recall.
- Generalization.
- Dataset bias.

Build:
- Failure log.
- Dataset v2.
- Model v2.

Must-have outcome:
At least one documented failure → hypothesis → change → retest cycle.

## Week 5 — Product Integration

Learning goal: turn a model into a complete system.

Architecture:
IMU → MCU → Data Window → Model → Decision → Alert → Dashboard/BLE

Build options:
- Local LED/buzzer/vibration alert.
- BLE event to phone/laptop.
- Web dashboard with event history.

Topics:
- Model vs product.
- State and event logic.
- Latency.
- Reliability.
- What happens when connection is lost?

Must-have outcome:
A live end-to-end demo where a sensor event produces a visible system response.

## Week 6 — Heart Rate / Multimodal Stretch Goal

Only begin after the fall-detection MVP works.

Learning goal: understand a second physiological signal without overclaiming medical meaning.

Topics:
- PPG waveform.
- Heart-rate estimation.
- Motion artifacts.
- Sensor confidence.
- Multimodal decision logic.

Possible product logic:
Fall model detects event + heart-rate signal is unusual/low-confidence → increase attention level / request caregiver check.

Important:
Do not present consumer classroom hardware as a clinical diagnostic device.

Must-have outcome:
Either a reliable PPG visualization/heart-rate demo or a documented decision to exclude it from final MVP based on evidence.

## Week 7 — Ethics, Safety & Human-Centered Design

Learning goal: make ethics part of the engineering system, not a final slide.

Questions:
- What happens if the system misses a real fall?
- What happens if it sends false alarms?
- Who sees the sensor data?
- Is data stored locally or in the cloud?
- How long is it retained?
- Does the model work equally well for different people/movements?
- How do we communicate uncertainty?

Build:
- Privacy/data-flow diagram.
- Risk table.
- UI states for normal / uncertain / alert.
- Clear product limitations.

Must-have outcome:
An “Ethics & Limitations” section that students can explain in their own words.

## Week 8 — WAICY Submission & Pitch

Goal: turn engineering work into competition evidence.

Final package:
- Working prototype.
- Problem statement.
- Architecture diagram.
- Dataset summary.
- AI model explanation.
- Confusion matrix and testing results.
- Version history: v1 → failures → v2.
- Ethics/limitations.
- Demo video.
- Pitch slides.
- Q&A preparation.

Suggested pitch flow:
1. Who has this problem?
2. Why current solutions are insufficient / what gap we chose.
3. What we built.
4. Where AI is used and why.
5. Dataset and model.
6. Live/demo result.
7. What failed and how we improved it.
8. Safety, privacy and limitations.
9. What we would build next.

## Team structure for 4–5 students

Do not permanently divide students into “coder / designer / presenter.” Rotate ownership so every student can explain the whole system.

Suggested rotating roles:
- Sensor & hardware lead.
- Data lead.
- Model/testing lead.
- Product/dashboard lead.
- Documentation/pitch lead.

Each week every student should still answer three questions:
1. What problem are we solving?
2. What changed this week?
3. What evidence tells us whether it improved?

## Teacher preparation checklist

Before starting:
- Confirm WAICY registration/submission dates and current-year rubric.
- Prepare 2–3 sample project directions but do not force one solution.
- Test all hardware personally.
- Create a shared project repository/folder.
- Prepare a data-collection template.
- Prepare a weekly engineering log template.
- Decide safe fall-simulation protocol.
- Ensure parents/students understand this is an educational prototype, not a medical device.

## Success definition

A successful course does not require a clinically accurate product. It requires students to demonstrate a credible engineering loop:

Real problem → measurable signal → dataset → AI model → testing → failure analysis → system integration → ethical reasoning → clear communication.
