import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verificarAdmin(token: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = makeAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
  return profile?.is_admin ? user : null;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 500 });
  }

  const caller = await verificarAdmin(token);
  if (!caller) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 });

  const admin = makeAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const redirectTo = `${appUrl}/redefinir-senha`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  // Tenta enviar e-mail (pode falhar silenciosamente se email não configurado)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await anonClient.auth.resetPasswordForEmail(email, { redirectTo });

  const actionLink = linkData?.properties?.action_link ?? null;
  return NextResponse.json({ success: true, actionLink });
}
