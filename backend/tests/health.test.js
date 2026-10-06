import request from "supertest";
import { createApp } from "../src/app.js";

describe("Health Check API", () => {
  test("GET /api/health should return 200 and ok=true", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});