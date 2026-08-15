import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminLogin =
    pathname === "/evaluacion-docente-admin/login" ||
    pathname === "/api/evaluacion-docente-admin/login";
  const isAdminPage = pathname.startsWith("/evaluacion-docente-admin") && !isAdminLogin;
  const isAdminApi = pathname.startsWith("/api/evaluacion-docente-admin") && !isAdminLogin;

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/evaluacion-docente-admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/evaluacion-docente-admin/:path*", "/api/evaluacion-docente-admin/:path*"],
};
