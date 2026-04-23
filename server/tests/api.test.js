const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { createApp } = require("../app");

const User = require("../models/User");
const Task = require("../models/Task");
const Tenant = require("../models/Tenant");

let mongoServer;
let app;

async function registerAndLogin({
    tenantName,
    name,
    account,
    password
}) {
    const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({ tenantName, name, account, password });

    assert.equal(registerResponse.statusCode, 201);

    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ account, password });

    assert.equal(loginResponse.statusCode, 200);

    return {
        token: loginResponse.body.token,
        user: loginResponse.body.user
    };
}

test.before(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.CLIENT_ORIGIN = "*";

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

test.after(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

test.beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Task.deleteMany({}),
        Tenant.deleteMany({})
    ]);
});

test("health endpoint responds successfully", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
        success: true,
        message: "Server is running."
    });
});

test("register creates tenant and user, then login/me work", async () => {
    const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
            tenantName: "Team Alpha",
            name: "Alice",
            account: "alice",
            password: "secret123"
        });

    assert.equal(registerResponse.statusCode, 201);
    assert.equal(registerResponse.body.user.account, "alice");

    assert.equal(await Tenant.countDocuments(), 1);
    assert.equal(await User.countDocuments(), 1);

    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            account: "alice",
            password: "secret123"
        });

    assert.equal(loginResponse.statusCode, 200);
    assert.ok(loginResponse.body.token);

    const meResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

    assert.equal(meResponse.statusCode, 200);
    assert.equal(meResponse.body.user.account, "alice");
    assert.equal(meResponse.body.user.name, "Alice");
});

test("task CRUD works for an authenticated user", async () => {
    const { token } = await registerAndLogin({
        tenantName: "Team Beta",
        name: "Bob",
        account: "bob",
        password: "secret123"
    });

    const createResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Create API tests",
            description: "Verify CRUD behavior",
            priority: "high",
            status: "pending",
            date: "2026-04-30"
        });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.body.data.title, "Create API tests");

    const taskId = createResponse.body.data.id;

    const listResponse = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.data.length, 1);
    assert.equal(listResponse.body.data[0].id, taskId);

    const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "completed",
            title: "Create API integration tests"
        });

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.data.status, "completed");
    assert.equal(updateResponse.body.data.title, "Create API integration tests");

    const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`);

    assert.equal(deleteResponse.statusCode, 200);
    assert.equal(deleteResponse.body.success, true);

    const afterDeleteList = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(afterDeleteList.body.data.length, 0);
});

test("task routes enforce authentication", async () => {
    const response = await request(app).get("/api/tasks");

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.success, false);
});

test("tenant isolation prevents cross-tenant access", async () => {
    const firstTenant = await registerAndLogin({
        tenantName: "Tenant One",
        name: "Admin One",
        account: "tenant1-admin",
        password: "secret123"
    });

    const secondTenant = await registerAndLogin({
        tenantName: "Tenant Two",
        name: "Admin Two",
        account: "tenant2-admin",
        password: "secret123"
    });

    const createResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${firstTenant.token}`)
        .send({
            title: "Tenant One Task",
            description: "Private data",
            priority: "medium",
            status: "pending",
            date: "2026-05-01"
        });

    assert.equal(createResponse.statusCode, 201);
    const taskId = createResponse.body.data.id;

    const outsiderList = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${secondTenant.token}`);

    assert.equal(outsiderList.statusCode, 200);
    assert.equal(outsiderList.body.data.length, 0);

    const outsiderUpdate = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${secondTenant.token}`)
        .send({ status: "completed" });

    assert.equal(outsiderUpdate.statusCode, 404);

    const outsiderDelete = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${secondTenant.token}`);

    assert.equal(outsiderDelete.statusCode, 404);
});

test("register/login validation and duplicate account checks work", async () => {
    const missingRegisterFields = await request(app)
        .post("/api/auth/register")
        .send({
            tenantName: "Missing Fields"
        });

    assert.equal(missingRegisterFields.statusCode, 400);

    await registerAndLogin({
        tenantName: "Team Gamma",
        name: "Carol",
        account: "carol",
        password: "secret123"
    });

    const duplicateAccount = await request(app)
        .post("/api/auth/register")
        .send({
            tenantName: "Another Tenant",
            name: "Carol Two",
            account: "carol",
            password: "another-secret"
        });

    assert.equal(duplicateAccount.statusCode, 409);

    const wrongPassword = await request(app)
        .post("/api/auth/login")
        .send({
            account: "carol",
            password: "wrong-password"
        });

    assert.equal(wrongPassword.statusCode, 401);
});
