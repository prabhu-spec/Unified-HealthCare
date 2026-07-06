/**
 * Phase LLM-3 — Clinical profile, allergies, and active problems (editable for AI context).
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import { getScope } from "../db/requestScope.js";
import * as clinicalDb from "../db/repositories/clinicalProfile.js";
import {
  getInMemoryPatient,
  updateInMemoryClinicalProfile,
  createInMemoryAllergy,
  updateInMemoryAllergy,
  deleteInMemoryAllergy,
  createInMemoryProblem,
  updateInMemoryProblem,
  deleteInMemoryProblem,
  getInMemoryClinicalBundle,
} from "../store/inMemoryClinical.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? null;
}

function canManageClinical(role: string | null): boolean {
  return ["super_admin", "hospital_admin", "doctor", "nurse"].includes(role || "");
}

function denyUnlessClinicalManager(req: Request, res: Response): boolean {
  if (!canManageClinical(getRole(req))) {
    res.status(403).json({ error: "Forbidden." });
    return true;
  }
  return false;
}

router.get("/api/core/patients/:id/clinical-profile", async (req: Request, res: Response) => {
  const patientId = req.params.id;
  if (useDatabase()) {
    const bundle = await clinicalDb.getClinicalBundle(patientId, getScope(req));
    if (!bundle) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: bundle });
  }

  const bundle = getInMemoryClinicalBundle(req, patientId);
  if (!bundle) return res.status(404).json({ error: "Patient not found." });
  res.json({ data: bundle });
});

router.patch("/api/core/patients/:id/clinical-profile", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const patientId = req.params.id;

  if (useDatabase()) {
    const profile = await clinicalDb.updateClinicalProfile(patientId, getScope(req), req.body || {});
    if (!profile) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: { clinicalProfile: profile } });
  }

  const profile = updateInMemoryClinicalProfile(req, patientId, req.body || {});
  if (!profile) return res.status(404).json({ error: "Patient not found." });
  res.json({ data: { clinicalProfile: profile } });
});

router.post("/api/core/patients/:id/allergies", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const patientId = req.params.id;

  if (useDatabase()) {
    const result = await clinicalDb.createAllergy(patientId, getScope(req), req.body || {});
    if (!result) return res.status(404).json({ error: "Patient not found." });
    if ("error" in result) return res.status(400).json(result);
    return res.status(201).json({ data: result });
  }

  const result = createInMemoryAllergy(req, patientId, req.body || {});
  if (result === null) return res.status(404).json({ error: "Patient not found." });
  if ("error" in result) return res.status(400).json(result);
  res.status(201).json({ data: result });
});

router.patch("/api/core/patients/:id/allergies/:allergyId", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const { id: patientId, allergyId } = req.params;

  if (useDatabase()) {
    const row = await clinicalDb.updateAllergy(patientId, allergyId, getScope(req), req.body || {});
    if (!row) return res.status(404).json({ error: "Allergy not found." });
    return res.json({ data: row });
  }

  const row = updateInMemoryAllergy(req, patientId, allergyId, req.body || {});
  if (!row) return res.status(404).json({ error: "Allergy not found." });
  res.json({ data: row });
});

router.delete("/api/core/patients/:id/allergies/:allergyId", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const { id: patientId, allergyId } = req.params;

  if (useDatabase()) {
    const ok = await clinicalDb.deleteAllergy(patientId, allergyId, getScope(req));
    if (!ok) return res.status(404).json({ error: "Allergy not found." });
    return res.json({ ok: true });
  }

  const ok = deleteInMemoryAllergy(req, patientId, allergyId);
  if (!ok) return res.status(404).json({ error: "Allergy not found." });
  res.json({ ok: true });
});

router.post("/api/core/patients/:id/problems", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const patientId = req.params.id;

  if (useDatabase()) {
    const result = await clinicalDb.createProblem(patientId, getScope(req), req.body || {});
    if (!result) return res.status(404).json({ error: "Patient not found." });
    if ("error" in result) return res.status(400).json(result);
    return res.status(201).json({ data: result });
  }

  const result = createInMemoryProblem(req, patientId, req.body || {});
  if (result === null) return res.status(404).json({ error: "Patient not found." });
  if ("error" in result) return res.status(400).json(result);
  res.status(201).json({ data: result });
});

router.patch("/api/core/patients/:id/problems/:problemId", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const { id: patientId, problemId } = req.params;

  if (useDatabase()) {
    const row = await clinicalDb.updateProblem(patientId, problemId, getScope(req), req.body || {});
    if (!row) return res.status(404).json({ error: "Problem not found." });
    return res.json({ data: row });
  }

  const row = updateInMemoryProblem(req, patientId, problemId, req.body || {});
  if (!row) return res.status(404).json({ error: "Problem not found." });
  res.json({ data: row });
});

router.delete("/api/core/patients/:id/problems/:problemId", async (req: Request, res: Response) => {
  if (denyUnlessClinicalManager(req, res)) return;
  const { id: patientId, problemId } = req.params;

  if (useDatabase()) {
    const ok = await clinicalDb.deleteProblem(patientId, problemId, getScope(req));
    if (!ok) return res.status(404).json({ error: "Problem not found." });
    return res.json({ ok: true });
  }

  const ok = deleteInMemoryProblem(req, patientId, problemId);
  if (!ok) return res.status(404).json({ error: "Problem not found." });
  res.json({ ok: true });
});

export default router;
