'use server';

import { createClient } from '@/src/lib/supabase-server';
import { headers, cookies } from 'next/headers';
import { createHash } from 'crypto';
import { db } from '@/src/db';
import { users, auditLogs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function getDeterministicUserId(email: string): string {
  const lowerEmail = email.toLowerCase().trim();
  if (lowerEmail === 'idowuisdaniel1@gmail.com' || lowerEmail === 'admin@velox.com' || lowerEmail === 'daniel@velox.com') {
    return 'usr_6wshej3ht';
  }
  const hash = createHash('sha256').update(lowerEmail).digest('hex').substring(0, 12);
  return `usr_${hash}`;
}

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const cookieStore = await cookies();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const lowerEmail = email.toLowerCase().trim();

  // Admin bypass
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'idowuisdaniel1@gmail.com').toLowerCase().trim();
  const isAdminBypass = lowerEmail === adminEmail || lowerEmail === 'idowuisdaniel1@gmail.com' || lowerEmail === 'admin@velox.com' || lowerEmail === 'daniel@velox.com';

  if (isAdminBypass) {
    // Attempt remote upsert
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const existingRemoteUser = await db.query.users.findFirst({
        where: eq(users.email, lowerEmail),
      });

      if (existingRemoteUser) {
        await db.update(users)
          .set({ password: hashedPassword, isAdmin: true })
          .where(eq(users.id, existingRemoteUser.id));
      } else {
        await db.insert(users).values({
          id: 'usr_6wshej3ht',
          email: lowerEmail,
          name: 'Idowu Daniel',
          password: hashedPassword,
          isAdmin: true
        });
      }
    } catch (err: any) {
      console.warn(`[Admin Bypass] Database issue, allowing login anyway:`, err.message);
    }

    cookieStore.set('velox-local-user', encodeURIComponent(JSON.stringify({
      id: 'usr_6wshej3ht',
      email: lowerEmail,
      name: 'Idowu Daniel',
      isAdmin: true
    })), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    await logAuditEvent('usr_6wshej3ht', 'USER_LOGIN', lowerEmail);
    return { success: true };
  }

  try {
    const drizzleUser = await db.query.users.findFirst({
      where: eq(users.email, lowerEmail),
    });

    if (!drizzleUser) {
      return { error: 'Invalid credentials. User not found.' };
    }

    if (!drizzleUser.password) {
      return { error: 'Invalid credentials.' };
    }

    let isPasswordValid = false;
    if (drizzleUser.password.startsWith('$2a$') || drizzleUser.password.startsWith('$2b$') || drizzleUser.password.length > 30) {
      isPasswordValid = await bcrypt.compare(password, drizzleUser.password);
    } else {
      isPasswordValid = drizzleUser.password === password;
      if (isPasswordValid) {
        // Auto-upgrade plain-text passwords to secure Bcrypt hashes
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, drizzleUser.id));
      }
    }

    if (!isPasswordValid) {
      return { error: 'Invalid credentials. Password incorrect.' };
    }

    const isUserAdmin = drizzleUser.isAdmin || lowerEmail === 'idowuisdaniel1@gmail.com' || (adminEmail ? lowerEmail === adminEmail : false);
    
    cookieStore.set('velox-local-user', encodeURIComponent(JSON.stringify({
      id: drizzleUser.id,
      email: lowerEmail,
      name: drizzleUser.name || lowerEmail.split('@')[0],
      isAdmin: isUserAdmin
    })), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    await logAuditEvent(drizzleUser.id, 'USER_LOGIN', lowerEmail);
    return { success: true };

  } catch (err: any) {
    console.error('[SignIn Error]', err);
    return { error: `Database error: ${err.message}` };
  }
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const lowerEmail = email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
  const isAdmin = adminEmail ? lowerEmail === adminEmail : false;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = getDeterministicUserId(lowerEmail);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, lowerEmail)
    });

    let newUser;
    if (existingUser) {
      return { error: 'User already exists. Please sign in.' };
    } else {
      const inserted = await db.insert(users).values({
        id: userId,
        email: lowerEmail,
        name: lowerEmail.split('@')[0],
        password: hashedPassword,
        isAdmin: isAdmin,
      }).returning();
      newUser = inserted[0];
    }

    const cookieStore = await cookies();
    cookieStore.set('velox-local-user', encodeURIComponent(JSON.stringify({
      id: newUser?.id || userId,
      email: lowerEmail,
      name: lowerEmail.split('@')[0],
      isAdmin: isAdmin || (adminEmail ? lowerEmail === adminEmail : false)
    })), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    await logAuditEvent(newUser?.id || userId, 'USER_SIGNUP', lowerEmail);

    return { success: true };
  } catch (err: any) {
    console.error('[Signup Action Error]:', err);
    return { error: `Database error: ${err.message}` };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('velox-local-user')?.value;
  if (userCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      if (parsed && parsed.id && parsed.email) {
        await logAuditEvent(parsed.id, 'USER_SIGNOUT', parsed.email);
      }
    } catch (e) {
      console.warn('Failed to parse user cookie for signout audit:', e);
    }
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  cookieStore.set('velox-local-user', '', { path: '/', maxAge: 0 });
  return { success: true };
}

/**
 * Creates a secure, non-blocking audit log event in the database for logins or signups
 */
async function logAuditEvent(userId: string, eventType: string, email: string) {
  try {
    const reqHeaders = await headers();
    const clientIp = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'unknown';
    const userAgent = reqHeaders.get('user-agent') || 'unknown';
    
    await db.insert(auditLogs).values({
      userId,
      eventType,
      entityType: 'user',
      entityId: userId,
      changes: { email },
      ipAddress: clientIp,
      userAgent,
      metadata: { action: eventType, email, timestamp: new Date().toISOString() }
    });
    console.log(`[Audit Log] Successfully recorded ${eventType} for user ${email}`);
  } catch (err) {
    console.warn(`[Audit Log Bypass] Non-blocking: Failed to log ${eventType} event:`, err);
  }
}
