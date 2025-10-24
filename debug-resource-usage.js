#!/usr/bin/env node

/**
 * Debug script to test resource usage collection
 * Run this to verify if the system information library is working correctly
 */

import * as si from 'systeminformation';

async function testResourceCollection() {
  console.log('Testing resource usage collection...\n');

  try {
    console.log('1. Testing CPU usage...');
    const cpuData = await si.currentLoad();
    console.log('CPU Data:', {
      avgLoad: cpuData.avgLoad,
      currentLoad: cpuData.currentLoad,
      currentLoadUser: cpuData.currentLoadUser,
      currentLoadSystem: cpuData.currentLoadSystem,
    });

    console.log('\n2. Testing Memory usage...');
    const memData = await si.mem();
    console.log('Memory Data:', {
      total: Math.round(memData.total / 1024 / 1024) + ' MB',
      used: Math.round(memData.active / 1024 / 1024) + ' MB',
      free: Math.round(memData.free / 1024 / 1024) + ' MB',
      available: Math.round(memData.available / 1024 / 1024) + ' MB',
    });

    console.log('\n3. Testing Disk usage...');
    const diskData = await si.fsSize();
    console.log(
      'Disk Data:',
      diskData.map((disk) => ({
        mount: disk.mount,
        size: Math.round(disk.size / 1024 / 1024) + ' MB',
        used: Math.round(disk.used / 1024 / 1024) + ' MB',
        available: Math.round(disk.available / 1024 / 1024) + ' MB',
      }))
    );

    console.log('\n✅ All tests passed! Resource usage collection is working correctly.');
  } catch (error) {
    console.error('❌ Error during resource collection test:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);

    // Check if it's a permission issue
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      console.log(
        '\n💡 This might be a permission issue. Try running with sudo or check file permissions.'
      );
    }

    // Check if it's a system compatibility issue
    if (error.message.includes('not supported') || error.message.includes('unsupported')) {
      console.log(
        '\n💡 This might be a system compatibility issue. Check if systeminformation supports your OS.'
      );
    }
  }
}

// Test Redis connection
async function testRedisConnection() {
  console.log('\n4. Testing Redis connection...');

  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    });

    await redis.ping();
    console.log('✅ Redis connection successful!');
    await redis.disconnect();
  } catch (error) {
    console.error('❌ Redis connection failed:');
    console.error('Error message:', error.message);
    console.error('Make sure Redis is running and accessible.');
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n5. Testing Database connection...');

  try {
    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config();

    const { default: mysql } = await import('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await connection.execute('SELECT 1');
    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Make sure MySQL is running and credentials are correct.');
  }
}

async function runAllTests() {
  await testResourceCollection();
  await testRedisConnection();
  await testDatabaseConnection();

  console.log('\n🔍 Debug test completed. Check the results above for any issues.');
}

runAllTests().catch(console.error);
