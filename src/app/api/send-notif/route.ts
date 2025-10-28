import { NextRequest, NextResponse } from "next/server";
import { adminMessaging } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json();

    const message = {
      token,
      notification: {
        title: title || "Test Notification 🚀",
        body: body || "Push notif dari Next.js + Firebase Admin",
      },
    };

    const response = await adminMessaging.send(message);
    console.log("✅ FCM response:", response);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error sending notif:", error);
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}
