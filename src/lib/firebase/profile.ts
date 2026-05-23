import { updateProfile } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseDb } from "./client"

export interface UserProfile {
  nickname: string
  photoBase64?: string
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const snap = await getDoc(doc(db, "userProfiles", userId))
  if (!snap.exists()) return null
  const d = snap.data()
  return { nickname: d.nickname ?? "", photoBase64: d.photoBase64 ?? undefined }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const db = getFirebaseDb()
  const auth = getFirebaseAuth()
  if (!db) throw new Error("Firebase não configurado")

  // Validação de tamanho da foto (base64 ~133% do original — limite 150KB base64 ≈ 112KB imagem)
  if (profile.photoBase64 && profile.photoBase64.length > 150_000) {
    throw new Error("Foto muito grande. Máximo 112 KB.")
  }

  // Valida formato base64 de imagem
  if (profile.photoBase64 && !/^data:image\/(jpeg|png|webp);base64,/.test(profile.photoBase64)) {
    throw new Error("Formato de imagem inválido.")
  }

  // Sanitiza nickname
  const nickname = profile.nickname.replace(/[<>"'&]/g, "").slice(0, 64)

  await setDoc(
    doc(db, "userProfiles", userId),
    { nickname, photoBase64: profile.photoBase64 ?? null, updatedAt: serverTimestamp() },
    { merge: true },
  )

  if (auth?.currentUser) {
    await updateProfile(auth.currentUser, { displayName: profile.nickname || null })
  }
}

export function resizeImageToBase64(file: File, maxPx = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const size = Math.min(img.width, img.height, maxPx)
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) { reject(new Error("Canvas indisponível")); return }
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size)
        resolve(canvas.toDataURL("image/jpeg", 0.82))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
