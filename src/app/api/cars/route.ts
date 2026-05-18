import { BRANDS, CARS, filterCars, searchCars } from "@/data/cars"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const brand = searchParams.get("brand") ?? undefined
  const drivetrain = searchParams.get("drivetrain") ?? undefined
  const base_class = searchParams.get("class") ?? undefined
  const tune_type = searchParams.get("tune_type") ?? undefined
  const car_type = searchParams.get("car_type") ?? undefined
  const brandsOnly = searchParams.get("brands") === "true"

  if (brandsOnly) {
    return NextResponse.json({ brands: BRANDS })
  }

  if (query) {
    return NextResponse.json({ cars: searchCars(query) })
  }

  if (brand || drivetrain || base_class || tune_type || car_type) {
    return NextResponse.json({ cars: filterCars({ brand, drivetrain, base_class, tune_type, car_type }) })
  }

  return NextResponse.json({ cars: CARS })
}
