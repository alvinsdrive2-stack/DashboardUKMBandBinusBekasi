import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
  authDomain: "ukm-band-dashboard.firebaseapp.com",
  projectId: "ukm-band-dashboard",
  storageBucket: "ukm-band-dashboard.firebasestorage.app",
  messagingSenderId: "317047973293",
  appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
  measurementId: "G-EKGK8JCEQJ",
};

const app = initializeApp(firebaseConfig);

// Initialize messaging only on client side
let messaging: any = null;

if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Firebase Messaging not supported:', error);
  }
}

export { messaging };

export const requestForToken = async () => {
  try {
    // Check if running on client side and messaging is available
    if (typeof window === 'undefined' || !messaging) {
      console.warn("⚠️ Firebase Messaging not available");
      return null;
    }

    console.log("🟡 Meminta izin notifikasi...");
    const permission = await Notification.requestPermission();
    console.log("🔹 Status izin:", permission);

    if (permission !== "granted") {
      console.warn("⚠️ Notifikasi tidak diizinkan");
      return null;
    }

    console.log("🔥 Mengambil FCM token...");
    const token = await getToken(messaging, {
      vapidKey: "BCDSpLWsXp4PW6EnzHORbs4T6UVFYtNEjQLXHKOLBsXzVzmo1h4XmEHsTtI2T-57MvacNkMYyTmyKOd_PVwzWzk",
    });
    console.log("✅ Token didapat:", token);
    return token;
  } catch (err) {
    console.error("❌ Gagal ambil token:", err);
    return null;
  }
};
