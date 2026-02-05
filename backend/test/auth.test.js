const request = require('supertest');
const app = require('../server'); // Assuming app exported from server.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Multi-tenancy Isolation', () => {
    let tokenA, orgA_Id;

    it('should create separate organizations for separate registrations', async () => {
        // Register User A
        const resA = await request(app).post('/api/auth/register').send({
            firstName: 'Alice', lastName: 'Admin', email: 'alice@corp.com',
            password: 'password123', companyName: 'Corp A'
        });
        expect(resA.status).toBe(201);
        orgA_Id = resA.body.user.organizationId;
        tokenA = resA.body.token;

        // Register User B
        const resB = await request(app).post('/api/auth/register').send({
            firstName: 'Bob', lastName: 'Builder', email: 'bob@build.com',
            password: 'password123', companyName: 'Corp B'
        });
        expect(resB.status).toBe(201);
        const orgB_Id = resB.body.user.organizationId;

        // CRITICAL CHECK: Orgs must be different
        expect(orgA_Id).not.toEqual(orgB_Id);
    });

    it('should not allow User B to see User A employees', async () => {
        // Create employee for A
        await request(app).post('/api/employees')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ firstName: 'Emp', lastName: 'A', email: 'emp@a.com', role: 'Frontend Dev', department: 'Engineering', salary: 50000 });

        // Register User C (Attacker)
        const resC = await request(app).post('/api/auth/register').send({
            firstName: 'Charlie', lastName: 'Hacker', email: 'charlie@hack.com',
            password: 'password123', companyName: 'Evil Corp'
        });
        const tokenC = resC.body.token;

        // Attempt to list employees as C
        const listRes = await request(app).get('/api/employees')
            .set('Authorization', `Bearer ${tokenC}`);
        
        expect(listRes.status).toBe(200);
        // Should only see themselves (since registration makes them an employee) or empty
        // Definitely NOT Emp A
        const names = listRes.body.data.employees.map(e => e.firstName);
        expect(names).not.toContain('Emp');
    });
});