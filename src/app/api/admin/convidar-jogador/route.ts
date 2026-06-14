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

  const { data: profile } = await anonClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json();
  const { email, nome, apelido, telefone, posicao } = body;

  if (!email || !nome || !posicao) {
    return NextResponse.json({ error: 'email, nome e posicao são obrigatórios' }, { status: 400 });
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { nome, telefone: telefone || null },
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: inviteData.user.id,
      nome,
      apelido: apelido || null,
      telefone: telefone || null,
      posicao,
      tipo: 'mensalista',
      nivel: 3,
      is_admin: false,
      ativo: true,
      push_token: null,
    });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
