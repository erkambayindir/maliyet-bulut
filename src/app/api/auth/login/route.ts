import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role as "USER" | "ADMIN" });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch {
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 400 });
  }
}
