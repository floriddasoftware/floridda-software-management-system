import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (session?.user) {
      return Response.json({
        authenticated: true,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
      });
    }

    return Response.json({ authenticated: false });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json(
      {
        authenticated: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}