import { NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = schema.parse(body);

    const user = await registerUser(email, password, name ?? "");
    await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role as "USER" | "ADMIN" });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
