"use client"
import Feature from "./feature"
import { Shirt, Layers, Sparkles } from "lucide-react"
const featureData = [
  { icon: Shirt, title: "A considered wardrobe", content: "Explore versatile shapes and easy essentials for women." },
  { icon: Layers, title: "Style that works together", content: "Build your own combinations with relaxed layers and understated tailoring." },
  { icon: Sparkles, title: "Simply Beyond", content: "Express yourself with clothing that leaves space for your individuality." },
]
export default function Feature02() { return <Feature featureData={featureData} /> }
