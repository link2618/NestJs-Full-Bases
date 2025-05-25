import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../../../src/app.module';
import { User } from '../../../src/auth/entities/user.entity';

import { validate } from 'uuid';

const testingUser = {
    email: 'testing.user@google.com',
    password: 'Abc12345',
    fullName: 'Testing user',
};

const testingAdminUser = {
    email: 'testing.admin@google.com',
    password: 'Abc12345',
    fullName: 'Testing admin',
};

describe('AuthModule Private (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    let token: string;
    let adminToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        await app.init();

        userRepository = app.get<Repository<User>>(getRepositoryToken(User));
        await userRepository.delete({ email: testingUser.email });
        await userRepository.delete({ email: testingAdminUser.email });

        const responseUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testingUser);

        const responseAdminUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testingAdminUser);

        await userRepository.update(
            { email: testingAdminUser.email },
            { roles: ['admin', 'super-user'] },
        );

        token = responseUser.body.token;
        adminToken = responseAdminUser.body.token;
    });

    afterAll(async () => {
        await userRepository.delete({ email: testingUser.email });
        await userRepository.delete({ email: testingAdminUser.email });
        await app.close();
    });

    it('should return 401 if no token is provided', async () => {
        const response = await request(app.getHttpServer())
        .get('/auth/private')
        .send();

        expect(response.status).toBe(401);
    });

    it('should return new token and user if token is provided', async () => {
        await new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 1000);
        });

        const response = await request(app.getHttpServer())
        .get('/auth/check-status')
        .set('Authorization', `Bearer ${token}`);

        const responseToken = response.body.token;

        expect(response.status).toBe(200);
        expect(responseToken).not.toBe(token);
    });

    it('should return custom object if token is valid', async () => {
        const response = await request(app.getHttpServer())
        .get('/auth/private')
        .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            ok: true,
            message: 'Success Private',
            user: {
                id: expect.any(String),
                email: testingUser.email,
                fullName: testingUser.fullName,
                isActive: true,
                roles: ['user'],
            },
            userEmail: testingUser.email,
            rawHeaders: expect.any(Array),
            headers: expect.any(Object),
        });
    });

    it('should return 403 if admin token is provided', async () => {
        const response = await request(app.getHttpServer())
        .get('/auth/private3')
        .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
    });

    it('should return user if admin token is provided', async () => {
        const response = await request(app.getHttpServer())
        .get('/auth/private3')
        .set('Authorization', `Bearer ${adminToken}`);

        const userId = response.body.user.id;

        expect(validate(userId)).toBe(true);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            ok: true,
            user: {
                id: expect.any(String),
                email: testingAdminUser.email,
                fullName: testingAdminUser.fullName,
                isActive: true,
                roles: ['admin', 'super-user'],
            },
        });
    });
});