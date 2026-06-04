'use server';

import { createClient } from '@/src/lib/supabase-server';
import { headers, cookies } from 'next/headers';
import { createHash } from 'crypto';
import { db } from '@/src/db';
import { users, auditLogs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { trackEvent } from '@/utils/tracker';

function getDeterministicUserId(email: string): string {
  const lowerEmail = email.toLowerCase().trim();
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

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();

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
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, drizzleUser.id));
      }
    }

    if (!isPasswordValid) {
      return { error: 'Invalid credentials. Password incorrect.' };
    }

    const isUserAdmin = drizzleUser.isAdmin || (adminEmail ? lowerEmail === adminEmail : false);
    
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

    const userHeaders = await headers();
    await trackEvent({
      userId: drizzleUser.id,
      eventType: "USER_LOGIN",
      metadata: { email: lowerEmail },
      ipAddress: userHeaders.get('x-forwarded-for') || '127.0.0.1',
      userAgent: userHeaders.get('user-agent') || 'Unknown',
    });

    return { success: true };

  } catch (err: any) {
    console.error('[SignIn Error]', err);
    // Return the actual masked connection string to the client so we can see what Vercel is trying to use
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'MISSING_URL';
    const maskedUrl = dbUrl.replace(/:[^:]+@/, ':***@');
    return { error: `DB Error: ${err.message}. (Trying to connect to: ${maskedUrl})` };
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

    const userHeaders = await headers();
    await trackEvent({
      userId: newUser?.id || userId,
      eventType: "USER_SIGNUP",
      metadata: { email: lowerEmail },
      ipAddress: userHeaders.get('x-forwarded-for') || '127.0.0.1',
      userAgent: userHeaders.get('user-agent') || 'Unknown',
    });

    return { success: true };
  } catch (err: any) {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'MISSING_URL';
    const maskedUrl = dbUrl.replace(/:[^:]+@/, ':***@');
    return { error: `DB Error: ${err.message}. (Trying to connect to: ${maskedUrl})` };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  const localUser = cookieStore.get('velox-local-user')?.value;
  let userId = "";
  if (localUser) {
    try {
      const parsed = JSON.parse(decodeURIComponent(localUser));
      userId = parsed.id;
    } catch {}
  }
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  cookieStore.set('velox-local-user', '', { path: '/', maxAge: 0 });
  if (userId) {
    await trackEvent({
      userId,
      eventType: "USER_LOGOUT"
    });
  }
  return { success: true };
}
