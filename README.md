# SKYGUARD AI

Self-Aware Weather Observation Network · Smart India Hackathon 2026 · SIH26073 · Team Nexus.

This judge-ready prototype demonstrates simulated AWS data → physics-based consistency validation → transparent anomaly scoring → spatial cross-validation → explanation → alert.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Choose **Spike Fault** and click **Run Live Demo** to show AWS-003 at ~42°C while nearby stations remain near ~32°C. Then choose **Genuine Weather Event** to show all stations rising together. Presentation Mode is optimized for a projector/demo view.

## Optional API / Docker

```bash
docker compose up --build
```

FastAPI is exposed on `http://localhost:8000`, with the frontend on `http://localhost:3000`. The API includes `/stations`, `/stations/{id}`, `/stations/{id}/readings`, `/stations/{id}/health`, `/stations/{id}/nearby`, `/anomalies`, `/alerts`, `/simulation/scenario`, `/anomaly/analyze`, and `/explainability/{anomaly_id}`.

## Honesty notes

All readings are reproducible synthetic prototype data. The browser simulation uses a transparent deterministic scoring mechanism; it does not claim a production-trained LightGBM model or certified meteorological accuracy. The SHAP-style bars are explicitly a **Prototype Explainability Visualization**, not real SHAP values. A production integration would replace the simulator with AWS/MQTT ingestion, persist readings in PostgreSQL, and connect validation/model services.
