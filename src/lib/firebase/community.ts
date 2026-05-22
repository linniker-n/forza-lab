import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"
import { getFirebaseDb } from "./client"
import type { CarClass, Drivetrain, GeneratedTune, TuneType } from "@/types"

export interface CommunityTune {
  id: string
  tune: GeneratedTune
  authorId: string
  authorName: string
  authorPhotoBase64?: string
  tuneType: TuneType
  carId: string
  carBrand: string
  carModel: string
  carYear: number
  targetClass: CarClass
  drivetrain: Drivetrain
  likeCount: number
  likedBy: string[]
  createdAt: string
}

function toIso(ts: unknown): string {
  if (ts && typeof ts === "object" && "toDate" in ts) {
    return (ts as { toDate(): Date }).toDate().toISOString()
  }
  return new Date().toISOString()
}

export async function getCommunityTunes(max = 80): Promise<CommunityTune[]> {
  const db = getFirebaseDb()
  if (!db) return []
  const snap = await getDocs(
    query(collection(db, "communityTunes"), orderBy("createdAt", "desc"), limit(max)),
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      tune: data.tune as GeneratedTune,
      authorId: data.authorId ?? "",
      authorName: data.authorName ?? "Anônimo",
      authorPhotoBase64: data.authorPhotoBase64 ?? undefined,
      tuneType: data.tuneType as TuneType,
      carId: data.carId ?? "",
      carBrand: data.carBrand ?? "",
      carModel: data.carModel ?? "",
      carYear: data.carYear ?? 0,
      targetClass: data.targetClass as CarClass,
      drivetrain: data.drivetrain as Drivetrain,
      likeCount: data.likeCount ?? 0,
      likedBy: (data.likedBy as string[]) ?? [],
      createdAt: toIso(data.createdAt),
    }
  })
}

export async function shareTune(
  tune: GeneratedTune,
  authorId: string,
  authorName: string,
  authorPhotoBase64?: string,
): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firebase não configurado")
  const ref = await addDoc(collection(db, "communityTunes"), {
    tune,
    authorId,
    authorName,
    authorPhotoBase64: authorPhotoBase64 ?? null,
    tuneType: tune.tune_type,
    carId: tune.car.id,
    carBrand: tune.car.brand,
    carModel: tune.car.model,
    carYear: tune.car.year,
    targetClass: tune.target_class,
    drivetrain: tune.drivetrain,
    likeCount: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function toggleLike(
  tuneId: string,
  userId: string,
): Promise<{ likeCount: number; liked: boolean }> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firebase não configurado")
  const tuneRef = doc(db, "communityTunes", tuneId)
  let likeCount = 0
  let liked = false
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(tuneRef)
    if (!snap.exists()) return
    const d = snap.data()
    const likedBy: string[] = d.likedBy ?? []
    const wasLiked = likedBy.includes(userId)
    const newLikedBy = wasLiked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId]
    likeCount = newLikedBy.length
    liked = !wasLiked
    tx.update(tuneRef, { likedBy: newLikedBy, likeCount })
  })
  return { likeCount, liked }
}

export async function deleteCommunityTune(tuneId: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firebase não configurado")
  await deleteDoc(doc(db, "communityTunes", tuneId))
}
