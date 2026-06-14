import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { data: callerProfile } = await anonClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!callerProfile?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json();
  const { profileId, email } = body;

  if (!profileId || !email) {
    return NextResponse.json({ error: 'profileId e email são obrigatórios' }, { status: 400 });
  }

  // Cria conta auth com o mesmo UUID do perfil existente — vincula automaticamente
  const { error: createError } = await adminClient.auth.admin.createUser({
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

  // Atualiza tipo para mensalista e garante que o perfil está ativo
  await adminClient
    .from('profiles')
    .update({ tipo: 'mensalista', ativo: true })
    .eq('id', profileId);

  // Envia e-mail para o jogador definir a senha
  await anonClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/perfil`,
  });

  return NextResponse.json({ success: true });
}
