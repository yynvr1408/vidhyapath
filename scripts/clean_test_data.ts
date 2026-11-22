import { getPool } from '../server/db/neon.js';
import { dataStore } from '../server/db/store.js';

async function main() {
  const pool = getPool();
  if (!pool) {
    console.error('Neon DB pool not available.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all transactional and mock records
    await client.query('DELETE FROM assignment_submissions');
    await client.query('DELETE FROM assignments');
    await client.query('DELETE FROM quiz_attempts');
    await client.query('DELETE FROM quizzes');
    await client.query('DELETE FROM learning_resources');
    await client.query('DELETE FROM subjects');
    await client.query('DELETE FROM programmes');
    await client.query('DELETE FROM departments');
    await client.query('DELETE FROM academic_years');
    await client.query('DELETE FROM institutions');
    await client.query('DELETE FROM family_members');
    await client.query('DELETE FROM guardianships');
    await client.query('DELETE FROM families');
    await client.query('DELETE FROM course_enrollments');
    await client.query('DELETE FROM ai_messages');
    await client.query('DELETE FROM ai_conversations');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM announcements');
    await client.query('DELETE FROM otp_verifications');

    // 2. Delete all non-admin users
    await client.query("DELETE FROM users WHERE role != 'super_admin'");

    // 3. Ensure Platform Super Administrator exists with known production credentials
    const pwd = dataStore.hashPassword('SuperAdmin@2026');
    const existingAdmin = await client.query("SELECT id FROM users WHERE role = 'super_admin'");

    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, role, full_name, email, phone, password_hash, salt, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'user_super_admin',
          'super_admin',
          'Platform Super Administrator',
          'admin@vidyapath.edu',
          '+91-98765-00001',
          pwd.hash,
          pwd.salt,
          'active',
          Date.now(),
        ]
      );
    } else {
      await client.query(
        `UPDATE users
         SET password_hash = $1, salt = $2, full_name = 'Platform Super Administrator', email = 'admin@vidyapath.edu', status = 'active'
         WHERE role = 'super_admin'`,
        [pwd.hash, pwd.salt]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Neon PostgreSQL successfully cleaned! All mock/test data removed.');

    const remainingUsers = await client.query('SELECT id, role, email, full_name FROM users');
    console.log('Active Users in Database:', remainingUsers.rows);

    const remainingInsts = await client.query('SELECT id, name FROM institutions');
    console.log('Active Institutions in Database:', remainingInsts.rows);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
