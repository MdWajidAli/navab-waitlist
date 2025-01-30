"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast, Toaster } from "react-hot-toast"
import Image from "next/image"
import { motion } from "framer-motion"

export function WishlistForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return
    setIsLoading(true)

    const toastId = toast.loading("Submitting...")

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Successfully joined!", { id: toastId })
        setEmail("")
      } else {
        toast.error(data.message || "Something went wrong", { id: toastId })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Unable to connect to the server. Please try again later.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#D9DFC6] text-gray-800 flex flex-col justify-start items-center p-4 relative z-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Indulge In Sophistication
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Secure your exclusive access to experience our collection before the
            world
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              src: "/img1.jpg?height=600&width=300",
              alt: "Elegant suit",
            },
            {
              src: "/img2.jpg?height=600&width=300",
              alt: "Stylish dress",
            },
            {
              src: "/img3.jpg?height=600&width=300",
              alt: "Casual outfit",
            },
          ].map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative h-[200px] sm:h-[250px] md:h-[300px] rounded-lg overflow-hidden group"
            >
              <Image
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <p className="text-white text-lg font-semibold">{img.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div
        className={`w-full ${
          isMobile ? "fixed bottom-0 left-0 p-4 bg-[#F5F5DC]" : ""
        }`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row w-full max-w-md mb-4">
            <Input
              type="email"
              required
              className="flex-grow bg-white border-gray-300 text-gray-800 placeholder-gray-500 mb-2 sm:mb-0 sm:mr-2"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full sm:w-auto bg-gray-800 text-white hover:bg-gray-700"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Join Waitlist"}
            </Button>
          </div>
          <p className="text-sm text-gray-600 text-center max-w-md">
            By joining, you'll be the first to receive exclusive insight into
            our highly anticipated launch.
          </p>
        </form>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
          duration: 5000,
        }}
      />
    </main>
  );
}

