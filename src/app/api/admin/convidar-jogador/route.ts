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
  const { email, nome, apelido, telefone, posicao } = body;
  if (!email || !nome || !posicao) {
    return NextResponse.json({ error: 'email, nome e posicao são obrigatórios' }, { status: 400 });
  }

  const admin = makeAdminClient();

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome, telefone: telefone || null },
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  const { error: profileError } = await admin.from('profiles').upsert({
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
