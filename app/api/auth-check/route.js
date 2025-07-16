import { auth } from "@/auth";

export async function GET(request) {
  const session = await auth();
  console.log(`Auth-check session: ${JSON.stringify(session)}`);

  if (session?.user) {
    return new Response(
      JSON.stringify({
        authenticated: true,
        role: session.user.role,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ authenticated: false }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}