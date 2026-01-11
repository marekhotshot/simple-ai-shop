import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'site_auth';
const COOKIE_VALUE = 'authenticated';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(COOKIE_NAME);

  if (authCookie?.value === COOKIE_VALUE) {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
