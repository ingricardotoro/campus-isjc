import { NextResponse, type NextRequest } from "next/server";
import { resolveAdmissionsRole } from "@/lib/admissions/admin-access";
import { isEvaluationAdmin } from "@/lib/evaluacion-docente/admin-access";
import { updateSession } from "@/lib/supabase/middleware";

const ADMISSIONS_ADMIN_PAGES = "/admisiones-admin";
const ADMISSIONS_ADMIN_API = "/api/admisiones-admin";

/** Matches by whole path segment, so "/admisiones-admin" never covers "/admisiones-admin-x". */
function isWithin(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/** Only this branch looks up a role, so public traffic gets no extra query. */
async function guardAdmissionsAdmin(request: NextRequest, isApi: boolean) {
  const { response, user, supabase } = await updateSession(request);

  const deny = (status: 401 | 403, error: string) => {
    const denied = isApi
      ? NextResponse.json({ error }, { status })
      : NextResponse.redirect(new URL(`${ADMISSIONS_ADMIN_PAGES}/login`, request.url));

    // updateSession may have rotated the session tokens; dropping them would break the user's session.
    response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
    return denied;
  };

  if (!user) return deny(401, "No autenticado");
  if (!(await resolveAdmissionsRole(supabase))) return deny(403, "No autorizado");

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdmissionsApi = isWithin(pathname, ADMISSIONS_ADMIN_API);
  if (isAdmissionsApi || isWithin(pathname, ADMISSIONS_ADMIN_PAGES)) {
    const isLogin =
      pathname === `${ADMISSIONS_ADMIN_PAGES}/login` || pathname === `${ADMISSIONS_ADMIN_API}/login`;
    return isLogin ? NextResponse.next() : guardAdmissionsAdmin(request, isAdmissionsApi);
  }

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

  if (!isEvaluationAdmin(user)) {
    const denied = isAdminApi
      ? NextResponse.json({ error: "No autorizado" }, { status: 403 })
      : NextResponse.redirect(new URL("/evaluacion-docente-admin/login", request.url));

    // updateSession may have rotated the session tokens; dropping them would break the user's session.
    response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
    return denied;
  }

  return response;
}

export const config = {
  matcher: [
    "/evaluacion-docente-admin/:path*",
    "/api/evaluacion-docente-admin/:path*",
    "/admisiones-admin/:path*",
    "/api/admisiones-admin/:path*",
  ],
};
