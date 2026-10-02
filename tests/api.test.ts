import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

import app from '../app';
import User from '../models/User';
import Salon from '../models/Salon';
import Service from '../models/Service';
import Booking from '../models/Booking';

dotenv.config({ path: '.env.test' });

const api = request(app);

const password = 'TestPassword@123';

let testEmail: string;
let testUserId: string;
let testToken: string;
let salonId: string;
let serviceId: string;
let stylistId: string;
let secondUserId: string;
let secondUserToken: string;
let bookingId: string;

beforeAll(async () => {
    await mongoose.connect(
        process.env.MONGO_URI ||
        'mongodb://localhost:27017/salon-db-test'
    );

    const unique = Date.now();

    testEmail = `jest-test-${unique}@example.com`;

    const salon = await Salon.create({
        name: `Jest Test Salon ${unique}`,
        location: 'Test Location',
        openTime: '09:00',
        closeTime: '18:00'
    });

    salonId = salon._id.toString();

    const service = await Service.create({
        name: `Jest Test Service ${unique}`,
        duration: 30,
        price: 25,
        salonId: salon._id
    });

    serviceId = service._id.toString();

    const hashedPassword = await bcrypt.hash(
        'StylistPassword@123',
        10
    );

    const stylist = await User.create({
        name: `Jest Test Stylist ${unique}`,
        email: `jest-stylist-${unique}@example.com`,
        password: hashedPassword,
        role: 'stylist'
    });

    stylistId = stylist._id.toString();
    const secondUserPassword = 'SecondUserPassword@123';

    const secondUser = await User.create({
        name: `Jest Second User ${unique}`,
        email: `jest-second-user-${unique}@example.com`,
        password: await bcrypt.hash(secondUserPassword, 10),
        role: 'customer'
    });

    secondUserId = secondUser._id.toString();

    const secondLoginResponse = await api
        .post('/api/login')
        .send({
            email: `jest-second-user-${unique}@example.com`,
            password: secondUserPassword
        });

    expect(secondLoginResponse.status).toBe(200);

    secondUserToken = secondLoginResponse.body.token;
});

afterAll(async () => {
    await Booking.deleteMany({
        salonId
    });

    if (testUserId) {
        await User.deleteOne({
            _id: testUserId
        });
    }

    if (secondUserId) {
        await User.deleteOne({
            _id: secondUserId
        });
    }

    if (stylistId) {
        await User.deleteOne({
            _id: stylistId
        });
    }

    if (serviceId) {
        await Service.deleteOne({
            _id: serviceId
        });
    }

    if (salonId) {
        await Salon.deleteOne({
            _id: salonId
        });
    }

    await mongoose.disconnect();
});

describe('Authentication API', () => {

    test('should register a new customer successfully', async () => {
        const response = await api
            .post('/api/register')
            .send({
                name: 'Jest Test User',
                email: testEmail,
                password
            });

        expect(response.status).toBe(201);

        expect(response.body).toEqual({
            message: 'User registered successfully'
        });

        const user = await User.findOne({
            email: testEmail
        });

        expect(user).not.toBeNull();

        testUserId = user!._id.toString();

        expect(user!.email).toBe(testEmail);
        expect(user!.role).toBe('customer');
    });

    test('should reject duplicate email registration', async () => {
        const response = await api
            .post('/api/register')
            .send({
                name: 'Another User',
                email: testEmail,
                password
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'Email already in use'
        });
    });

    test('should login successfully with valid credentials', async () => {
        const response = await api
            .post('/api/login')
            .send({
                email: testEmail,
                password
            });

        expect(response.status).toBe(200);

        expect(response.body.token).toEqual(
            expect.any(String)
        );

        expect(response.body.role).toBe('customer');

        expect(response.body.userId).toBe(testUserId);

        testToken = response.body.token;

        expect(testToken).toBeTruthy();
    });

    test('should reject login with incorrect password', async () => {
        const response = await api
            .post('/api/login')
            .send({
                email: testEmail,
                password: 'WrongPassword@123'
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'Invalid credentials'
        });
    });

    test('should reject login for an unknown user', async () => {
        const response = await api
            .post('/api/login')
            .send({
                email: 'unknown-user@example.com',
                password
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'Invalid credentials'
        });
    });
});

describe('Available Slots API', () => {

    test('should return available slots for a valid salon and service', async () => {
        const date = '2030-01-15';

        const response = await api
            .get(`/api/salons/${salonId}/available-slots`)
            .query({
                date,
                serviceId
            });

        expect(response.status).toBe(200);

        expect(response.body.date).toBe(date);
        expect(response.body.duration).toBe(30);

        expect(response.body.service).toContain(
            'Jest Test Service'
        );

        expect(
            Array.isArray(response.body.availableSlots)
        ).toBe(true);

        const matchingSlot =
            response.body.availableSlots.find(
                (slot: {
                    time: string;
                    stylistId: string;
                    stylistName: string;
                }) =>
                    slot.stylistId === stylistId &&
                    slot.time === '09:00'
            );

        expect(matchingSlot).toBeDefined();
    });

    test('should reject request when date is missing', async () => {
        const response = await api
            .get(`/api/salons/${salonId}/available-slots`)
            .query({
                serviceId
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'date and serviceId are required'
        });
    });

    test('should reject request when serviceId is missing', async () => {
        const response = await api
            .get(`/api/salons/${salonId}/available-slots`)
            .query({
                date: '2030-01-16'
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'date and serviceId are required'
        });
    });

    test('should return 404 for a nonexistent salon or service', async () => {
        const fakeSalonId =
            new Types.ObjectId().toString();

        const response = await api
            .get(
                `/api/salons/${fakeSalonId}/available-slots`
            )
            .query({
                date: '2030-01-17',
                serviceId
            });

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            error: 'Salon or Service not found'
        });
    });
});

describe('Booking API', () => {

    test('should create a booking successfully with valid authentication', async () => {
        const response = await api
            .post('/api/bookings')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                salonId,
                stylistId,
                serviceId,
                slotTime: '10:00',
                date: '2030-01-20'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Booking created successfully');
        expect(response.body.booking).toBeDefined();

        bookingId = response.body.booking._id;

        expect(response.body.booking.salonId).toBe(salonId);
        expect(response.body.booking.stylistId).toBe(stylistId);
        expect(response.body.booking.serviceId).toBe(serviceId);
        expect(response.body.booking.startTime).toBe('10:00');
        expect(response.body.booking.endTime).toBe('10:30');
        expect(response.body.booking.status).toBe('booked');
        expect(response.body.booking.customerId).toBe(testUserId);
    });

    test('should reject booking without authentication', async () => {
        const response = await api
            .post('/api/bookings')
            .send({
                salonId,
                stylistId,
                serviceId,
                slotTime: '11:00',
                date: '2030-01-20'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Authentication required'
        });
    });

    test('should reject booking with invalid token', async () => {
        const response = await api
            .post('/api/bookings')
            .set('Authorization', 'Bearer invalid-token')
            .send({
                salonId,
                stylistId,
                serviceId,
                slotTime: '11:00',
                date: '2030-01-20'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Invalid token'
        });
    });

    test('should reject booking when date is missing', async () => {
        const response = await api
            .post('/api/bookings')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                salonId,
                stylistId,
                serviceId,
                slotTime: '12:00'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'date is required'
        });
    });

    test('should reject booking for a nonexistent service', async () => {
        const fakeServiceId = new Types.ObjectId().toString();

        const response = await api
            .post('/api/bookings')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                salonId,
                stylistId,
                serviceId: fakeServiceId,
                slotTime: '13:00',
                date: '2030-01-20'
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Service not found'
        });
    });

    test('should reject overlapping booking for the same stylist', async () => {
        const response = await api
            .post('/api/bookings')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                salonId,
                stylistId,
                serviceId,
                slotTime: '10:15',
                date: '2030-01-20'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Time slot is no longer available'
        });
    });
});

describe('Booking Cancellation API', () => {
  test('should reject cancellation by another customer', async () => {
    const response = await api
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Not authorized to cancel this booking'
    });
  });

  test('should allow the booking owner to cancel the booking', async () => {
    const response = await api
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Booking cancelled successfully'
    });

    const booking = await Booking.findById(bookingId);

    expect(booking).not.toBeNull();
    expect(booking!.status).toBe('cancelled');
  });

  test('should reject cancellation of an already cancelled booking', async () => {
    const response = await api
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Booking is already cancelled'
    });
  });

  test('should return 404 for a nonexistent booking', async () => {
    const fakeBookingId = new Types.ObjectId().toString();

    const response = await api
      .post(`/api/bookings/${fakeBookingId}/cancel`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Booking not found'
    });
  });

  test('should reject cancellation without authentication', async () => {
    const fakeBookingId = new Types.ObjectId().toString();

    const response = await api
      .post(`/api/bookings/${fakeBookingId}/cancel`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required'
    });
  });
});

describe('Complete E2E Booking Flow', () => {
  test('should register, login, book a service and cancel the booking', async () => {
    const unique = Date.now();

    const email = `e2e-user-${unique}@example.com`;
    const password = 'E2EPassword@123';

    // 1. Register
    const registerResponse = await api
      .post('/api/register')
      .send({
        name: 'E2E Test User',
        email,
        password
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toEqual({
      message: 'User registered successfully'
    });

    // 2. Login
    const loginResponse = await api
      .post('/api/login')
      .send({
        email,
        password
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toEqual(expect.any(String));
    expect(loginResponse.body.role).toBe('customer');

    const e2eToken = loginResponse.body.token;

    // 3. Create booking
    const bookingResponse = await api
      .post('/api/bookings')
      .set('Authorization', `Bearer ${e2eToken}`)
      .send({
        salonId,
        stylistId,
        serviceId,
        slotTime: '11:00',
        date: '2030-01-21'
      });

    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.message).toBe(
      'Booking created successfully'
    );

    const e2eBookingId = bookingResponse.body.booking._id;

    expect(e2eBookingId).toEqual(expect.any(String));
    expect(bookingResponse.body.booking.status).toBe('booked');

    // 4. Cancel booking
    const cancelResponse = await api
      .post(`/api/bookings/${e2eBookingId}/cancel`)
      .set('Authorization', `Bearer ${e2eToken}`);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body).toEqual({
      message: 'Booking cancelled successfully'
    });

    // 5. Verify cancellation in database
    const cancelledBooking = await Booking.findById(e2eBookingId);

    expect(cancelledBooking).not.toBeNull();
    expect(cancelledBooking!.status).toBe('cancelled');

    // Cleanup E2E user
    await User.deleteOne({ email });
  });
});
