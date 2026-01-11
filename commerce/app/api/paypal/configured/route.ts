import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || process.env.EXPRESS_API_URL || "http://localhost:3000";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/integrations`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return NextResponse.json({ configured: false });
    }
    
    const data = await response.json();
    return NextResponse.json({ configured: data.paypalConfigured || false });
  } catch (error) {
    return NextResponse.json({ configured: false });
  }
}
