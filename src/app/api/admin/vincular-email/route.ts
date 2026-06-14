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
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
  }

  const caller = await verificarAdmin(token);
  if (!caller) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json();
  const { profileId, email } = body;
  if (!profileId || !email) {
    return NextResponse.json({ error: 'profileId e email são obrigatórios' }, { status: 400 });
  }

  const admin = makeAdminClient();

  // Cria conta auth com o mesmo UUID do perfil — vincula automaticamente
  const { error: createError } = await admin.auth.admin.createUser({
    id: profileId,
    email,
    email_confirm: true,
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes('already') || msg.includes('duplicate') || msg.includes('exists')) {
      return NextResponse.json({ error: 'Este e-mail já está em uso por outra conta.' }, { status: 409 });
    }
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Atualiza o perfil para mensalista
  await admin.from('profiles').update({ tipo: 'mensalista', ativo: true }).eq('id', profileId);

  // Envia e-mail para o jogador definir a senha (link de redefinição)
  await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/perfil` },
  });

  // Dispara o envio do e-mail via cliente público (resetPasswordForEmail usa o template do Supabase)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await anonClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/perfil`,
  });

  return NextResponse.json({ success: true });
}
